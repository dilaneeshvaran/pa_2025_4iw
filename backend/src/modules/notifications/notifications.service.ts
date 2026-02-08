import prisma from '../../config/database'
import { UserNotification } from './notifications.types'

export class NotificationsService {
  async getUserNotifications(
    userId: string,
    limit = 10,
    unreadOnly = false,
  ): Promise<UserNotification[]> {
    const where: any = {
      userId,
      channel: 'IN_APP', // only get in app notifications for dashboard
    }

    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      read: n.read,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }))
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    })

    if (!notification) {
      return false
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return true
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
        channel: 'IN_APP',
      },
    })
  }
}

export const notificationsService = new NotificationsService()
