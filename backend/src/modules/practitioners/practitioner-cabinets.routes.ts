import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { practitionerCabinetsController } from './practitioner-cabinets.controller'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().cuid(),
})

export async function practitionerCabinetsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-cabinets'],
        description: 'Get cabinets and invitations for the logged-in practitioner',
      },
    },
    practitionerCabinetsController.getCabinetsAndInvitations.bind(
      practitionerCabinetsController,
    ),
  )

  fastify.post(
    '/invitations/:id/accept',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        params: paramsSchema,
        tags: ['practitioner-cabinets'],
        description: 'Accept a cabinet invitation',
      },
    },
    practitionerCabinetsController.acceptInvitation.bind(
      practitionerCabinetsController,
    ),
  )

  fastify.post(
    '/invitations/:id/reject',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        params: paramsSchema,
        tags: ['practitioner-cabinets'],
        description: 'Reject a cabinet invitation',
      },
    },
    practitionerCabinetsController.rejectInvitation.bind(
      practitionerCabinetsController,
    ),
  )

  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        params: paramsSchema,
        tags: ['practitioner-cabinets'],
        description: 'Leave a cabinet',
      },
    },
    practitionerCabinetsController.leaveCabinet.bind(
      practitionerCabinetsController,
    ),
  )

  fastify.patch(
    '/:id/toggle-pause',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        params: paramsSchema,
        tags: ['practitioner-cabinets'],
        description: 'Pause or resume participation in an active cabinet',
      },
    },
    practitionerCabinetsController.togglePauseCabinet.bind(
      practitionerCabinetsController,
    ),
  )

  fastify.get(
    '/:id/practitioners',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        params: paramsSchema,
        tags: ['practitioner-cabinets'],
        description: 'Get other practitioners in a specific cabinet',
      },
    },
    practitionerCabinetsController.getCabinetColleagues.bind(
      practitionerCabinetsController,
    ),
  )
}
