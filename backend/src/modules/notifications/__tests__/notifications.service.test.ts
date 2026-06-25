import { NotificationsService } from '../notifications.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const buildNotification = (overrides = {}) => ({
  id: 'notif-1',
  userId: 'user-1',
  type: 'MESSAGE_RECEIVED',
  channel: 'IN_APP',
  title: 'Nouveau message',
  message: 'Vous avez reçu un message',
  metadata: { conversationId: 'conv-1' },
  sent: true,
  sentAt: new Date(),
  read: false,
  readAt: null,
  deliveryStatus: 'DELIVERED',
  errorMessage: null,
  createdAt: new Date('2026-01-02T10:00:00.000Z'),
  ...overrides,
})

describe('NotificationsService', () => {
  let service: NotificationsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationsService()
  })

  describe('getUserNotifications', () => {
    it('ne retourne que les notifications IN_APP de l’utilisateur courant', async () => {
      const notification = buildNotification()
      mockPrisma.notification.findMany.mockResolvedValue([notification])

      const result = await service.getUserNotifications('user-1', 200, true)

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          channel: 'IN_APP',
          read: false,
        },
        take: 50,
        orderBy: [
          { read: 'asc' },
          { createdAt: 'desc' },
        ],
      })
      expect(result).toEqual([
        {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          read: notification.read,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        },
      ])
    })
  })

  describe('markAsRead', () => {
    it('marque uniquement une notification IN_APP appartenant à l’utilisateur', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(buildNotification())
      mockPrisma.notification.update.mockResolvedValue(
        buildNotification({ read: true, readAt: new Date() }),
      )

      const result = await service.markAsRead('notif-1', 'user-1')

      expect(result).toBe(true)
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'notif-1',
          userId: 'user-1',
          channel: 'IN_APP',
        },
      })
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
    })

    it('retourne false quand la notification est absente ou inaccessible', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null)

      const result = await service.markAsRead('notif-1', 'user-1')

      expect(result).toBe(false)
      expect(mockPrisma.notification.update).not.toHaveBeenCalled()
    })
  })

  describe('markAllAsRead', () => {
    it('marque comme lues les notifications IN_APP non lues de l’utilisateur courant', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 })

      const result = await service.markAllAsRead('user-1')

      expect(result).toBe(3)
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          channel: 'IN_APP',
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
    })
  })

  describe('getUnreadCount', () => {
    it('compte uniquement les notifications IN_APP non lues', async () => {
      mockPrisma.notification.count.mockResolvedValue(4)

      const result = await service.getUnreadCount('user-1')

      expect(result).toBe(4)
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          read: false,
          channel: 'IN_APP',
        },
      })
    })
  })
})
