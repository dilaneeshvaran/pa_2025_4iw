import { FastifyRequest, FastifyReply } from 'fastify'
import { practitionerCabinetsService } from './practitioner-cabinets.service'
import { sanitizeErrorMessage } from '../../utils/errors'

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
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
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
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
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
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
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
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
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
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }

  async getCabinetColleagues(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user!.id
      const { id } = request.params as { id: string }
      const data = await practitionerCabinetsService.getCabinetColleagues(userId, id)
      return reply.send({ success: true, data })
    } catch (error: any) {
      request.log.error(error)
      return reply.status(400).send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
    }
  }
}

export const practitionerCabinetsController = new PractitionerCabinetsController()
