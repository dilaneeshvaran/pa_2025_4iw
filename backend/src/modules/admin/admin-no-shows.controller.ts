import { FastifyRequest, FastifyReply } from 'fastify'
import { adminNoShowsService } from './admin-no-shows.service'

export class AdminNoShowsController {
  async getNoShowPatients(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        search?: string
        minNoShows?: string
        status?: string
        dateFrom?: string
        dateTo?: string
        sortOrder?: string
        page?: string
        limit?: string
      }

      const data = await adminNoShowsService.getNoShowPatients({
        search: query.search,
        minNoShows: query.minNoShows ? parseInt(query.minNoShows) : undefined,
        status: query.status as 'banned' | 'warned' | 'normal' | undefined,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 15,
      })

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get no-show patients',
      })
    }
  }

  async getPatientHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { patientId } = request.params as { patientId: string }
      const data = await adminNoShowsService.getPatientNoShowHistory(patientId)

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error: any) {
      if (error.message === 'Patient not found') {
        return reply.status(404).send({
          success: false,
          message: 'Patient non trouvé',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get patient history',
      })
    }
  }

  async sendWarning(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { patientId } = request.params as { patientId: string }
      await adminNoShowsService.sendWarning(patientId)

      return reply.status(200).send({
        success: true,
        message: 'Avertissement envoyé avec succès',
      })
    } catch (error: any) {
      if (error.message === 'Patient not found') {
        return reply.status(404).send({
          success: false,
          message: 'Patient non trouvé',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: "Erreur lors de l'envoi de l'avertissement",
      })
    }
  }

  async banPatient(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { patientId } = request.params as { patientId: string }
      const { durationDays, reason } = request.body as {
        durationDays: number
        reason: string
      }

      if (!durationDays || durationDays < 1) {
        return reply.status(400).send({
          success: false,
          message: 'La durée doit être supérieure à 0',
        })
      }

      if (!reason || reason.trim().length < 10) {
        return reply.status(400).send({
          success: false,
          message: 'Le motif doit contenir au moins 10 caractères',
        })
      }

      await adminNoShowsService.banPatient(
        patientId,
        durationDays,
        reason.trim(),
      )

      return reply.status(200).send({
        success: true,
        message: 'Patient banni avec succès',
      })
    } catch (error: any) {
      if (error.message === 'Patient not found') {
        return reply.status(404).send({
          success: false,
          message: 'Patient non trouvé',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du bannissement',
      })
    }
  }

  async liftSanction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { patientId } = request.params as { patientId: string }
      await adminNoShowsService.liftSanction(patientId)

      return reply.status(200).send({
        success: true,
        message: 'Sanction levée avec succès',
      })
    } catch (error: any) {
      if (error.message === 'Patient not found') {
        return reply.status(404).send({
          success: false,
          message: 'Patient non trouvé',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la levée de sanction',
      })
    }
  }
}

export const adminNoShowsController = new AdminNoShowsController()
