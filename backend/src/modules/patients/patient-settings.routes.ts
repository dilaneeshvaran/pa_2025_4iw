import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { patientSettingsService } from './patient-settings.service'
import { authenticate } from '../../middleware/authenticate'
import { sanitizeErrorMessage } from '../../utils/errors'
import { updatePatientProfileSchema } from './patient-settings.schema'

export async function patientSettingsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/profile',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const profile = await patientSettingsService.getProfile(user.id)

        return reply.status(200).send({ success: true, data: profile })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.patch(
    '/profile',
    {
      preHandler: [authenticate],
      schema: {
        body: updatePatientProfileSchema,
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as Record<string, unknown>
        const profile = await patientSettingsService.updateProfile(
          user.id,
          body,
        )

        return reply.status(200).send({ success: true, data: profile })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.patch(
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

        const result = await patientSettingsService.updateEmail(user.id, body)
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.patch(
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

        const result = await patientSettingsService.updatePassword(
          user.id,
          body,
        )
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  // 2fa settings management
  app.post(
    '/2fa/setup',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const result = await patientSettingsService.setup2FA(user.id)
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.post(
    '/2fa/verify',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { code: string }

        if (!body.code) {
          return reply.status(400).send({
            success: false,
            message: 'Code de vérification requis',
          })
        }

        const result = await patientSettingsService.verifyAndEnable2FA(
          user.id,
          body.code,
        )
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.post(
    '/2fa/disable',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { code?: string; password?: string }

        const result = await patientSettingsService.disable2FA(
          user.id,
          body.code,
          body.password,
        )
        return reply.status(200).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  app.get(
    '/notifications',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const prefs = await patientSettingsService.getNotificationPreferences(
          user.id,
        )

        return reply.status(200).send({ success: true, data: prefs })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur interne du serveur') })
      }
    },
  )

  // update notification preferences
  app.patch(
    '/notifications',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as Record<string, boolean>
        const prefs =
          await patientSettingsService.updateNotificationPreferences(
            user.id,
            body,
          )

        return reply.status(200).send({ success: true, data: prefs })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur interne du serveur') })
      }
    },
  )

  // get consents
  app.get(
    '/consents',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const consents = await patientSettingsService.getConsents(user.id)

        return reply.status(200).send({ success: true, data: consents })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(500)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur interne du serveur') })
      }
    },
  )

  // save consent
  app.post(
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

        const consent = await patientSettingsService.upsertConsent(
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
          .send({ success: false, message: sanitizeErrorMessage(error, 'Erreur interne du serveur') })
      }
    },
  )

  // request data export
  app.post(
    '/data-export',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const result = await patientSettingsService.requestDataExport(
          user.id,
          request.ip,
        )

        return reply.status(201).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )

  // request account deletion
  app.post(
    '/delete-account',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = request.body as { reason?: string }
        const result = await patientSettingsService.requestAccountDeletion(
          user.id,
          body?.reason,
          request.ip,
        )

        return reply.status(201).send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error)
        return reply
          .status(400)
          .send({ success: false, message: sanitizeErrorMessage(error, 'Une erreur est survenue') })
      }
    },
  )
}
