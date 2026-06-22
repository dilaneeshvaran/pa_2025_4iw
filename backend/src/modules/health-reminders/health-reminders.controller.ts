import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import {
  createHealthReminderSchema,
  healthReminderParamsSchema,
  healthReminderPatientParamsSchema,
  patientDashboardRemindersQuerySchema,
} from './health-reminders.schema'
import { healthRemindersService } from './health-reminders.service'
import {
  HealthReminderAccessError,
  HealthReminderValidationError,
} from './health-reminders.types'

export class HealthRemindersController {
  async createForPatient(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { patientId } = healthReminderPatientParamsSchema.parse(
        request.params,
      )
      const body = createHealthReminderSchema.parse(request.body)
      const practitionerId =
        await healthRemindersService.getPractitionerIdFromUserId(user.id)

      if (!practitionerId) {
        return reply.status(404).send({
          success: false,
          message: 'Profil praticien introuvable',
        })
      }

      const reminder = await healthRemindersService.createHealthReminder(
        practitionerId,
        patientId,
        body,
      )

      return reply.status(201).send({
        success: true,
        data: reminder,
        message: 'Rappel santé créé',
      })
    } catch (error) {
      return this.handleError(request, reply, error)
    }
  }

  async listForPatient(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { patientId } = healthReminderPatientParamsSchema.parse(
        request.params,
      )
      const practitionerId =
        await healthRemindersService.getPractitionerIdFromUserId(user.id)

      if (!practitionerId) {
        return reply.status(404).send({
          success: false,
          message: 'Profil praticien introuvable',
        })
      }

      const reminders =
        await healthRemindersService.getPractitionerPatientReminders(
          practitionerId,
          patientId,
        )

      return reply.status(200).send({
        success: true,
        data: reminders,
      })
    } catch (error) {
      return this.handleError(request, reply, error)
    }
  }

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { reminderId } = healthReminderParamsSchema.parse(request.params)
      const practitionerId =
        await healthRemindersService.getPractitionerIdFromUserId(user.id)

      if (!practitionerId) {
        return reply.status(404).send({
          success: false,
          message: 'Profil praticien introuvable',
        })
      }

      const reminder = await healthRemindersService.cancelHealthReminder(
        practitionerId,
        reminderId,
      )

      if (!reminder) {
        return reply.status(404).send({
          success: false,
          message: 'Rappel santé introuvable',
        })
      }

      return reply.status(200).send({
        success: true,
        data: reminder,
        message: 'Rappel santé arrêté',
      })
    } catch (error) {
      return this.handleError(request, reply, error)
    }
  }

  async getPatientDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const query = patientDashboardRemindersQuerySchema.parse(request.query)
      const patientId = await healthRemindersService.getPatientIdFromUserId(
        user.id,
      )

      if (!patientId) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient introuvable',
        })
      }

      const reminders = await healthRemindersService.getPatientDashboardReminders(
        patientId,
        query.limit,
      )

      return reply.status(200).send({
        success: true,
        data: reminders,
      })
    } catch (error) {
      return this.handleError(request, reply, error)
    }
  }

  private handleError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: unknown,
  ) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        message: 'Erreur de validation',
        errors: error.issues,
      })
    }

    if (error instanceof HealthReminderAccessError) {
      return reply.status(403).send({
        success: false,
        message: error.message,
      })
    }

    if (error instanceof HealthReminderValidationError) {
      return reply.status(400).send({
        success: false,
        message: error.message,
      })
    }

    request.log.error(error)
    return reply.status(500).send({
      success: false,
      message: 'Impossible de traiter les rappels santé',
    })
  }
}

export const healthRemindersController = new HealthRemindersController()
