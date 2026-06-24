import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { cabinetController } from './cabinet.controller'
import {
  updateCabinetInfoSchema,
  invitePractitionerSchema,
  createStaffSchema,
  updateStaffSchema,
  bookCabinetAppointmentSchema,
  transferOwnershipSchema,
} from './cabinet.schema'

export async function cabinetRoutes(fastify: FastifyInstance) {
  // Dashboard
  fastify.get(
    '/dashboard',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: {
        tags: ['cabinet'],
        description: 'Get cabinet dashboard data',
      },
    },
    cabinetController.getDashboard.bind(cabinetController),
  )

  // Cabinet info
  fastify.get(
    '/info',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getCabinetInfo.bind(cabinetController),
  )

  fastify.patch(
    '/info',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        body: updateCabinetInfoSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.updateCabinetInfo.bind(cabinetController),
  )

  // Practitioners
  fastify.get(
    '/practitioners',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getPractitioners.bind(cabinetController),
  )

  fastify.post(
    '/invite-practitioner',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        body: invitePractitionerSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.invitePractitioner.bind(cabinetController),
  )

  fastify.delete(
    '/practitioners/:id',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.removePractitioner.bind(cabinetController),
  )

  // Staff
  fastify.get(
    '/staff',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getStaff.bind(cabinetController),
  )

  fastify.post(
    '/staff',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        body: createStaffSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.createStaff.bind(cabinetController),
  )

  fastify.patch(
    '/staff/:id',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        body: updateStaffSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.updateStaff.bind(cabinetController),
  )

  fastify.delete(
    '/staff/:id',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.removeStaff.bind(cabinetController),
  )

  // Practitioner appointments
  fastify.get(
    '/practitioners/:id/appointments',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getPractitionerAppointments.bind(cabinetController),
  )

  // Practitioner schedule
  fastify.get(
    '/practitioners/:id/schedule',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getPractitionerSchedule.bind(cabinetController),
  )

  // Practitioner cabinet-scoped patients
  fastify.get(
    '/practitioners/:id/patients',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getPractitionerPatients.bind(cabinetController),
  )

  // Patient search for booking (email + cabinet history)
  fastify.get(
    '/practitioners/:id/patients/search',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.searchPatientsForBooking.bind(cabinetController),
  )

  // Book appointment for a practitioner
  fastify.post(
    '/practitioners/:id/appointments',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN', 'STAFF'])],
      schema: {
        body: bookCabinetAppointmentSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.bookAppointmentForPractitioner.bind(cabinetController),
  )

  // Delete cabinet
  fastify.delete(
    '/',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.deleteCabinet.bind(cabinetController),
  )

  // Transfer ownership
  fastify.post(
    '/transfer-ownership',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        body: transferOwnershipSchema,
        tags: ['cabinet'],
      },
    },
    cabinetController.transferOwnership.bind(cabinetController),
  )
}
