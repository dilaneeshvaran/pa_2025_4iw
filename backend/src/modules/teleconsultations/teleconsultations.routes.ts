import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { teleconsultationsController } from './teleconsultations.controller'

export async function teleconsultationsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/practitioner/today',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    teleconsultationsController.getTodaySessions.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/practitioner/waiting',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    teleconsultationsController.getWaitingPatients.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/practitioner/past',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    teleconsultationsController.getPastSessions.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/practitioner/history',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    teleconsultationsController.getHistory.bind(teleconsultationsController),
  )

  fastify.post(
    '/:id/no-show',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    teleconsultationsController.markNoShow.bind(teleconsultationsController),
  )

  fastify.get(
    '/patient',
    { preHandler: [authenticate, authorize(['PATIENT'])] },
    teleconsultationsController.getPatientTeleconsultations.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/appointment/:appointmentId',
    { preHandler: [authenticate] },
    teleconsultationsController.getSessionByAppointment.bind(
      teleconsultationsController,
    ),
  )

  fastify.post(
    '/:id/join',
    { preHandler: [authenticate] },
    teleconsultationsController.joinSession.bind(teleconsultationsController),
  )

  fastify.post(
    '/:id/end',
    { preHandler: [authenticate] },
    teleconsultationsController.endSession.bind(teleconsultationsController),
  )

  fastify.patch(
    '/:id/connection-quality',
    { preHandler: [authenticate] },
    teleconsultationsController.updateConnectionQuality.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/:id/summary',
    { preHandler: [authenticate] },
    teleconsultationsController.getSessionSummary.bind(
      teleconsultationsController,
    ),
  )

  fastify.get(
    '/:id/audit-log',
    { preHandler: [authenticate, authorize(['PRACTITIONER', 'ADMIN'])] },
    teleconsultationsController.getSessionAuditLog.bind(
      teleconsultationsController,
    ),
  )
}
