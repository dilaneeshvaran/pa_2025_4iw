import { FastifyRequest, FastifyReply } from 'fastify'
import {
  adminSubscriptionsService,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from './admin-subscriptions.service'

export class AdminSubscriptionsController {
  async getSubscriptions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        search?: string
        status?: string
        plan?: string
        sortOrder?: string
        page?: string
        limit?: string
      }

      const status =
        query.status &&
        SUBSCRIPTION_STATUSES.includes(query.status as never)
          ? query.status
          : undefined
      const plan =
        query.plan && SUBSCRIPTION_PLANS.includes(query.plan as never)
          ? query.plan
          : undefined

      const data = await adminSubscriptionsService.getSubscriptions({
        search: query.search,
        status,
        plan,
        sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 15,
      })

      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des abonnements',
      })
    }
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await adminSubscriptionsService.getStats()
      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des statistiques',
      })
    }
  }

  async getSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const data = await adminSubscriptionsService.getById(id)
      return reply.status(200).send({ success: true, data })
    } catch (error: any) {
      if (error.message === 'Subscription not found') {
        return reply
          .status(404)
          .send({ success: false, message: 'Abonnement non trouvé' })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: "Erreur lors du chargement de l'abonnement",
      })
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const body = request.body as {
        plan?: string
        status?: string
        cancelAtPeriodEnd?: boolean
      }

      if (
        body.plan !== undefined &&
        !SUBSCRIPTION_PLANS.includes(body.plan as never)
      ) {
        return reply
          .status(400)
          .send({ success: false, message: 'Plan invalide' })
      }

      if (
        body.status !== undefined &&
        !SUBSCRIPTION_STATUSES.includes(body.status as never)
      ) {
        return reply
          .status(400)
          .send({ success: false, message: 'Statut invalide' })
      }

      if (
        body.plan === undefined &&
        body.status === undefined &&
        body.cancelAtPeriodEnd === undefined
      ) {
        return reply
          .status(400)
          .send({ success: false, message: 'Aucune modification fournie' })
      }

      const data = await adminSubscriptionsService.update(id, body)

      return reply.status(200).send({
        success: true,
        message: 'Abonnement mis à jour avec succès',
        data,
      })
    } catch (error: any) {
      if (error.message === 'Subscription not found') {
        return reply
          .status(404)
          .send({ success: false, message: 'Abonnement non trouvé' })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: "Erreur lors de la mise à jour de l'abonnement",
      })
    }
  }
}

export const adminSubscriptionsController = new AdminSubscriptionsController()
