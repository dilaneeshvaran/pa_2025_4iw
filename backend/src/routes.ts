import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { contactRequestsRoutes } from './modules/contact-requests/contact-requests.routes'
import { practitionersRoutes } from './modules/practitioners/practitioners.routes'
import { appointmentsRoutes } from './modules/appointments/appointments.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'

export async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(contactRequestsRoutes, { prefix: '/api/contact-requests' })
  fastify.register(practitionersRoutes, { prefix: '/api/practitioners' })
  fastify.register(appointmentsRoutes, { prefix: '/api/appointments' })
  fastify.register(notificationsRoutes, { prefix: '/api/notifications' })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
