import { FastifyRequest, FastifyReply } from 'fastify'
import { adminDashboardService } from './admin-dashboard.service'

export class AdminDashboardController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await adminDashboardService.getDashboardData()

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get admin dashboard data',
      })
    }
  }
}

export const adminDashboardController = new AdminDashboardController()
