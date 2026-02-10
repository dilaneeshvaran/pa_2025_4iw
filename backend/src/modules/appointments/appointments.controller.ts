import { FastifyRequest, FastifyReply } from 'fastify'
import { appointmentsService } from './appointments.service'

export class AppointmentsController {
  async getPatientAppointments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const query = request.query as {
        status?: string
        limit?: string
        page?: string
      }
      const status =
        (query.status as 'upcoming' | 'past' | 'cancelled' | 'all') || 'all'
      const limit = query.limit ? parseInt(query.limit, 10) : 10
      const page = query.page ? parseInt(query.page, 10) : 1

      // get patient id from user
      const patient = await import('../../config/database').then((m) =>
        m.default.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        }),
      )

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Patient profile not found',
        })
      }

      const result = await appointmentsService.getPatientAppointments(
        patient.id,
        status,
        limit,
        page,
      )

      return reply.status(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get appointments',
      })
    }
  }

  async getNextAppointment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }

      const patient = await import('../../config/database').then((m) =>
        m.default.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        }),
      )

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Patient profile not found',
        })
      }

      const appointment = await appointmentsService.getNextAppointment(
        patient.id,
      )

      return reply.status(200).send({
        success: true,
        data: appointment,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get next appointment',
      })
    }
  }

  async getPastAppointments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }

      const patient = await import('../../config/database').then((m) =>
        m.default.patient.findUnique({
          where: { userId: user.id },
          select: { id: true },
        }),
      )

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Patient profile not found',
        })
      }

      const appointments = await appointmentsService.getPastAppointments(
        patient.id,
        5,
      )

      return reply.status(200).send({
        success: true,
        data: appointments,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get past appointments',
      })
    }
  }
}

export const appointmentsController = new AppointmentsController()
