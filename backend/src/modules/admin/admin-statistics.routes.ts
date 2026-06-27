import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminStatisticsController } from './admin-statistics.controller'

export async function adminStatisticsRoutes(fastify: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorize(['ADMIN'])] }

  // platform-wide statistics (overview + 12-month series + distributions)
  fastify.get(
    '/',
    adminOnly,
    adminStatisticsController.getStatistics.bind(adminStatisticsController),
  )
}
