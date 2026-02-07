import { FastifyInstance } from 'fastify'
import { practitionersController } from './practitioners.controller'
import {
  searchPractitionersSchema,
  getPractitionerByIdSchema,
  getAvailableSlotsSchema,
} from './practitioners.schema'

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
}
