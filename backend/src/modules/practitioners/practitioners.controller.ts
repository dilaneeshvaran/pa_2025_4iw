import { FastifyRequest, FastifyReply } from 'fastify'
import { practitionersService } from './practitioners.service'
import prisma from '../../config/database'
import type {
  SearchPractitionersInput,
  GetPractitionerByIdInput,
  GetAvailableSlotsInput,
  GetPractitionerStatisticsInput,
} from './practitioners.schema'

export class PractitionersController {
  async searchPractitioners(
    request: FastifyRequest<{ Querystring: SearchPractitionersInput }>,
    reply: FastifyReply,
  ) {
    try {
      const filters = request.query

      const result = await practitionersService.searchPractitioners(filters)

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
        message: 'Failed to search practitioners',
      })
    }
  }

  async getPractitionerById(
    request: FastifyRequest<{ Params: GetPractitionerByIdInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params

      const practitioner = await practitionersService.getPractitionerById(id)

      if (!practitioner) {
        return reply.status(404).send({
          success: false,
          message: 'Practitioner not found',
        })
      }

      return reply.status(200).send({
        success: true,
        data: practitioner,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get practitioner',
      })
    }
  }

  async getAvailableSlots(
    request: FastifyRequest<{
      Params: { id: string }
      Querystring: Omit<GetAvailableSlotsInput, 'id'>
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params
      const { startDate, endDate, days } = request.query

      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined

      const slots = await practitionersService.getAvailableSlots(
        id,
        start,
        end,
        days,
      )

      return reply.status(200).send({
        success: true,
        data: slots,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get available slots',
      })
    }
  }

  async getSpecialties(request: FastifyRequest, reply: FastifyReply) {
    try {
      const specialties = await prisma.specialty.findMany({
        orderBy: {
          name: 'asc',
        },
      })

      return reply.status(200).send({
        success: true,
        data: specialties,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get specialties',
      })
    }
  }

  async getStatistics(
    request: FastifyRequest<{ Querystring: GetPractitionerStatisticsInput }>,
    reply: FastifyReply,
  ) {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized',
        })
      }

      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: request.user.id },
      })

      if (!practitioner) {
        return reply.status(404).send({
          success: false,
          message: 'Practitioner not found',
        })
      }

      const practitionerId = practitioner.id
      const { period, startDate, endDate } = request.query

      const data = await practitionersService.getStatistics(
        practitionerId,
        period,
        startDate,
        endDate,
      )

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get statistics',
      })
    }
  }
}

export const practitionersController = new PractitionersController()
