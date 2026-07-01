import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentsService } from './documents.service'
import { authenticate } from '../../middleware/authenticate'
import { sanitizeErrorMessage } from '../../utils/errors'
import {
  getDocumentsQuerySchema,
  uploadDocumentSchema,
} from './documents.schema'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import '@fastify/multipart'
import type { MultipartFile } from '@fastify/multipart'
import prisma from '../../config/database'

// UPLOAD_DIR can be overridden via environment variable (useful for Docker volume mounts).
// Default mirrors the relative path used in development (cwd = backend/).
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve('uploads')

type MultipartFieldValue = { value?: unknown }
type MultipartFields = Record<string, MultipartFieldValue>

const extractMultipartFields = (fields: MultipartFields): Record<string, string> => {
  const values: Record<string, string> = {}

  for (const [key, field] of Object.entries(fields)) {
    if (typeof field?.value === 'string') {
      values[key] = field.value
    }
  }

  return values
}

const getMultipartFile = async (
  request: FastifyRequest,
): Promise<MultipartFile | undefined> => {
  const multipartRequest = request as FastifyRequest & {
    file: () => Promise<MultipartFile | undefined>
  }

  return multipartRequest.file()
}

export async function documentsRoutes(fastify: FastifyInstance) {
  // docs received from practitioners
  fastify.get(
    '/received',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const query = getDocumentsQuerySchema.parse(request.query)
        const page = parseInt(query.page, 10)
        const limit = parseInt(query.limit, 10)

        const result = await documentsService.getReceivedDocuments(
          user.id,
          query.type,
          query.search,
          page,
          limit,
        )

        return reply.send({
          success: true,
          data: result.data,
          counts: result.counts,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des documents',
        })
      }
    },
  )

  // patient's own uploaded documents
  fastify.get(
    '/own',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const query = getDocumentsQuerySchema.parse(request.query)
        const page = parseInt(query.page, 10)
        const limit = parseInt(query.limit, 10)

        const result = await documentsService.getPatientOwnDocuments(
          user.id,
          query.type,
          query.search,
          page,
          limit,
        )

        return reply.send({
          success: true,
          data: result.data,
          counts: result.counts,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des documents',
        })
      }
    },
  )

  fastify.get(
    '/:id/download',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const document = await documentsService.getDocumentForAccess(
          user.id,
          params.id,
        )

        if (!document) {
          return reply.status(404).send({
            success: false,
            message: 'Document non trouvé',
          })
        }

        const filePath = path.resolve(document.filePath)

        if (!fs.existsSync(filePath)) {
          fastify.log.warn({ filePath, documentId: params.id }, 'Document file not found on disk')
          return reply.status(404).send({
            success: false,
            message: 'Fichier non trouvé sur le serveur',
          })
        }

        //filesystem stream for performance = avoid loading entire file in memory
        const stream = fs.createReadStream(filePath)
        return reply
          .header('Content-Type', document.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${document.fileName}"`,
          )
          .send(stream)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors du téléchargement du document',
        })
      }
    },
  )

  fastify.get(
    '/:id/view',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const document = await documentsService.getDocumentForAccess(
          user.id,
          params.id,
        )

        if (!document) {
          return reply.status(404).send({
            success: false,
            message: 'Document non trouvé',
          })
        }

        const filePath = path.resolve(document.filePath)

        if (!fs.existsSync(filePath)) {
          return reply.status(404).send({
            success: false,
            message: 'Fichier non trouvé sur le serveur',
          })
        }

        const stream = fs.createReadStream(filePath)
        return reply
          .header('Content-Type', document.mimeType)
          .header(
            'Content-Disposition',
            `inline; filename="${document.fileName}"`,
          )
          .send(stream)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la visualisation du document',
        })
      }
    },
  )

  fastify.post(
    '/upload',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const data = await getMultipartFile(request)
        if (!data) {
          return reply.status(400).send({
            success: false,
            message: 'Aucun fichier fourni',
          })
        }

        const fileBuffer = await data.toBuffer()

        // Parse fields from multipart
        const fields = extractMultipartFields(data.fields as MultipartFields)
        const validated = uploadDocumentSchema.parse(fields)

        // Ensure uploads directory exists
        const uploadsDir = path.join(UPLOAD_DIR, 'patient-documents')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }

        const ext = path.extname(data.filename)
        const uniqueName = `${randomUUID()}${ext}`
        const filePath = path.join(uploadsDir, uniqueName)

        // Save file
        fs.writeFileSync(filePath, fileBuffer)

        const document = await documentsService.uploadPatientDocument(user.id, {
          type: validated.type,
          title: validated.title,
          description: validated.description,
          fileName: data.filename,
          filePath,
          fileSize: fileBuffer.length,
          mimeType: data.mimetype,
        })

        return reply.status(201).send({
          success: true,
          data: document,
          message: 'Document téléversé avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, 'Erreur lors du téléversement du document')
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  fastify.delete(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const doc = await documentsService.deletePatientDocument(
          user.id,
          params.id,
        )

        // try  delete the physical file
        try {
          if (fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath)
          }
        } catch {
          // dont block now, file cleaning will happen with scheduled job
        }

        return reply.send({
          success: true,
          message: 'Document supprimé avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, 'Erreur lors de la suppression du document')
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  // practitioner: download patient document
  fastify.get(
    '/patient/:patientId/:id/download',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { patientId, id: documentId } = request.params as {
          patientId: string
          id: string
        }

        if (user.role !== 'PRACTITIONER') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux praticiens',
          })
        }

        const practitioner = await prisma.practitioner.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!practitioner) {
          return reply.status(404).send({
            success: false,
            message: 'Profil praticien non trouvé',
          })
        }

        const document =
          await documentsService.getDocumentForPractitionerAccess(
            practitioner.id,
            patientId,
            documentId,
          )

        if (!document) {
          return reply.status(404).send({
            success: false,
            message: 'Document non trouvé',
          })
        }

        const filePath = path.resolve(document.filePath)

        if (!fs.existsSync(filePath)) {
          return reply.status(404).send({
            success: false,
            message: 'Fichier non trouvé sur le serveur',
          })
        }

        const stream = fs.createReadStream(filePath)
        return reply
          .header('Content-Type', document.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${document.fileName}"`,
          )
          .send(stream)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors du téléchargement du document',
        })
      }
    },
  )

  // practitioner: view patient document
  fastify.get(
    '/patient/:patientId/:id/view',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { patientId, id: documentId } = request.params as {
          patientId: string
          id: string
        }

        if (user.role !== 'PRACTITIONER') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux praticiens',
          })
        }

        const practitioner = await prisma.practitioner.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!practitioner) {
          return reply.status(404).send({
            success: false,
            message: 'Profil praticien non trouvé',
          })
        }

        const document =
          await documentsService.getDocumentForPractitionerAccess(
            practitioner.id,
            patientId,
            documentId,
          )

        if (!document) {
          return reply.status(404).send({
            success: false,
            message: 'Document non trouvé',
          })
        }

        const filePath = path.resolve(document.filePath)

        if (!fs.existsSync(filePath)) {
          return reply.status(404).send({
            success: false,
            message: 'Fichier non trouvé sur le serveur',
          })
        }

        const stream = fs.createReadStream(filePath)
        return reply
          .header('Content-Type', document.mimeType)
          .header(
            'Content-Disposition',
            `inline; filename="${document.fileName}"`,
          )
          .send(stream)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la visualisation du document',
        })
      }
    },
  )

  // practitioner: upload a document to a patient
  fastify.post(
    '/patient/:patientId/upload',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { patientId } = request.params as { patientId: string }

        if (user.role !== 'PRACTITIONER') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux praticiens',
          })
        }

        const data = await getMultipartFile(request)
        if (!data) {
          return reply.status(400).send({
            success: false,
            message: 'Aucun fichier fourni',
          })
        }

        // validate MIME type
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]
        if (!allowedMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            success: false,
            message:
              'Type de fichier non autorisé. Formats acceptés : PDF, images, Word.',
          })
        }

        const fileBuffer = await data.toBuffer()

        // parse fields after the file stream is consumed to avoid missing values
        // when multipart sends the file part before text fields.
        const fields = extractMultipartFields(data.fields as MultipartFields)
        const validated = uploadDocumentSchema.parse(fields)

        // save file
        const uploadsDir = path.join(UPLOAD_DIR, 'practitioner-documents')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }

        // enforce 10 MB size limit
        const MAX_SIZE = 10 * 1024 * 1024
        if (fileBuffer.length > MAX_SIZE) {
          return reply.status(400).send({
            success: false,
            message: 'Le fichier dépasse la taille maximale autorisée (10 Mo)',
          })
        }

        const ext = path.extname(data.filename)
        const uniqueName = `${randomUUID()}${ext}`
        const filePath = path.join(uploadsDir, uniqueName)
        fs.writeFileSync(filePath, fileBuffer)

        const document = await documentsService.uploadDocumentForPatient(
          user.id,
          patientId,
          {
            type: validated.type,
            title: validated.title,
            description: validated.description,
            fileName: data.filename,
            filePath,
            fileSize: fileBuffer.length,
            mimeType: data.mimetype,
          },
        )

        return reply.status(201).send({
          success: true,
          data: document,
          message: 'Document envoyé avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(
          error,
          "Erreur lors de l'envoi du document",
        )
        return reply.status(400).send({ success: false, message })
      }
    },
  )
}
