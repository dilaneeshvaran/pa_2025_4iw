import { FastifyInstance } from 'fastify'
import { practitionersController } from './practitioners.controller'
import {
  searchPractitionersSchema,
  getPractitionerByIdSchema,
  getCabinetByIdSchema,
  getAvailableSlotsSchema,
  getPractitionerStatisticsSchema,
} from './practitioners.schema'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'

export async function practitionersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/search',
    {
      schema: {
        querystring: searchPractitionersSchema,
        tags: ['practitioners'],
        description: 'Search and filter practitioners (public endpoint)',
      },
    },
    practitionersController.searchPractitioners.bind(practitionersController),
  )

  fastify.get(
    '/specialties',
    {
      schema: {
        tags: ['practitioners'],
        description: 'Get all specialties (public endpoint)',
      },
    },
    practitionersController.getSpecialties.bind(practitionersController),
  )

  fastify.get(
    '/cabinets',
    {
      schema: {
        tags: ['practitioners'],
        description: 'Get verified cabinets that have active practitioners',
      },
    },
    practitionersController.getCabinets.bind(practitionersController),
  )

  fastify.get(
    '/cabinets/:id',
    {
      schema: {
        params: getCabinetByIdSchema,
        tags: ['practitioners'],
        description: 'Get cabinet details by id (public endpoint)',
      },
    },
    practitionersController.getCabinetById.bind(practitionersController),
  )

  fastify.get(
    '/:id',
    {
      schema: {
        params: getPractitionerByIdSchema,
        tags: ['practitioners'],
        description: 'Get practitioner details (public endpoint)',
      },
    },
    practitionersController.getPractitionerById.bind(practitionersController),
  )

  fastify.get(
    '/:id/available-slots',
    {
      schema: {
        params: getPractitionerByIdSchema,
        querystring: getAvailableSlotsSchema.omit({ id: true }),
        tags: ['practitioners'],
        description:
          'Get available time slots for a practitioner (public endpoint)',
      },
    },
    practitionersController.getAvailableSlots.bind(practitionersController),
  )

  fastify.get(
    '/statistics',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        querystring: getPractitionerStatisticsSchema,
        tags: ['practitioners'],
        description: 'Get statistics for a practitioner (protected endpoint)',
      },
    },
    (request, reply) =>
      practitionersController.getStatistics(request as any, reply),
  )
}
