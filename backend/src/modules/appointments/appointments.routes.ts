import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { appointmentsService } from './appointments.service'
import { authenticate } from '../../middleware/authenticate'
import prisma from '../../config/database'
import {
  createAppointmentSchema,
  reserveSlotSchema,
} from './appointments.schema'
import { reserveSlot, releaseSlotReservation } from '../../config/redis'
import { bookingRateLimit } from '../../plugins/rate-limit'

export async function appointmentsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [authenticate, bookingRateLimit] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const body = createAppointmentSchema.parse(request.body)

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const appointment = await appointmentsService.createAppointment({
          ...body,
          patientId: patient.id,
        })

        return reply.status(201).send({
          success: true,
          data: appointment,
          message: 'Rendez-vous créé avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la création du rendez-vous'
        return reply.status(400).send({
          success: false,
          message,
        })
      }
    },
  )

  // reserve a slot temporarily (10 minutes)
  fastify.post(
    '/reserve-slot',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const body = reserveSlotSchema.parse(request.body)

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const reserved = await reserveSlot(
          body.practitionerId,
          body.appointmentDate,
          body.startTime,
          patient.id,
        )

        if (!reserved) {
          return reply.status(409).send({
            success: false,
            message: 'Ce créneau est déjà réservé par un autre patient',
          })
        }

        return reply.status(200).send({
          success: true,
          message: 'Créneau réservé pour 10 minutes',
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(400).send({
          success: false,
          message: 'Erreur lors de la réservation du créneau',
        })
      }
    },
  )

  // release a slot reservation
  fastify.delete(
    '/reserve-slot',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = reserveSlotSchema.parse(request.body)

        await releaseSlotReservation(
          body.practitionerId,
          body.appointmentDate,
          body.startTime,
        )

        return reply.status(200).send({
          success: true,
          message: 'Réservation annulée',
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(400).send({
          success: false,
          message: "Erreur lors de l'annulation de la réservation",
        })
      }
    },
  )

  fastify.get(
    '/patient',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const query = request.query as {
          status?: string
          limit?: string
          page?: string
          sort?: string
        }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const status =
          (query.status as 'upcoming' | 'past' | 'cancelled' | 'all') || 'all'
        const limit = query.limit ? parseInt(query.limit, 10) : 10
        const page = query.page ? parseInt(query.page, 10) : 1
        const sort = (query.sort as 'asc' | 'desc') || undefined

        const result = await appointmentsService.getPatientAppointments(
          patient.id,
          status,
          limit,
          page,
          sort,
        )

        return reply.status(200).send({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Failed to get appointments',
        })
      }
    },
  )

  fastify.get(
    '/patient/next',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const appointment = await appointmentsService.getNextAppointment(
          patient.id,
        )

        return reply.status(200).send({
          success: true,
          data: appointment,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Failed to get next appointment',
        })
      }
    },
  )

  fastify.get(
    '/patient/past',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const appointments = await appointmentsService.getPastAppointments(
          patient.id,
          5,
        )

        return reply.status(200).send({
          success: true,
          data: appointments,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Failed to get past appointments',
        })
      }
    },
  )

  fastify.patch(
    '/:id/cancel',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { id } = request.params as { id: string }
        const body = request.body as { reason?: string }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        await appointmentsService.cancelAppointment(
          id,
          patient.id,
          body?.reason,
        )

        return reply.status(200).send({
          success: true,
          message: 'Rendez-vous annulé avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de l'annulation du rendez-vous"
        return reply.status(400).send({
          success: false,
          message,
        })
      }
    },
  )

  fastify.patch(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const { id } = request.params as { id: string }
        const body = request.body as {
          appointmentDate?: string
          startTime?: string
        }

        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!patient) {
          return reply.status(404).send({
            success: false,
            message: 'Patient profile not found',
          })
        }

        const updated = await appointmentsService.updateAppointment(
          id,
          patient.id,
          body,
        )

        return reply.status(200).send({
          success: true,
          data: updated,
          message: 'Rendez-vous modifié avec succès',
        })
      } catch (error) {
        request.log.error(error)
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la modification du rendez-vous'
        return reply.status(400).send({
          success: false,
          message,
        })
      }
    },
  )
}
