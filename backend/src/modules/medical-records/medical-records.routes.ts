import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { medicalRecordsService } from './medical-records.service'
import { authenticate } from '../../middleware/authenticate'
import { sanitizeErrorMessage } from '../../utils/errors'
import {
  updateProfileSchema,
  updateAntecedentsSchema,
  createVaccinationSchema,
} from './medical-records.schema'
import path from 'path'
import fs from 'fs'

export async function medicalRecordsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/profile',
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

        const profile = await medicalRecordsService.getPatientProfile(user.id)

        if (!profile) {
          return reply.status(404).send({
            success: false,
            message: 'Profil patient non trouvé',
          })
        }

        return reply.send({ success: true, data: profile })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération du profil',
        })
      }
    },
  )

  fastify.patch(
    '/profile',
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

        const body = updateProfileSchema.parse(request.body)
        const profile = await medicalRecordsService.updatePatientProfile(
          user.id,
          body,
        )

        return reply.send({
          success: true,
          data: profile,
          message: 'Profil mis à jour avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, 'Erreur lors de la mise à jour du profil')
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  fastify.patch(
    '/antecedents',
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

        const body = updateAntecedentsSchema.parse(request.body)
        const antecedents = await medicalRecordsService.updateAntecedents(
          user.id,
          body,
        )

        return reply.send({
          success: true,
          data: antecedents,
          message: 'Antécédents mis à jour avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, 'Erreur lors de la mise à jour des antécédents')
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  fastify.get(
    '/consultations',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const query = request.query as { page?: string; limit?: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const page = parseInt(query.page || '1', 10)
        const limit = parseInt(query.limit || '10', 10)

        const result = await medicalRecordsService.getConsultations(
          user.id,
          page,
          limit,
        )

        return reply.send({
          success: true,
          data: result.data,
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
          message: 'Erreur lors de la récupération des consultations',
        })
      }
    },
  )

  fastify.get(
    '/prescriptions',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const query = request.query as { page?: string; limit?: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const page = parseInt(query.page || '1', 10)
        const limit = parseInt(query.limit || '10', 10)

        const result = await medicalRecordsService.getPrescriptions(
          user.id,
          page,
          limit,
        )

        return reply.send({
          success: true,
          data: result.data,
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
          message: 'Erreur lors de la récupération des ordonnances',
        })
      }
    },
  )

  fastify.get(
    '/documents',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const query = request.query as {
          page?: string
          limit?: string
          type?: string
        }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({
            success: false,
            message: 'Accès réservé aux patients',
          })
        }

        const page = parseInt(query.page || '1', 10)
        const limit = parseInt(query.limit || '10', 10)

        const result = await medicalRecordsService.getDocuments(
          user.id,
          query.type,
          page,
          limit,
        )

        return reply.send({
          success: true,
          data: result.data,
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
    '/documents/:id/download',
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

        const document = await medicalRecordsService.getDocumentForDownload(
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
    '/vaccinations',
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

        const vaccinations = await medicalRecordsService.getVaccinations(
          user.id,
        )

        return reply.send({ success: true, data: vaccinations })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des vaccinations',
        })
      }
    },
  )

  fastify.post(
    '/vaccinations',
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

        const body = createVaccinationSchema.parse(request.body)
        const vaccination = await medicalRecordsService.createVaccination(
          user.id,
          body,
        )

        return reply.status(201).send({
          success: true,
          data: vaccination,
          message: 'Vaccination ajoutée avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, "Erreur lors de l'ajout de la vaccination")
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  fastify.delete(
    '/vaccinations/:id',
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

        await medicalRecordsService.deleteVaccination(user.id, params.id)

        return reply.send({
          success: true,
          message: 'Vaccination supprimée avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message = sanitizeErrorMessage(error, 'Erreur lors de la suppression de la vaccination')
        return reply.status(400).send({ success: false, message })
      }
    },
  )
}
