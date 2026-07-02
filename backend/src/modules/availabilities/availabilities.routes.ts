import { FastifyInstance } from 'fastify'
import { availabilitiesService } from './availabilities.service'
import { sanitizeErrorMessage } from '../../utils/errors'
import { practitionersService } from '../practitioners/practitioners.service'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import {
  upsertAvailabilitySchema,
  createAbsenceSchema,
  createBlockedSlotSchema,
  updateSettingsSchema,
  createPractitionerAppointmentSchema,
  practitionerCancelAppointmentSchema,
  practitionerModifyAppointmentSchema,
} from './availabilities.schema'

export async function availabilitiesRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, authorize(['PRACTITIONER'])]

  fastify.get('/availabilities', { preHandler }, async (request, reply) => {
    const practitionerId =
      await practitionersService.getPractitionerIdFromUserId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const { cabinetId } = request.query as { cabinetId?: string }
    let filterCabinetId: string | null | undefined = undefined
    if (cabinetId === 'null') {
      filterCabinetId = null
    } else if (cabinetId) {
      filterCabinetId = cabinetId
    }

    const data = await availabilitiesService.getAvailabilities(practitionerId, filterCabinetId)
    return reply.send({ success: true, data })
  })

  fastify.post('/availabilities', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
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
        .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
    }
  })

  fastify.delete(
    '/availabilities/:id',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
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
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  fastify.get('/absences', { preHandler }, async (request, reply) => {
    const practitionerId =
      await practitionersService.getPractitionerIdFromUserId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const { cabinetId, startDate, endDate } = request.query as {
      cabinetId?: string
      startDate?: string
      endDate?: string
    }
    let filterCabinetId: string | null | undefined = undefined
    if (cabinetId === 'null') {
      filterCabinetId = null
    } else if (cabinetId) {
      filterCabinetId = cabinetId
    }

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    if (start) start.setHours(0, 0, 0, 0)
    if (end) end.setHours(23, 59, 59, 999)

    const data = await availabilitiesService.getAbsences(
      practitionerId,
      filterCabinetId,
      start,
      end,
    )
    return reply.send({ success: true, data })
  })

  fastify.post('/absences', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
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
        .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
    }
  })

  fastify.delete('/absences/:id', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { id } = request.params as { id: string }
      await availabilitiesService.deleteAbsence(practitionerId, id)
      return reply.send({ success: true, message: 'Absence supprimée' })
    } catch (error: any) {
      return reply
        .status(500)
        .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  })

  fastify.post(
    '/absences/:id/notify',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
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
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  fastify.get('/blocked-slots', { preHandler }, async (request, reply) => {
    const practitionerId =
      await practitionersService.getPractitionerIdFromUserId(request.user!.id)
    if (!practitionerId)
      return reply
        .status(404)
        .send({ success: false, message: 'Profil praticien non trouvé' })

    const { cabinetId, startDate, endDate } = request.query as {
      cabinetId?: string
      startDate?: string
      endDate?: string
    }
    let filterCabinetId: string | null | undefined = undefined
    if (cabinetId === 'null') {
      filterCabinetId = null
    } else if (cabinetId) {
      filterCabinetId = cabinetId
    }

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    if (start) start.setHours(0, 0, 0, 0)
    if (end) end.setHours(23, 59, 59, 999)

    const data = await availabilitiesService.getBlockedSlots(
      practitionerId,
      filterCabinetId,
      start,
      end,
    )
    return reply.send({ success: true, data })
  })

  fastify.post('/blocked-slots', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
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
        .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
    }
  })

  fastify.delete(
    '/blocked-slots/:id',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
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
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  fastify.get('/settings', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const data = await availabilitiesService.getSettings(practitionerId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  })

  fastify.patch('/settings', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
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
        .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
    }
  })

  fastify.get('/appointments', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { startDate, endDate, cabinetId } = request.query as {
        startDate: string
        endDate: string
        cabinetId?: string
      }
      if (!startDate || !endDate)
        return reply
          .status(400)
          .send({ success: false, message: 'startDate et endDate requis' })

      let filterCabinetId: string | null | undefined = undefined
      if (cabinetId === 'null') {
        filterCabinetId = null
      } else if (cabinetId) {
        filterCabinetId = cabinetId
      }

      const data = await availabilitiesService.getAppointments(
        practitionerId,
        startDate,
        endDate,
        filterCabinetId,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  })

  fastify.get('/day-summary', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { date, cabinetId } = request.query as { date: string; cabinetId?: string }
      if (!date)
        return reply
          .status(400)
          .send({ success: false, message: 'date requise' })

      let filterCabinetId: string | null | undefined = undefined
      if (cabinetId === 'null') {
        filterCabinetId = null
      } else if (cabinetId) {
        filterCabinetId = cabinetId
      }

      const data = await availabilitiesService.getDaySummary(
        practitionerId,
        date,
        filterCabinetId,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  })

  fastify.post('/appointments', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
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
        .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
    }
  })

  fastify.get('/patients/search', { preHandler }, async (request, reply) => {
    try {
      const practitionerId =
        await practitionersService.getPractitionerIdFromUserId(request.user!.id)
      if (!practitionerId)
        return reply
          .status(404)
          .send({ success: false, message: 'Profil praticien non trouvé' })

      const { q } = request.query as { q: string }
      if (!q || q.length < 2) return reply.send({ success: true, data: [] })

      const data = await availabilitiesService.searchPatients(practitionerId, q)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  })

  // cancel appointment for practitioner
  fastify.patch(
    '/appointments/:id/cancel',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        const body = practitionerCancelAppointmentSchema.parse(request.body)
        const data =
          await availabilitiesService.cancelAppointmentByPractitioner(
            practitionerId,
            id,
            body,
          )
        return reply.send({ success: true, data })
      } catch (error: any) {
        if (error.name === 'ZodError')
          return reply.status(400).send({
            success: false,
            message: 'Validation error',
            errors: error,
          })
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  // modify appointment by practitioner
  fastify.patch(
    '/appointments/:id/modify',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        const body = practitionerModifyAppointmentSchema.parse(request.body)
        const data =
          await availabilitiesService.modifyAppointmentByPractitioner(
            practitionerId,
            id,
            body,
          )
        return reply.send({ success: true, data })
      } catch (error: any) {
        if (error.name === 'ZodError')
          return reply.status(400).send({
            success: false,
            message: 'Validation error',
            errors: error,
          })
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  // mark appointment as presenté
  fastify.patch(
    '/appointments/:id/attended',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        const data = await availabilitiesService.markAppointmentAttended(
          practitionerId,
          id,
        )
        return reply.send({ success: true, data })
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  // mark as noshow
  fastify.patch(
    '/appointments/:id/no-show',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const { id } = request.params as { id: string }
        const data = await availabilitiesService.markAppointmentNoShow(
          practitionerId,
          id,
        )
        return reply.send({ success: true, data })
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur') })
      }
    },
  )

  // get cabinet appointments with stats
  fastify.get(
    '/cabinet-appointments',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const query = request.query as { period?: string }
        const period = (query.period as 'week' | 'month') || 'week'

        const data = await availabilitiesService.getCabinetAppointments(
          practitionerId,
          period,
        )
        return reply.send({ success: true, data })
      } catch (error: any) {
        return reply
          .status(500)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  fastify.get(
    '/cabinet-appointments/history',
    { preHandler },
    async (request, reply) => {
      try {
        const practitionerId =
          await practitionersService.getPractitionerIdFromUserId(
            request.user!.id,
          )
        if (!practitionerId)
          return reply
            .status(404)
            .send({ success: false, message: 'Profil praticien non trouvé' })

        const query = request.query as {
          page?: string
          limit?: string
          search?: string
          status?: string
          dateFrom?: string
          dateTo?: string
        }

        const result = await availabilitiesService.getCabinetHistory(
          practitionerId,
          query.page ? parseInt(query.page, 10) : 1,
          query.limit ? parseInt(query.limit, 10) : 20,
          query.search,
          query.status,
          query.dateFrom,
          query.dateTo,
        )

        return reply.send({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        })
      } catch (error: any) {
        return reply
          .status(500)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )
}
