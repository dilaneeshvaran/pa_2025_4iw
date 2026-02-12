import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { contactRequestsRoutes } from './modules/contact-requests/contact-requests.routes'
import { practitionersRoutes } from './modules/practitioners/practitioners.routes'
import { appointmentsRoutes } from './modules/appointments/appointments.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'
import { medicalRecordsRoutes } from './modules/medical-records/medical-records.routes'
import { documentsRoutes } from './modules/documents/documents.routes'
import { messagesRoutes } from './modules/messages/messages.routes'
import { paymentsRoutes } from './modules/payments/payments.routes'
import { settingsRoutes } from './modules/settings/settings.routes'
import { practitionerDashboardRoutes } from './modules/practitioners/practitioners-dashboard.routes'

export async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(contactRequestsRoutes, { prefix: '/api/contact-requests' })
  fastify.register(practitionersRoutes, { prefix: '/api/practitioners' })
  fastify.register(appointmentsRoutes, { prefix: '/api/appointments' })
  fastify.register(notificationsRoutes, { prefix: '/api/notifications' })
  fastify.register(medicalRecordsRoutes, { prefix: '/api/medical-records' })
  fastify.register(documentsRoutes, { prefix: '/api/documents' })
  fastify.register(messagesRoutes, { prefix: '/api/messages' })
  fastify.register(paymentsRoutes, { prefix: '/api/payments' })
  fastify.register(settingsRoutes, { prefix: '/api/settings' })
  fastify.register(practitionerDashboardRoutes, {
    prefix: '/api/practitioner/dashboard',
  })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
