import Fastify, { FastifyInstance, FastifyPluginAsync } from 'fastify'
import jwt from 'jsonwebtoken'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { routes } from '../../routes'

export type TestUserRole = 'PATIENT' | 'PRACTITIONER' | 'ADMIN' | 'STAFF'

type BuildIntegrationAppOptions = {
  registerRoutes?: boolean
  route?: FastifyPluginAsync
  prefix?: string
}

export const TEST_JWT_SECRET = 'test-jwt-secret'

process.env.BACKEND_JWT_SECRET = process.env.BACKEND_JWT_SECRET ?? TEST_JWT_SECRET
process.env.BACKEND_JWT_REFRESH_SECRET =
  process.env.BACKEND_JWT_REFRESH_SECRET ?? 'test-refresh-secret'

export function buildIntegrationApp(options: BuildIntegrationAppOptions = {}) {
  const app = Fastify({ logger: false })
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler)
    .withTypeProvider<ZodTypeProvider>()

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        success: false,
        message: 'Erreur de validation',
        errors: error.validation,
      })
    }

    if (isResponseSerializationError(error)) {
      request.log.error(error, 'Response serialization error')
      return reply.code(500).send({
        success: false,
        message: 'Erreur interne du serveur',
      })
    }

    const statusCode = error.statusCode ?? 500
    return reply.code(statusCode).send({
      success: false,
      message: error.message || 'Erreur interne du serveur',
    })
  })

  if (options.route) {
    app.register(options.route, { prefix: options.prefix })
  } else if (options.registerRoutes) {
    app.register(routes)
  }

  return app
}

export async function closeIntegrationApp(app: FastifyInstance) {
  await app.close()
}

export function generateTestToken(
  role: TestUserRole = 'PATIENT',
  userId = `test-${role.toLowerCase()}-user`,
) {
  return jwt.sign(
    {
      userId,
      email: `${userId}@medicote.test`,
      role,
    },
    process.env.BACKEND_JWT_SECRET || TEST_JWT_SECRET,
    { expiresIn: '1h' },
  )
}

export function authHeader(role?: TestUserRole, userId?: string) {
  return {
    authorization: `Bearer ${generateTestToken(role, userId)}`,
  }
}
