import { FastifyRequest, FastifyReply } from 'fastify'
import { notificationsService } from './notifications.service'

export class NotificationsController {
  async getUserNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }
      const query = request.query as { limit?: string; unreadOnly?: string }

      const limit = query.limit ? parseInt(query.limit, 10) : 10
      const unreadOnly = query.unreadOnly === 'true'

      const notifications = await notificationsService.getUserNotifications(
        user.id,
        limit,
        unreadOnly,
      )

      return reply.status(200).send({
        success: true,
        data: notifications,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get notifications',
      })
    }
  }

  async markAsRead(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const user = request.user as { id: string }
      const { id } = request.params

      const success = await notificationsService.markAsRead(id, user.id)

      if (!success) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found',
        })
      }

      return reply.status(200).send({
        success: true,
        message: 'Notification marked as read',
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to mark notification as read',
      })
    }
  }

  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }

      const count = await notificationsService.getUnreadCount(user.id)

      return reply.status(200).send({
        success: true,
        data: { count },
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to get unread count',
      })
    }
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string }

      const count = await notificationsService.markAllAsRead(user.id)

      return reply.status(200).send({
        success: true,
        data: { count },
        message: 'Notifications marquées comme lues',
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Impossible de marquer les notifications comme lues',
      })
    }
  }
}

export const notificationsController = new NotificationsController()
