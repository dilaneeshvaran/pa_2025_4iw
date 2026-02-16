import { FastifyRequest, FastifyReply } from 'fastify'
import { teleconsultationsService } from './teleconsultations.service'
import prisma from '../../config/database'

export class TeleconsultationsController {
  // 4 practitioner
  async getTodaySessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply
          .status(404)
          .send({ success: false, message: 'Praticien non trouvé' })

      await teleconsultationsService.ensureSessionsForUpcomingAppointments(
        practitioner.id,
      )

      // auto cleanup expired sessions and mark no-shows
      await teleconsultationsService.cleanupExpiredSessions()

      const sessions = await teleconsultationsService.getTodaySessions(
        practitioner.id,
      )
      return reply.status(200).send({ success: true, data: sessions })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  // 4 practitioner
  async getWaitingPatients(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply
          .status(404)
          .send({ success: false, message: 'Praticien non trouvé' })

      const patients = await teleconsultationsService.getWaitingPatients(
        practitioner.id,
      )
      return reply.status(200).send({ success: true, data: patients })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  // stil 4 practitioner
  async getPastSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const query = request.query as {
        period?: string
        page?: string
        limit?: string
        search?: string
        status?: string
      }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply
          .status(404)
          .send({ success: false, message: 'Praticien non trouvé' })

      const result = await teleconsultationsService.getPastSessions(
        practitioner.id,
        (query.period as 'week' | 'month') || 'week',
        query.page ? parseInt(query.page) : 1,
        query.limit ? parseInt(query.limit) : 10,
        query.search,
        query.status,
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
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  // 4 practitioner (modal with filters)
  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const query = request.query as {
        page?: string
        limit?: string
        search?: string
        status?: string
        dateFrom?: string
        dateTo?: string
      }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply
          .status(404)
          .send({ success: false, message: 'Praticien non trouvé' })

      const result = await teleconsultationsService.getHistory(
        practitioner.id,
        query.page ? parseInt(query.page) : 1,
        query.limit ? parseInt(query.limit) : 20,
        query.search,
        query.status,
        query.dateFrom,
        query.dateTo,
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
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  // 4 practitioner + patient
  async joinSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { id } = request.params as { id: string }

      const role = user.role === 'PRACTITIONER' ? 'practitioner' : 'patient'

      const session = await teleconsultationsService.joinSession(
        id,
        user.id,
        role,
      )

      return reply.status(200).send({ success: true, data: session })
    } catch (error) {
      request.log.error(error)
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      return reply.status(400).send({ success: false, message })
    }
  }

  // 4 practitioner
  async endSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id } = request.params as { id: string }

      const session = await teleconsultationsService.endSession(id, user.id)
      return reply.status(200).send({ success: true, data: session })
    } catch (error) {
      request.log.error(error)
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      return reply.status(400).send({ success: false, message })
    }
  }

  async markNoShow(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id } = request.params as { id: string }

      const session = await teleconsultationsService.markNoShow(id, user.id)
      return reply.status(200).send({ success: true, data: session })
    } catch (error) {
      request.log.error(error)
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      return reply.status(400).send({ success: false, message })
    }
  }

  async updateConnectionQuality(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const { quality } = request.body as {
        quality: 'good' | 'medium' | 'poor'
      }

      const session = await teleconsultationsService.updateConnectionQuality(
        id,
        quality,
      )
      return reply.status(200).send({ success: true, data: session })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(400)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  async getSessionByAppointment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { appointmentId } = request.params as { appointmentId: string }

      let session =
        await teleconsultationsService.getSessionByAppointment(appointmentId)

      // create session if doesnt exist
      if (!session) {
        try {
          await teleconsultationsService.createSession(appointmentId)
          session =
            await teleconsultationsService.getSessionByAppointment(
              appointmentId,
            )
        } catch {
          return reply
            .status(404)
            .send({ success: false, message: 'Session non trouvée' })
        }
      }

      return reply.status(200).send({ success: true, data: session })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  // summary after call
  async getSessionSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const summary = await teleconsultationsService.getSessionSummary(id)
      return reply.status(200).send({ success: true, data: summary })
    } catch (error) {
      request.log.error(error)
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      return reply.status(404).send({ success: false, message })
    }
  }

  async getSessionAuditLog(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const logs = await teleconsultationsService.getSessionAuditLog(id)
      return reply.status(200).send({ success: true, data: logs })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }

  async getPatientTeleconsultations(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const user = request.user as { id: string }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!patient)
        return reply
          .status(404)
          .send({ success: false, message: 'Patient non trouvé' })

      //upcoming and past appointments
      const [upcomingResult, pastResult] = await Promise.all([
        teleconsultationsService.getPatientTeleconsultations(
          patient.id,
          'upcoming',
          10,
          1,
        ),
        teleconsultationsService.getPatientTeleconsultations(
          patient.id,
          'past',
          10,
          1,
        ),
      ])

      return reply.status(200).send({
        success: true,
        data: {
          upcoming: upcomingResult.data,
          past: pastResult.data,
        },
      })
    } catch (error) {
      request.log.error(error)
      return reply
        .status(500)
        .send({ success: false, message: 'Erreur serveur' })
    }
  }
}

export const teleconsultationsController = new TeleconsultationsController()
