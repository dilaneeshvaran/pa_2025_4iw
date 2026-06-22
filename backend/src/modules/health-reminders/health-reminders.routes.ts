import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { healthRemindersController } from './health-reminders.controller'

export async function healthRemindersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/practitioner/patients/:patientId',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['health-reminders'],
        description: "Lister les rappels santé d'un patient suivi",
      },
    },
    healthRemindersController.listForPatient.bind(healthRemindersController),
  )

  fastify.post(
    '/practitioner/patients/:patientId',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['health-reminders'],
        description: 'Créer un rappel santé pour un patient suivi',
      },
    },
    healthRemindersController.createForPatient.bind(healthRemindersController),
  )

  fastify.patch(
    '/practitioner/:reminderId/cancel',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['health-reminders'],
        description: 'Arrêter un rappel santé',
      },
    },
    healthRemindersController.cancel.bind(healthRemindersController),
  )

  fastify.get(
    '/patient/dashboard',
    {
      preHandler: [authenticate, authorize(['PATIENT'])],
      schema: {
        tags: ['health-reminders'],
        description: 'Lister les rappels santé reçus par le patient',
      },
    },
    healthRemindersController.getPatientDashboard.bind(
      healthRemindersController,
    ),
  )
}
