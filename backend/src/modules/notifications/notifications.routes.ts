import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { notificationsService } from './notifications.service'
import { authenticate } from '../../middleware/authenticate'

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    },
  )

  fastify.get(
    '/unread-count',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    },
  )

  fastify.put(
    '/read-all',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    },
  )

  // mark notification as read
  fastify.put(
    '/:id/read',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const params = request.params as { id: string }

        const success = await notificationsService.markAsRead(
          params.id,
          user.id,
        )

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
    },
  )
}
