import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { settingsService } from './settings.service'
import { authenticate } from '../../middleware/authenticate'

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/profile',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const profile = await settingsService.getProfile(user.id)

        return reply.status(200).send({ success: true, data: profile })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.patch(
    '/profile',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as Record<string, unknown>
        const profile = await settingsService.updateProfile(user.id, body)

        return reply.status(200).send({ success: true, data: profile })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.patch(
    '/email',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { newEmail: string; password: string }

        if (!body.newEmail || !body.password) {
          return reply.status(400).send({
            success: false,
            message: 'Email et mot de passe requis',
          })
        }

        const result = await settingsService.updateEmail(user.id, body)
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.patch(
    '/password',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as {
          currentPassword: string
          newPassword: string
        }

        if (!body.currentPassword || !body.newPassword) {
          return reply.status(400).send({
            success: false,
            message: 'Mot de passe actuel et nouveau mot de passe requis',
          })
        }

        if (body.newPassword.length < 8) {
          return reply.status(400).send({
            success: false,
            message:
              'Le nouveau mot de passe doit contenir au moins 8 caractères',
          })
        }

        const result = await settingsService.updatePassword(user.id, body)
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  // toggle 2fa
  fastify.patch(
    '/2fa',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { enabled: boolean }

        if (typeof body.enabled !== 'boolean') {
          return reply.status(400).send({
            success: false,
            message: 'Valeur booléenne requise pour enabled',
          })
        }

        const result = await settingsService.toggle2FA(user.id, body.enabled)
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  fastify.get(
    '/notifications',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const prefs = await settingsService.getNotificationPreferences(user.id)

        return reply.status(200).send({ success: true, data: prefs })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: error.message })
      }
    },
  )

  // update notification preferences
  fastify.patch(
    '/notifications',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as Record<string, boolean>
        const prefs = await settingsService.updateNotificationPreferences(
          user.id,
          body,
        )

        return reply.status(200).send({ success: true, data: prefs })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: error.message })
      }
    },
  )

  // get consents
  fastify.get(
    '/consents',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const consents = await settingsService.getConsents(user.id)

        return reply.status(200).send({ success: true, data: consents })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: error.message })
      }
    },
  )

  // save consent
  fastify.post(
    '/consents',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as {
          consentType: string
          version: string
          accepted: boolean
        }

        if (!body.consentType || !body.version) {
          return reply.status(400).send({
            success: false,
            message: 'consentType et version requis',
          })
        }

        const consent = await settingsService.upsertConsent(
          user.id,
          body,
          request.ip,
          request.headers['user-agent'],
        )

        return reply.status(201).send({ success: true, data: consent })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: error.message })
      }
    },
  )

  // request data export
  fastify.post(
    '/data-export',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const result = await settingsService.requestDataExport(
          user.id,
          request.ip,
        )

        return reply.status(201).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )

  // request account deletion
  fastify.post(
    '/delete-account',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { reason?: string }
        const result = await settingsService.requestAccountDeletion(
          user.id,
          body?.reason,
          request.ip,
        )

        return reply.status(201).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: error.message })
      }
    },
  )
}
