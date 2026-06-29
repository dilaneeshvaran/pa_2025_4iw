import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { routes } from './routes'
import prisma from './config/database'
import { redis } from './config/redis'
import { startReminderWorker } from './utils/reminder-scheduler'
import { startHealthReminderWorker } from './utils/health-reminder-scheduler'
import { websocketPlugin } from './plugins/websocket'
import { sanitizeErrorMessage } from './utils/errors'
import securityPlugin from './plugins/security'


const app = Fastify({
  logger: {
    level: process.env.BACKEND_NODE_ENV === 'development' ? 'info' : 'error',
  },
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024,
})
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>()

app.register(securityPlugin)

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

// register multipart support for file uploads
app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
})

//  websocket support for real time messaging
app.register(websocketPlugin)

// register routes
app.register(routes)

// start reminder worker
let reminderWorker: ReturnType<typeof startReminderWorker> | null = null
let healthReminderWorker: ReturnType<typeof startHealthReminderWorker> | null =
  null
try {
  reminderWorker = startReminderWorker()
  console.log('Reminder worker started')
} catch (error) {
  console.error('Failed to start reminder worker:', error)
}

try {
  healthReminderWorker = startHealthReminderWorker()
  console.log('Health reminder worker started')
} catch (error) {
  console.error('Failed to start health reminder worker:', error)
}
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

  const err = error as Error & { statusCode?: number }
  const statusCode = err.statusCode ?? 500
  request.log.error(error)

  const defaultMessage = 'Erreur interne du serveur'
  const message = statusCode >= 500
    ? sanitizeErrorMessage(err, defaultMessage)
    : sanitizeErrorMessage(err, err.message || defaultMessage)

  return reply.code(statusCode).send({
    success: false,
    message,
  })
})

// cleanup on server close
app.addHook('onClose', async () => {
  if (reminderWorker) {
    await reminderWorker.close()
  }
  if (healthReminderWorker) {
    await healthReminderWorker.close()
  }
  await redis.quit()
  await prisma.$disconnect()
})

export default app
