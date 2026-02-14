import { FastifyInstance } from 'fastify'
import { availabilitiesService } from './availabilities.service'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import prisma from '../../config/database'
import {
  upsertAvailabilitySchema,
  createAbsenceSchema,
  createBlockedSlotSchema,
  updateSettingsSchema,
  createPractitionerAppointmentSchema,
} from './availabilities.schema'

async function getPractitionerId(userId: string): Promise<string | null> {
  const p = await prisma.practitioner.findUnique({
    where: { userId },
    select: { id: true },
  })
  return p?.id || null
}

export async function availabilitiesRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, authorize(['PRACTITIONER'])]

  fastify.get('/availabilities', { preHandler }, async (request, reply) => {
    const practitionerId = await getPractitionerId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const data = await availabilitiesService.getAvailabilities(practitionerId)
    return reply.send({ success: true, data })
  })

  fastify.post('/availabilities', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const body = upsertAvailabilitySchema.parse(request.body)
      const data = await availabilitiesService.upsertAvailability(
        practitionerId,
        body,
      )
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      if (error.name === 'ZodError')
        return reply
          .status(400)
          .send({ success: false, message: 'Validation error', errors: error })
      return reply
        .status(400)
        .send({ success: false, message: error.message || 'Erreur' })
    }
  })

  fastify.delete(
    '/availabilities/:id',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId = await getPractitionerId(request.user!.id)
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        await availabilitiesService.deleteAvailability(practitionerId, id)
        return reply.send({ success: true, message: 'Créneau supprimé' })
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.get('/absences', { preHandler }, async (request, reply) => {
    const practitionerId = await getPractitionerId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const data = await availabilitiesService.getAbsences(practitionerId)
    return reply.send({ success: true, data })
  })

  fastify.post('/absences', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const body = createAbsenceSchema.parse(request.body)
      const data = await availabilitiesService.createAbsence(
        practitionerId,
        body,
      )
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      if (error.name === 'ZodError')
        return reply
          .status(400)
          .send({ success: false, message: 'Validation error', errors: error })
      return reply
        .status(400)
        .send({ success: false, message: error.message || 'Erreur' })
    }
  })

  fastify.delete('/absences/:id', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { id } = request.params as { id: string }
      await availabilitiesService.deleteAbsence(practitionerId, id)
      return reply.send({ success: true, message: 'Absence supprimée' })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  })

  fastify.post(
    '/absences/:id/notify',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId = await getPractitionerId(request.user!.id)
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        const result = await availabilitiesService.notifyPatientsForAbsence(
          practitionerId,
          id,
        )
        return reply.send({
          success: true,
          message: `${result.notifiedCount} patient(s) notifié(s)`,
          data: result,
        })
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.get('/blocked-slots', { preHandler }, async (request, reply) => {
    const practitionerId = await getPractitionerId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const data = await availabilitiesService.getBlockedSlots(practitionerId)
    return reply.send({ success: true, data })
  })

  fastify.post('/blocked-slots', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const body = createBlockedSlotSchema.parse(request.body)
      const data = await availabilitiesService.createBlockedSlot(
        practitionerId,
        body,
      )
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      if (error.name === 'ZodError')
        return reply
          .status(400)
          .send({ success: false, message: 'Validation error', errors: error })
      return reply
        .status(400)
        .send({ success: false, message: error.message || 'Erreur' })
    }
  })

  fastify.delete(
    '/blocked-slots/:id',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId = await getPractitionerId(request.user!.id)
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        await availabilitiesService.deleteBlockedSlot(practitionerId, id)
        return reply.send({
          success: true,
          message: 'Créneau bloqué supprimé',
        })
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.get('/settings', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const data = await availabilitiesService.getSettings(practitionerId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message })
    }
  })

  fastify.patch('/settings', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const body = updateSettingsSchema.parse(request.body)
      const data = await availabilitiesService.updateSettings(
        practitionerId,
        body,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      if (error.name === 'ZodError')
        return reply
          .status(400)
          .send({ success: false, message: 'Validation error', errors: error })
      return reply
        .status(400)
        .send({ success: false, message: error.message || 'Erreur' })
    }
  })

  fastify.get('/appointments', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { startDate, endDate } = request.query as {
        startDate: string
        endDate: string
      }
      if (!startDate || !endDate)
        return reply
          .status(400)
          .send({ success: false, message: 'startDate et endDate requis' })

      const data = await availabilitiesService.getAppointments(
        practitionerId,
        startDate,
        endDate,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message })
    }
  })

  fastify.get('/day-summary', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { date } = request.query as { date: string }
      if (!date)
        return reply
          .status(400)
          .send({ success: false, message: 'date requise' })

      const data = await availabilitiesService.getDaySummary(
        practitionerId,
        date,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message })
    }
  })

  fastify.post('/appointments', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const body = createPractitionerAppointmentSchema.parse(request.body)
      const data = await availabilitiesService.createAppointmentByPractitioner(
        practitionerId,
        body,
      )
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      if (error.name === 'ZodError')
        return reply
          .status(400)
          .send({ success: false, message: 'Validation error', errors: error })
      return reply
        .status(400)
        .send({ success: false, message: error.message || 'Erreur' })
    }
  })

  fastify.get('/patients/search', { preHandler }, async (request, reply) => {
    try {
      const practitionerId = await getPractitionerId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { q } = request.query as { q: string }
      if (!q || q.length < 2) return reply.send({ success: true, data: [] })

      const data = await availabilitiesService.searchPatients(practitionerId, q)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message })
    }
  })
}
