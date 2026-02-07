import Fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { routes } from './routes'
import prisma from './config/database'

const app = Fastify({
  logger: {
    level: process.env.BACKEND_NODE_ENV === 'development' ? 'info' : 'error',
  },
})
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>()

app.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
})

// register routes
app.register(routes)

// error handler for zod validation errors
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
  request.log.error(error)
  return reply.code(statusCode).send({
    success: false,
    message: error.message || 'Erreur interne du serveur',
  })
})

// cleanup on server close
app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

export default app
