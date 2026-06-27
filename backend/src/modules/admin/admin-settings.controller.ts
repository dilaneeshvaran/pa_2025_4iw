import { FastifyRequest, FastifyReply } from 'fastify'
import { adminSettingsService } from './admin-settings.service'

export class AdminSettingsController {
  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await adminSettingsService.getSettings()
      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des paramètres',
      })
    }
  }

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as {
        settings?: { key: string; value: unknown }[]
      }

      if (!body.settings || !Array.isArray(body.settings)) {
        return reply
          .status(400)
          .send({ success: false, message: 'Aucun paramètre fourni' })
      }

      const data = await adminSettingsService.updateSettings(body.settings)

      return reply.status(200).send({
        success: true,
        message: 'Paramètres mis à jour avec succès',
        data,
      })
    } catch (error: any) {
      if (
        error.message?.startsWith('Unknown setting') ||
        error.message?.startsWith('Invalid') ||
        error.message?.includes('must be') ||
        error.message === 'No settings provided'
      ) {
        return reply.status(400).send({
          success: false,
          message: 'Valeur de paramètre invalide',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour des paramètres',
      })
    }
  }
}

export const adminSettingsController = new AdminSettingsController()
