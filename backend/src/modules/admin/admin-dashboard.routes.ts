import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminDashboardController } from './admin-dashboard.controller'

export async function adminDashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
      schema: {
        tags: ['admin-dashboard'],
        description: 'Get admin dashboard data',
      },
    },
    adminDashboardController.getDashboard.bind(adminDashboardController),
  )
}
