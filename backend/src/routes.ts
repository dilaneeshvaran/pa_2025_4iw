import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { oauthRoutes } from './modules/oauth/oauth.routes'
import { contactRequestsRoutes } from './modules/contact-requests/contact-requests.routes'
import { practitionersRoutes } from './modules/practitioners/practitioners.routes'
import { appointmentsRoutes } from './modules/appointments/appointments.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'
import { medicalRecordsRoutes } from './modules/medical-records/medical-records.routes'
import { healthMetricsRoutes } from './modules/health-metrics/health-metrics.routes'
import { healthRemindersRoutes } from './modules/health-reminders/health-reminders.routes'
import { documentsRoutes } from './modules/documents/documents.routes'
import { messagesRoutes } from './modules/messages/messages.routes'
import { paymentsRoutes } from './modules/payments/payments.routes'
import { patientSettingsRoutes } from './modules/patients/patient-settings.routes'
import { practitionerDashboardRoutes } from './modules/practitioners/practitioners-dashboard.routes'
import { practitionerCabinetsRoutes } from './modules/practitioners/practitioner-cabinets.routes'
import { availabilitiesRoutes } from './modules/availabilities/availabilities.routes'
import { practitionerPatientsRoutes } from './modules/patients/patients.routes'
import { teleconsultationsRoutes } from './modules/teleconsultations/teleconsultations.routes'
import { adminDashboardRoutes } from './modules/admin/admin-dashboard.routes'
import { adminNoShowsRoutes } from './modules/admin/admin-no-shows.routes'
import { adminUsersRoutes } from './modules/admin/admin-users.routes'
import { adminSubscriptionsRoutes } from './modules/admin/admin-subscriptions.routes'
import { adminStatisticsRoutes } from './modules/admin/admin-statistics.routes'
import { adminSettingsRoutes } from './modules/admin/admin-settings.routes'
import { campaignsRoutes } from './modules/campaigns/campaigns.routes'
import { cabinetRoutes } from './modules/cabinet/cabinet.routes'
import { staffRoutes } from './modules/staff/staff.routes'
import { reviewsTsRestRoutes } from './modules/reviews/reviews.router'

export async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(oauthRoutes, { prefix: '/api/oauth' })
  fastify.register(contactRequestsRoutes, { prefix: '/api/contact-requests' })
  fastify.register(practitionersRoutes, { prefix: '/api/practitioners' })
  fastify.register(appointmentsRoutes, { prefix: '/api/appointments' })
  fastify.register(notificationsRoutes, { prefix: '/api/notifications' })
  fastify.register(medicalRecordsRoutes, { prefix: '/api/medical-records' })
  fastify.register(healthMetricsRoutes, { prefix: '/api/health-metrics' })
  fastify.register(healthRemindersRoutes, {
    prefix: '/api/health-reminders',
  })
  fastify.register(documentsRoutes, { prefix: '/api/documents' })
  fastify.register(messagesRoutes, { prefix: '/api/messages' })
  fastify.register(paymentsRoutes, { prefix: '/api/payments' })
  fastify.register(patientSettingsRoutes, { prefix: '/api/settings' })
  fastify.register(practitionerDashboardRoutes, {
    prefix: '/api/practitioner/dashboard',
  })
  fastify.register(practitionerCabinetsRoutes, {
    prefix: '/api/practitioner/cabinets',
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
  fastify.register(adminUsersRoutes, {
    prefix: '/api/admin/users',
  })
  fastify.register(adminSubscriptionsRoutes, {
    prefix: '/api/admin/subscriptions',
  })
  fastify.register(adminStatisticsRoutes, {
    prefix: '/api/admin/statistics',
  })
  fastify.register(adminSettingsRoutes, {
    prefix: '/api/admin/settings',
  })
  fastify.register(campaignsRoutes, {
    prefix: '/api/admin/campaigns',
  })
  fastify.register(cabinetRoutes, {
    prefix: '/api/cabinet',
  })
  fastify.register(staffRoutes, {
    prefix: '/api/staff',
  })
  fastify.register(reviewsTsRestRoutes, {
    prefix: '/api',
  })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
