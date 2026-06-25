import type { Prisma } from '@prisma/client'
import prisma from '../../config/database'
import { UserNotification } from './notifications.types'

export class NotificationsService {
  private readonly defaultLimit = 10
  private readonly maxLimit = 50

  async getUserNotifications(
    userId: string,
    limit = this.defaultLimit,
    unreadOnly = false,
  ): Promise<UserNotification[]> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      channel: 'IN_APP',
    }

    if (unreadOnly) {
      where.read = false
    }

    const take = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), this.maxLimit)
      : this.defaultLimit

    const notifications = await prisma.notification.findMany({
      where,
      take,
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' },
      ],
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
        channel: 'IN_APP',
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

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        channel: 'IN_APP',
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return result.count
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
