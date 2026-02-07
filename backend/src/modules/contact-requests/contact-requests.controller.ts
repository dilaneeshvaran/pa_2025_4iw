import { FastifyReply, FastifyRequest } from 'fastify'
import { ContactRequestStatus } from '@prisma/client'
import { ContactRequestsService } from './contact-requests.service'
import { CreateContactRequestInput } from './contact-requests.schema'

const contactRequestsService = new ContactRequestsService()

export class ContactRequestsController {
  async createContactRequest(
    request: FastifyRequest<{ Body: CreateContactRequestInput }>,
    reply: FastifyReply,
  ) {
    try {
      const data = request.body

      const result = await contactRequestsService.createContactRequest(data)

      return reply.status(201).send({
        success: true,
        message:
          'Votre demande a été envoyée avec succès. Nous vous contacterons bientôt.',
        data: result,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de la demande"
      return reply.status(400).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async getAllContactRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status, requestType } = request.query as {
        status?: ContactRequestStatus
        requestType?: string
      }

      const contactRequests =
        await contactRequestsService.getAllContactRequests({
          status,
          requestType,
        })

      return reply.status(200).send({
        success: true,
        data: contactRequests,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la récupération des demandes'
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async getContactRequestById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }

      const contactRequest =
        await contactRequestsService.getContactRequestById(id)

      if (!contactRequest) {
        return reply.status(404).send({
          success: false,
          message: 'Demande de contact introuvable',
        })
      }

      return reply.status(200).send({
        success: true,
        data: contactRequest,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la récupération de la demande'
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async updateContactRequestStatus(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params as { id: string }
      const { status, adminNotes } = request.body as {
        status: ContactRequestStatus
        adminNotes?: string
      }
      const userId = (request as any).user?.id // get from auth middleware

      const contactRequest =
        await contactRequestsService.updateContactRequestStatus(
          id,
          status,
          adminNotes,
          userId,
        )

      return reply.status(200).send({
        success: true,
        message: 'Statut de la demande mis à jour avec succès',
        data: contactRequest,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour du statut'
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }

  async deleteContactRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }

      await contactRequestsService.deleteContactRequest(id)

      return reply.status(200).send({
        success: true,
        message: 'Demande de contact supprimée avec succès',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression de la demande'
      return reply.status(500).send({
        success: false,
        message: errorMessage,
      })
    }
  }
}
