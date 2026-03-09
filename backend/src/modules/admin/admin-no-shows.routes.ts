import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminNoShowsController } from './admin-no-shows.controller'

export async function adminNoShowsRoutes(fastify: FastifyInstance) {
  // patients with no shows
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    adminNoShowsController.getNoShowPatients.bind(adminNoShowsController),
  )

  //patient noshow history
  fastify.get(
    '/:patientId/history',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    adminNoShowsController.getPatientHistory.bind(adminNoShowsController),
  )

  fastify.post(
    '/:patientId/warn',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    adminNoShowsController.sendWarning.bind(adminNoShowsController),
  )

  fastify.post(
    '/:patientId/ban',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    adminNoShowsController.banPatient.bind(adminNoShowsController),
  )

  // lift sanction
  fastify.post(
    '/:patientId/lift',
    {
      preHandler: [authenticate, authorize(['ADMIN'])],
    },
    adminNoShowsController.liftSanction.bind(adminNoShowsController),
  )
}
