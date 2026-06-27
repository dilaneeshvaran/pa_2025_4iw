import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminSubscriptionsController } from './admin-subscriptions.controller'

export async function adminSubscriptionsRoutes(fastify: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorize(['ADMIN'])] }

  // list subscriptions (search / status / plan / pagination)
  fastify.get(
    '/',
    adminOnly,
    adminSubscriptionsController.getSubscriptions.bind(
      adminSubscriptionsController,
    ),
  )

  // status counts for the header cards
  fastify.get(
    '/stats',
    adminOnly,
    adminSubscriptionsController.getStats.bind(adminSubscriptionsController),
  )

  // single subscription detail
  fastify.get(
    '/:id',
    adminOnly,
    adminSubscriptionsController.getSubscription.bind(
      adminSubscriptionsController,
    ),
  )

  // update plan / status / cancellation flag
  fastify.patch(
    '/:id',
    adminOnly,
    adminSubscriptionsController.update.bind(adminSubscriptionsController),
  )
}
