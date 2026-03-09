import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ContactRequestsController } from './contact-requests.controller'
import { createContactRequestSchema } from './contact-requests.schema'
import {
  authenticate,
  authenticateAttachmentRequest,
} from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'

const contactRequestsController = new ContactRequestsController()

export async function contactRequestsRoutes(fastify: FastifyInstance) {
  //instance of app with validation awareness
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // create contact request (json = DEMO/INFO/SUPPORT)
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

  // multi register for both practicioner and cabinet
  app.post(
    '/register',
    {
      schema: {
        tags: ['Contact Requests'],
        description:
          'Submit a professional registration request with document uploads',
      },
    },
    contactRequestsController.createRegistrationRequest.bind(
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

  // approve registration request
  app.post(
    '/:id/approve',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
      schema: {
        tags: ['Contact Requests'],
        description:
          'Approve a registration request and create the account (Admin only)',
      },
    },
    contactRequestsController.approveRequest.bind(contactRequestsController),
  )

  // reject registration request
  app.post(
    '/:id/reject',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
      schema: {
        tags: ['Contact Requests'],
        description: 'Reject a registration request with a reason (Admin only)',
      },
    },
    contactRequestsController.rejectRequest.bind(contactRequestsController),
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

  // download document attached to a request
  // support ?token= query param to open in a new browser tab
  app.get(
    '/:id/documents/:field',
    {
      preHandler: [
        authenticateAttachmentRequest,
        authorize(['ADMIN', 'STAFF']),
      ],
      schema: {
        tags: ['Contact Requests'],
        description:
          'Download a document attached to a registration request (Admin/Staff only)',
      },
    },
    contactRequestsController.downloadDocument.bind(contactRequestsController),
  )
}
