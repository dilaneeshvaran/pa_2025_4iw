import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { reviewsService } from './reviews.service'
import { createReviewSchema } from './reviews.schema'
import prisma from '../../config/database'

export async function reviewsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        if (user.role !== 'PATIENT') {
          return reply.status(403).send({ success: false, message: 'Accès refusé' })
        }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({ success: false, message: 'Patient introuvable' })
        }

        const body = createReviewSchema.parse(request.body)
        const review = await reviewsService.createReview(patient.id, body)

        return reply.status(201).send({ success: true, data: review, message: 'Avis publié avec succès' })
      } catch (error) {
        request.log.error(error)
        const message = error instanceof Error ? error.message : 'Erreur lors de la publication de l\'avis'
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  fastify.get(
    '/appointment/:appointmentId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { appointmentId } = request.params as { appointmentId: string }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({ success: false, message: 'Patient introuvable' })
        }

        const review = await reviewsService.getReviewByAppointment(appointmentId, patient.id)

        return reply.status(200).send({ success: true, data: review })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ success: false, message: 'Erreur serveur' })
      }
    },
  )

  fastify.get(
    '/practitioner/:practitionerId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { practitionerId } = request.params as { practitionerId: string }
        const reviews = await reviewsService.getPractitionerReviews(practitionerId)

        return reply.status(200).send({ success: true, data: reviews })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ success: false, message: 'Erreur serveur' })
      }
    },
  )
}
