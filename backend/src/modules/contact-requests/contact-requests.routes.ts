import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ContactRequestsController } from './contact-requests.controller'
import { createContactRequestSchema } from './contact-requests.schema'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'

const contactRequestsController = new ContactRequestsController()

export async function contactRequestsRoutes(fastify: FastifyInstance) {
  //instance of app with validation awareness
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // create contact request
  app.post(
    '/',
    {
      schema: {
        body: createContactRequestSchema,
        tags: ['Contact Requests'],
        description: 'Create a new contact request for practitioners',
      },
    },
    contactRequestsController.createContactRequest.bind(
      contactRequestsController,
    ),
  )

  // admin/staff only
  app.get(
    '/',
    {
      preHandler: [authenticate, authorize(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['Contact Requests'],
        description: 'Get all contact requests (Admin/Staff only)',
      },
    },
    contactRequestsController.getAllContactRequests.bind(
      contactRequestsController,
    ),
  )

  app.get(
    '/:id',
    {
      preHandler: [authenticate, authorize(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['Contact Requests'],
        description: 'Get contact request by ID (Admin/Staff only)',
      },
    },
    contactRequestsController.getContactRequestById.bind(
      contactRequestsController,
    ),
  )

  app.patch(
    '/:id/status',
    {
      preHandler: [authenticate, authorize(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['Contact Requests'],
        description: 'Update contact request status (Admin/Staff only)',
      },
    },
    contactRequestsController.updateContactRequestStatus.bind(
      contactRequestsController,
    ),
  )

  app.delete(
    '/:id',
    {
      preHandler: [authenticate, authorize(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['Contact Requests'],
        description: 'Delete contact request (Admin/Staff only)',
      },
    },
    contactRequestsController.deleteContactRequest.bind(
      contactRequestsController,
    ),
  )
}
