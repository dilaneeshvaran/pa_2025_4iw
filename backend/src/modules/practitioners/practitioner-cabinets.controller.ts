import { FastifyRequest, FastifyReply } from 'fastify'
import { practitionerCabinetsService } from './practitioner-cabinets.service'

class PractitionerCabinetsController {
  async getCabinetsAndInvitations(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const data = await practitionerCabinetsService.getCabinetsAndInvitations(
        userId,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async acceptInvitation(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const data = await practitionerCabinetsService.acceptInvitation(
        userId,
        id,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async rejectInvitation(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const data = await practitionerCabinetsService.rejectInvitation(
        userId,
        id,
      )
      return reply.send({ success: true, data })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: error.message })
    }
  }

  async leaveCabinet(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      await practitionerCabinetsService.leaveCabinet(userId, id)
      return reply.send({ success: true, message: 'Cabinet left successfully' })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: error.message })
    }
  }
  async togglePauseCabinet(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const data = await practitionerCabinetsService.togglePauseCabinet(userId, id)
      return reply.send({ success: true, data })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: error.message })
    }
  }
}

export const practitionerCabinetsController = new PractitionerCabinetsController()
