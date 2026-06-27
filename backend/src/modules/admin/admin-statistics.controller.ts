import { FastifyRequest, FastifyReply } from 'fastify'
import { adminStatisticsService } from './admin-statistics.service'

export class AdminStatisticsController {
  async getStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await adminStatisticsService.getStatistics()
      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des statistiques',
      })
    }
  }
}

export const adminStatisticsController = new AdminStatisticsController()
