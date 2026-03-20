import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentsService } from './documents.service'
import { authenticate } from '../../middleware/authenticate'
import {
  getDocumentsQuerySchema,
  uploadDocumentSchema,
} from './documents.schema'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import '@fastify/multipart'
import prisma from '../../config/database'

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

        const data = await (request as any).file()
        if (!data) {
          return reply.status(400).send({
            success: false,
            message: 'Aucun fichier fourni',
          })
        }

        // Parse fields from multipart
        const fields: Record<string, string> = {}
        for (const [key, field] of Object.entries(data.fields)) {
          if (field && typeof field === 'object' && 'value' in field) {
            fields[key] = (field as any).value
          }
        }

        const validated = uploadDocumentSchema.parse(fields)

        // Ensure uploads directory exists
        const uploadsDir = path.resolve('uploads', 'patient-documents')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }

        const ext = path.extname(data.filename)
        const uniqueName = `${randomUUID()}${ext}`
        const filePath = path.join(uploadsDir, uniqueName)

        // Save file
        const fileBuffer = await data.toBuffer()
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
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors du téléversement du document'
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
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la suppression du document'
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
}
