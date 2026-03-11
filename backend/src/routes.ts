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
import { patientSettingsRoutes } from './modules/patients/patient-settings.routes'
import { practitionerDashboardRoutes } from './modules/practitioners/practitioners-dashboard.routes'
import { availabilitiesRoutes } from './modules/availabilities/availabilities.routes'
import { practitionerPatientsRoutes } from './modules/patients/patients.routes'
import { teleconsultationsRoutes } from './modules/teleconsultations/teleconsultations.routes'
import { adminDashboardRoutes } from './modules/admin/admin-dashboard.routes'
import { adminNoShowsRoutes } from './modules/admin/admin-no-shows.routes'
import { campaignsRoutes } from './modules/campaigns/campaigns.routes'

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
  fastify.register(patientSettingsRoutes, { prefix: '/api/settings' })
  fastify.register(practitionerDashboardRoutes, {
    prefix: '/api/practitioner/dashboard',
  })
  fastify.register(availabilitiesRoutes, {
    prefix: '/api/practitioner/agenda',
  })
  fastify.register(practitionerPatientsRoutes, {
    prefix: '/api/practitioner/patients',
  })
  fastify.register(teleconsultationsRoutes, {
    prefix: '/api/teleconsultations',
  })
  fastify.register(adminDashboardRoutes, {
    prefix: '/api/admin/dashboard',
  })
  fastify.register(adminNoShowsRoutes, {
    prefix: '/api/admin/no-shows',
  })
  fastify.register(campaignsRoutes, {
    prefix: '/api/admin/campaigns',
  })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
