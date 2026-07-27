import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { MultipartFile } from '@fastify/multipart'
import jwt from 'jsonwebtoken'
import prisma from '../../config/database'
import { authenticate } from '../../middleware/authenticate'
import { sanitizeErrorMessage } from '../../utils/errors'
import { medibotService } from './medibot.service'
import { medibotMessageSchema, medibotLinkSchema } from './medibot.schema'

interface PatientContext {
  patientId: string | null
  isAuthenticated: boolean
  /** true when a logged-in NON-patient tried to use Medibot (patients only). */
  blockedNonPatient: boolean
}

/**
 * Optional authentication for Medibot.
 * Anonymous visitors are allowed (patientId = null). A valid patient token
 * resolves their Patient.id. A valid token for any OTHER role is rejected —
 * Medibot is exclusively for patients.
 */
async function resolvePatientContext(request: FastifyRequest): Promise<PatientContext> {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { patientId: null, isAuthenticated: false, blockedNonPatient: false }
  }

  try {
    const token = authHeader.substring(7)
    const secret = process.env.BACKEND_JWT_SECRET
    if (!secret) throw new Error('JWT secret not configured')

    const decoded = jwt.verify(token, secret) as { userId: string; role: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true },
    })

    if (!user || user.status !== 'ACTIVE') {
      return { patientId: null, isAuthenticated: false, blockedNonPatient: false }
    }
    if (user.role !== 'PATIENT') {
      return { patientId: null, isAuthenticated: false, blockedNonPatient: true }
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    return {
      patientId: patient?.id ?? null,
      isAuthenticated: Boolean(patient),
      blockedNonPatient: false,
    }
  } catch {
    // Invalid/expired token → treat as anonymous (frontend refreshes tokens).
    return { patientId: null, isAuthenticated: false, blockedNonPatient: false }
  }
}

const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])
const MAX_DOC_BYTES = 8 * 1024 * 1024

export async function medibotRoutes(fastify: FastifyInstance) {
  // Whether the AI backend is configured (frontend can show a graceful state).
  fastify.get('/status', async () => {
    return { success: true, data: { configured: medibotService.isConfigured() } }
  })

  // Main chat turn — available to anonymous visitors and patients.
  fastify.post('/message', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ctx = await resolvePatientContext(request)
      if (ctx.blockedNonPatient) {
        return reply.status(403).send({
          success: false,
          message: 'Medibot est réservé aux patients.',
        })
      }

      const parsed = medibotMessageSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Requête invalide',
        })
      }
      const body = parsed.data
      const timezoneOffset = request.headers['x-timezone-offset'] as string | undefined

      const result = await medibotService.sendMessage({
        text: body.message,
        sessionId: body.sessionId ?? null,
        conversationId: body.conversationId ?? null,
        patientId: ctx.patientId,
        isAuthenticated: ctx.isAuthenticated,
        timezoneOffset,
      })

      return reply.status(200).send({ success: true, data: result })
    } catch (error) {
      request.log.error(error)
      if (error instanceof Error && error.message === 'MEDIBOT_NOT_CONFIGURED') {
        return reply.status(503).send({
          success: false,
          message: "Medibot n'est pas encore configuré. Réessayez plus tard.",
        })
      }
      const message = sanitizeErrorMessage(error, "Erreur lors de l'échange avec Medibot")
      return reply.status(400).send({ success: false, message })
    }
  })

  // Fetch the current conversation history (to restore the panel).
  fastify.get('/conversation', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ctx = await resolvePatientContext(request)
      if (ctx.blockedNonPatient) {
        return reply.status(403).send({ success: false, message: 'Medibot est réservé aux patients.' })
      }

      const query = request.query as { sessionId?: string; conversationId?: string }
      let conversation = null

      if (ctx.patientId) {
        conversation = await prisma.medibotConversation.findFirst({
          where: { patientId: ctx.patientId, status: 'ACTIVE' },
          orderBy: { lastActive: 'desc' },
          select: { id: true },
        })
      } else if (query.sessionId) {
        conversation = await prisma.medibotConversation.findFirst({
          where: { sessionId: query.sessionId, patientId: null, status: 'ACTIVE' },
          orderBy: { lastActive: 'desc' },
          select: { id: true },
        })
      }

      if (!conversation) {
        return reply.status(200).send({ success: true, data: { conversationId: null, messages: [] } })
      }

      const messages = await medibotService.getConversationMessages(conversation.id)
      return reply.status(200).send({
        success: true,
        data: { conversationId: conversation.id, messages },
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ success: false, message: 'Erreur lors du chargement de la conversation' })
    }
  })

  // Link an anonymous session's conversation to the patient after they log in.
  fastify.post(
    '/link',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        if (user.role !== 'PATIENT') {
          return reply.status(403).send({ success: false, message: 'Medibot est réservé aux patients.' })
        }
        const body = medibotLinkSchema.parse(request.body)
        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
        if (!patient) {
          return reply.status(404).send({ success: false, message: 'Profil patient introuvable.' })
        }

        await medibotService.linkSessionToPatient(body.sessionId, patient.id)
        return reply.status(200).send({ success: true, message: 'Conversation liée' })
      } catch (error) {
        request.log.error(error)
        return reply.status(400).send({ success: false, message: 'Erreur lors de la liaison de la conversation' })
      }
    },
  )

  // Analyze an uploaded medical document (patients only).
  fastify.post(
    '/document',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        if (user.role !== 'PATIENT') {
          return reply.status(403).send({ success: false, message: 'Medibot est réservé aux patients.' })
        }
        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
        if (!patient) {
          return reply.status(404).send({ success: false, message: 'Profil patient introuvable.' })
        }

        const multipartRequest = request as FastifyRequest & {
          file: () => Promise<MultipartFile | undefined>
        }
        const data = await multipartRequest.file()
        if (!data) {
          return reply.status(400).send({ success: false, message: 'Aucun fichier fourni.' })
        }
        if (!ALLOWED_DOC_MIME.has(data.mimetype)) {
          return reply.status(400).send({
            success: false,
            message: 'Format non supporté. Formats acceptés : PDF, PNG, JPEG, WEBP.',
          })
        }

        const buffer = await data.toBuffer()
        if (buffer.length > MAX_DOC_BYTES) {
          return reply.status(400).send({ success: false, message: 'Fichier trop volumineux (max 8 Mo).' })
        }

        const fields = data.fields as Record<string, { value?: string } | undefined>
        const question =
          typeof fields?.question?.value === 'string' ? fields.question.value : undefined
        const conversationId =
          typeof fields?.conversationId?.value === 'string' ? fields.conversationId.value : undefined

        const result = await medibotService.analyzeDocument({
          conversationId,
          patientId: patient.id,
          mimeType: data.mimetype,
          base64: buffer.toString('base64'),
          filename: data.filename,
          question,
        })

        return reply.status(200).send({ success: true, data: result })
      } catch (error) {
        request.log.error(error)
        if (error instanceof Error && error.message === 'MEDIBOT_NOT_CONFIGURED') {
          return reply.status(503).send({
            success: false,
            message: "Medibot n'est pas encore configuré. Réessayez plus tard.",
          })
        }
        const message = sanitizeErrorMessage(error, "Erreur lors de l'analyse du document")
        return reply.status(400).send({ success: false, message })
      }
    },
  )
}
