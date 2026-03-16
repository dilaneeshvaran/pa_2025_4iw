import { FastifyRequest, FastifyReply } from 'fastify'
import { practitionerDashboardService } from './practitioners-dashboard.service'
import prisma from '../../config/database'
import {
  createTodoSchema,
  updateBillingConfigSchema,
} from './practitioners-dashboard.schema'
import { cabinetService } from '../cabinet/cabinet.service'

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

  async getBillingConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
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

      const config = await practitionerDashboardService.getBillingConfig(
        practitioner.id,
      )

      return reply.status(200).send({
        success: true,
        data: config,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get billing config',
      })
    }
  }

  async updateBillingConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const body = updateBillingConfigSchema.parse(request.body)

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

      const config = await practitionerDashboardService.updateBillingConfig(
        practitioner.id,
        body,
      )

      return reply.status(200).send({
        success: true,
        message: 'Configuration mise à jour avec succès',
        data: config,
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
        message: 'Failed to update billing config',
      })
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })
      const data = await practitionerDashboardService.getProfile(
        practitioner.id,
      )
      return reply.send({ success: true, data })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })
      const body = request.body as any
      const data = await practitionerDashboardService.updateProfile(
        practitioner.id,
        body,
      )
      return reply.send({ success: true, data })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }

  async getSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })
      const data = await practitionerDashboardService.getSubscription(
        practitioner.id,
      )
      return reply.send({ success: true, data })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }

  async cancelSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })
      const data = await practitionerDashboardService.cancelSubscription(
        practitioner.id,
      )
      return reply.send({ success: true, data })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }

  //staff management
  async getStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })

      const staff = await prisma.staff.findMany({
        where: { practitionerId: practitioner.id },
        include: {
          user: { select: { email: true, status: true } },
        },
      })

      return reply.send({ success: true, data: staff })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }

  async createStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })

      const body = request.body as {
        email: string
        firstName: string
        lastName: string
        phone: string
        position: string
      }

      const data = await cabinetService.createStaff(
        user.id,
        body,
        false,
        practitioner.id,
      )

      return reply.status(201).send({ success: true, data })
    } catch (e: any) {
      return reply.status(400).send({ success: false, message: e.message })
    }
  }

  async updateStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id: staffId } = request.params as { id: string }
      const { position } = request.body as { position: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })

      const staff = await prisma.staff.findFirst({
        where: { id: staffId, practitionerId: practitioner.id },
      })
      if (!staff)
        return reply
          .status(404)
          .send({ success: false, message: 'Staff not found' })

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: { position },
        include: {
          user: { select: { email: true, status: true } },
        },
      })

      return reply.send({ success: true, data: updated })
    } catch (e: any) {
      return reply.status(400).send({ success: false, message: e.message })
    }
  }

  async removeStaff(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const { id: staffId } = request.params as { id: string }
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner)
        return reply.status(404).send({ success: false, message: 'Not found' })

      const staff = await prisma.staff.findFirst({
        where: { id: staffId, practitionerId: practitioner.id },
      })
      if (!staff)
        return reply
          .status(404)
          .send({ success: false, message: 'Staff not found' })

      await prisma.staff.delete({ where: { id: staffId } })
      await prisma.user.delete({ where: { id: staff.userId } })

      return reply.send({ success: true, message: 'Personnel supprimé' })
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message })
    }
  }
}

export const practitionerDashboardController =
  new PractitionerDashboardController()
