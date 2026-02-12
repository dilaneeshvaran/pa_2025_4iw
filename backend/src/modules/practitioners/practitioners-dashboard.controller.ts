import { FastifyRequest, FastifyReply } from 'fastify'
import { practitionerDashboardService } from './practitioners-dashboard.service'
import prisma from '../../config/database'
import { createTodoSchema } from './practitioners-dashboard.schema'

export class PractitionerDashboardController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
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

      const data = await practitionerDashboardService.getDashboardData(
        practitioner.id,
      )

      return reply.status(200).send({
        success: true,
        data,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get dashboard data',
      })
    }
  }

  async createTodo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const body = createTodoSchema.parse(request.body)

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

      const todo = await practitionerDashboardService.createTodo(
        practitioner.id,
        body.title,
      )

      return reply.status(201).send({
        success: true,
        data: todo,
      })
    } catch (error) {
      request.log.error(error)

      // handle zod
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error,
        })
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to create todo',
      })
    }
  }

  async toggleTodo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id: todoId } = request.params as { id: string }

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

      const todo = await practitionerDashboardService.toggleTodo(
        practitioner.id,
        todoId,
      )

      return reply.status(200).send({
        success: true,
        data: todo,
      })
    } catch (error) {
      request.log.error(error)
      const message =
        error instanceof Error ? error.message : 'Failed to toggle todo'
      return reply.status(400).send({
        success: false,
        message,
      })
    }
  }

  async deleteTodo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id: todoId } = request.params as { id: string }

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

      await practitionerDashboardService.deleteTodo(practitioner.id, todoId)

      return reply.status(200).send({
        success: true,
        message: 'Todo deleted',
      })
    } catch (error) {
      request.log.error(error)
      const message =
        error instanceof Error ? error.message : 'Failed to delete todo'
      return reply.status(400).send({
        success: false,
        message,
      })
    }
  }
}

export const practitionerDashboardController =
  new PractitionerDashboardController()
