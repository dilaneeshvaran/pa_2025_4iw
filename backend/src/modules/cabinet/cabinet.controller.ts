import { FastifyRequest, FastifyReply } from 'fastify'
import { cabinetService } from './cabinet.service'

class CabinetController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getDashboard(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getCabinetInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getCabinetInfo(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async updateCabinetInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const body = request.body as Record<string, unknown>
      const data = await cabinetService.updateCabinetInfo(userId, body)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getPractitioners(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getPractitioners(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async invitePractitioner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const { email } = request.body as { email: string }
      const data = await cabinetService.invitePractitioner(userId, email)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
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
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async getStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.id
      const data = await cabinetService.getStaff(userId)
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
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
      return reply.status(400).send({ success: false, message: error.message })
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
      return reply.status(400).send({ success: false, message: error.message })
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
      const { date } = request.query as { date?: string }
      const data = await cabinetService.getPractitionerAppointments(
        userId,
        id,
        date,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message })
    }
  }
}

export const cabinetController = new CabinetController()
