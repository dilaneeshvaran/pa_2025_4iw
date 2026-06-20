import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { campaignsService } from './campaigns.service'
import { sanitizeErrorMessage } from '../../utils/errors'

export async function campaignsRoutes(fastify: FastifyInstance) {
  // recipient count for each destinatair selection
  fastify.get(
    '/recipient-counts',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const counts = await campaignsService.getRecipientCounts()
        return reply.status(200).send({ success: true, data: counts })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(500).send({ success: false, message })
      }
    },
  )

  // custom target filtered destinataire count
  fastify.post(
    '/recipient-count',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as {
          targetType: string
          targetUserTypes?: string[]
          targetLocations?: string[]
          targetRegisteredFrom?: string
          targetRegisteredTo?: string
        }
        const count = await campaignsService.getFilteredRecipientCount(body)
        return reply.status(200).send({ success: true, data: { count } })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(500).send({ success: false, message })
      }
    },
  )

  // available cities of available destinatauires
  fastify.get(
    '/cities',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const cities = await campaignsService.getAvailableCities()
        return reply.status(200).send({ success: true, data: cities })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(500).send({ success: false, message })
      }
    },
  )

  // send campaign
  fastify.post(
    '/',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as {
          title: string
          message: string
          messageType: string
          targetType: string
          targetUserTypes?: string[]
          targetLocations?: string[]
          targetRegisteredFrom?: string
          targetRegisteredTo?: string
          channels: string[]
          scheduledAt?: string
        }

        if (!body.title || !body.message || !body.targetType) {
          return reply.status(400).send({
            success: false,
            message: 'Titre, message et type de destinataires sont requis',
          })
        }

        if (!body.channels || body.channels.length === 0) {
          return reply.status(400).send({
            success: false,
            message: 'Au moins un canal de diffusion est requis',
          })
        }

        const user = (request as any).user
        const campaign = await campaignsService.createAndSendCampaign({
          ...body,
          createdBy: user.id,
        })

        return reply.status(201).send({ success: true, data: campaign })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(400).send({ success: false, message })
      }
    },
  )

  // campaigns history avec filters
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as {
          status?: string
          messageType?: string
          search?: string
          page?: string
          limit?: string
        }

        const result = await campaignsService.getCampaigns({
          status: query.status,
          messageType: query.messageType,
          search: query.search,
          page: query.page ? parseInt(query.page) : 1,
          limit: query.limit ? parseInt(query.limit) : 20,
        })

        return reply.status(200).send({ success: true, data: result })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(500).send({ success: false, message })
      }
    },
  )

  // campaign details
  fastify.get(
    '/:id',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string }
        const campaign = await campaignsService.getCampaignById(id)
        return reply.status(200).send({ success: true, data: campaign })
      } catch (error) {
        const message = sanitizeErrorMessage(error, 'Erreur serveur')
        return reply.status(404).send({ success: false, message })
      }
    },
  )
}
