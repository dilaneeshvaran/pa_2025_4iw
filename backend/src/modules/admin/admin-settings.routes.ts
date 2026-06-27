import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminSettingsController } from './admin-settings.controller'

export async function adminSettingsRoutes(fastify: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorize(['ADMIN'])] }

  // list all platform settings (typed, with defaults applied)
  fastify.get(
    '/',
    adminOnly,
    adminSettingsController.getSettings.bind(adminSettingsController),
  )

  // bulk update settings: { settings: [{ key, value }] }
  fastify.put(
    '/',
    adminOnly,
    adminSettingsController.updateSettings.bind(adminSettingsController),
  )
}
