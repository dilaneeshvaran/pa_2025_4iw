import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { cabinetController } from './cabinet.controller'
import {
  updateCabinetInfoSchema,
  invitePractitionerSchema,
  createStaffSchema,
  updateStaffSchema,
} from './cabinet.schema'

export async function cabinetRoutes(fastify: FastifyInstance) {
  // Dashboard
  fastify.get(
    '/dashboard',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: {
        tags: ['cabinet'],
        description: 'Get cabinet admin dashboard data',
      },
    },
    cabinetController.getDashboard.bind(cabinetController),
  )

  // Cabinet info
  fastify.get(
    '/info',
    {
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
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
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
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
      preHandler: [authenticate, authorize(['CABINET_ADMIN'])],
      schema: { tags: ['cabinet'] },
    },
    cabinetController.getPractitionerAppointments.bind(cabinetController),
  )
}
