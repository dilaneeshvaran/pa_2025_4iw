import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { staffController } from './staff.controller'
import { bookAppointmentSchema, moveAppointmentSchema } from './staff.schema'

export async function staffRoutes(fastify: FastifyInstance) {
  // Dashboard
  fastify.get(
    '/dashboard',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: {
        tags: ['staff'],
        description: 'Get staff dashboard data',
      },
    },
    staffController.getDashboard.bind(staffController),
  )

  // Practitioners
  fastify.get(
    '/practitioners',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.getPractitioners.bind(staffController),
  )

  // Practitioner appointments
  fastify.get(
    '/practitioners/:id/appointments',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.getPractitionerAppointments.bind(staffController),
  )

  fastify.post(
    '/practitioners/:id/appointments',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: {
        body: bookAppointmentSchema,
        tags: ['staff'],
      },
    },
    staffController.bookAppointment.bind(staffController),
  )

  // Appointment management
  fastify.patch(
    '/appointments/:id/cancel',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.cancelAppointment.bind(staffController),
  )

  fastify.patch(
    '/appointments/:id/move',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: {
        body: moveAppointmentSchema,
        tags: ['staff'],
      },
    },
    staffController.moveAppointment.bind(staffController),
  )

  // patient search for practitioner
  fastify.get(
    '/practitioners/:id/patients/search',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.searchPatients.bind(staffController),
  )

  // staff profile / settings
  fastify.get(
    '/profile',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.getProfile.bind(staffController),
  )

  fastify.patch(
    '/profile',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.updateProfile.bind(staffController),
  )

  fastify.patch(
    '/email',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.updateEmail.bind(staffController),
  )

  fastify.patch(
    '/password',
    {
      preHandler: [authenticate, authorize(['STAFF'])],
      schema: { tags: ['staff'] },
    },
    staffController.updatePassword.bind(staffController),
  )
}
