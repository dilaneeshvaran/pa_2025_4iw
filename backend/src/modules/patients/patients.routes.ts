import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { patientsController } from './patients.controller'

export async function practitionerPatientsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-patients'],
        description:
          'Get list of patients who have had appointments with the practitioner',
      },
    },
    patientsController.getPatients.bind(patientsController),
  )

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-patients'],
        description: 'Get detailed patient information',
      },
    },
    patientsController.getPatientDetail.bind(patientsController),
  )
}
