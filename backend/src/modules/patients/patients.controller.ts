import { FastifyRequest, FastifyReply } from 'fastify'
import { patientsService } from './patients.service'
import { patientsListQuerySchema } from './patients.schema'
import prisma from '../../config/database'

export class PatientsController {
  async getPatients(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!practitioner) {
        return reply.status(404).send({
          success: false,
          message: 'Practitioner profile not found',
        })
      }

      const query = patientsListQuerySchema.parse(request.query)
      const data = await patientsService.getPatientsList(practitioner.id, query)

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error,
        })
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch patients',
      })
    }
  }

  async getPatientDetail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { id: patientId } = request.params as { id: string }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!practitioner) {
        return reply.status(404).send({
          success: false,
          message: 'Practitioner profile not found',
        })
      }

      const data = await patientsService.getPatientDetail(
        practitioner.id,
        patientId,
      )

      if (!data) {
        return reply.status(404).send({
          success: false,
          message: 'Patient not found or no relation with this practitioner',
        })
      }

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch patient details',
      })
    }
  }

  async getPatientDocuments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { id: patientId } = request.params as { id: string }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!practitioner) {
        return reply.status(404).send({
          success: false,
          message: 'Practitioner profile not found',
        })
      }

      const data = await patientsService.getPatientDocuments(
        practitioner.id,
        patientId,
      )

      if (!data) {
        return reply.status(404).send({
          success: false,
          message: 'Patient not found or no relation with this practitioner',
        })
      }

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch patient documents',
      })
    }
  }
}

export const patientsController = new PatientsController()
