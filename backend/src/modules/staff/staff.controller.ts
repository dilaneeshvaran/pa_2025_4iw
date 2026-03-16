import { FastifyRequest, FastifyReply } from 'fastify'
import { staffService } from './staff.service'

class StaffController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await staffService.getDashboard(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getPractitioners(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await staffService.getPractitioners(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getPractitionerAppointments(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { date, startDate, endDate } = request.query as {
        date?: string
        startDate?: string
        endDate?: string
      }
      const data = await staffService.getPractitionerAppointments(
        userId,
        id,
        date,
        startDate,
        endDate,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async bookAppointment(request: FastifyRequest, reply: FastifyReply) {
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
      const data = await staffService.bookAppointment(userId, id, body)
      return reply.status(201).send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async cancelAppointment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      await staffService.cancelAppointment(userId, id)
      return reply.send({
        success: true,
        message: 'Rendez-vous annulé',
      })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async moveAppointment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const body = request.body as {
        newDate: string
        newStartTime: string
        newEndTime: string
      }
      const data = await staffService.moveAppointment(userId, id, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async searchPatients(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const { q } = request.query as { q: string }
      const data = await staffService.searchPatients(userId, id, q || '')
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await staffService.getStaffProfile(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as {
        firstName?: string
        lastName?: string
        phone?: string
      }
      const data = await staffService.updateStaffProfile(userId, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async updateEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as { newEmail: string; password: string }
      if (!body.newEmail || !body.password) {
        return reply
          .status(400)
          .send({ success: false, message: 'Email et mot de passe requis' })
      }
      const data = await staffService.updateStaffEmail(userId, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async updatePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as {
        currentPassword: string
        newPassword: string
      }
      if (!body.currentPassword || !body.newPassword) {
        return reply.status(400).send({
          success: false,
          message: 'Mot de passe actuel et nouveau mot de passe requis',
        })
      }
      if (body.newPassword.length < 8) {
        return reply.status(400).send({
          success: false,
          message:
            'Le nouveau mot de passe doit contenir au moins 8 caractères',
        })
      }
      const data = await staffService.updateStaffPassword(userId, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }
}

export const staffController = new StaffController()
