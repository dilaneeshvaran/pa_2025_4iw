import { FastifyRequest, FastifyReply } from 'fastify'
import { cabinetService } from './cabinet.service'
import { sanitizeErrorMessage } from '../../utils/errors'

class CabinetController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getDashboard(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getCabinetInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getCabinetInfo(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async updateCabinetInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as Record<string, unknown>
      const data = await cabinetService.updateCabinetInfo(userId, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getPractitioners(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getPractitioners(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async invitePractitioner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { email } = request.body as { email: string }
      const data = await cabinetService.invitePractitioner(userId, email)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async removePractitioner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      await cabinetService.removePractitioner(userId, id)
      return reply.send({
        success: true,
        message: 'Praticien retiré du cabinet',
      })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getStaff(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async createStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as {
        email: string
        firstName: string
        lastName: string
        phone: string
        position: string
      }
      const data = await cabinetService.createStaff(userId, body, true)
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async updateStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { position } = request.body as { position: string }
      const data = await cabinetService.updateStaff(userId, id, position)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async removeStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      await cabinetService.removeStaff(userId, id)
      return reply.send({
        success: true,
        message: 'Personnel supprimé',
      })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getPractitionerAppointments(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { date } = request.query as { date?: string }
      const data = await cabinetService.getPractitionerAppointments(
        userId,
        id,
        date,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getPractitionerSchedule(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const data = await cabinetService.getPractitionerSchedule(userId, id)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getPractitionerPatients(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { search } = request.query as { search?: string }
      const data = await cabinetService.getPractitionerPatients(
        userId,
        id,
        search,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async searchPatientsForBooking(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { q } = request.query as { q: string }
      if (!q || q.length < 2) {
        return reply.send({ success: true, data: [] })
      }
      const data = await cabinetService.searchPatientsForBooking(userId, id, q)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async bookAppointmentForPractitioner(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const body = request.body as {
        patientId: string
        appointmentDate: string
        startTime: string
        endTime: string
        type: string
        reason?: string
      }
      const data = await cabinetService.bookAppointmentForPractitioner(
        userId,
        id,
        body,
      )
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async deleteCabinet(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      await cabinetService.deleteCabinet(userId)
      return reply.send({ success: true, message: 'Cabinet supprimé' })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async transferOwnership(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { email } = request.body as { email: string }
      const data = await cabinetService.transferOwnership(userId, email)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }
}

export const cabinetController = new CabinetController()
