import { FastifyInstance } from 'fastify'
import { notificationsRoutes } from '../notifications.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import { testUser } from '../../../__tests__/helpers/integration-fixtures'
import prisma from '../../../config/database'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../notifications.service', () => ({
  __esModule: true,
  notificationsService: {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { notificationsService: mockNotificationsService } = jest.requireMock(
  '../notifications.service',
) as {
  notificationsService: {
    getUserNotifications: jest.Mock
    getUnreadCount: jest.Mock
    markAllAsRead: jest.Mock
    markAsRead: jest.Mock
  }
}

describe('Notifications integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )

    app = buildIntegrationApp({
      route: notificationsRoutes,
      prefix: '/api/notifications',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('GET /api/notifications', () => {
    it('retourne 200 avec les notifications utilisateur', async () => {
      mockNotificationsService.getUserNotifications.mockResolvedValue([
        {
          id: 'notification-1',
          title: 'Rappel',
          message: 'Rendez-vous demain',
          read: false,
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
      ])

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications?limit=5&unreadOnly=true',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith(
        'patient-user',
        5,
        true,
      )
      expect(response.json().data).toHaveLength(1)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/notifications/unread-count', () => {
    it('retourne 200 avec le nombre de notifications non lues', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(3)

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/unread-count',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.count).toBe(3)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/unread-count',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /api/notifications/read-all', () => {
    it('retourne 200 apres avoir marque les notifications comme lues', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(2)

      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/read-all',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.count).toBe(2)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/read-all',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /api/notifications/:id/read', () => {
    it('retourne 200 quand la notification existe', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(true)

      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/notification-1/read',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        'notification-1',
        'patient-user',
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/notification-1/read',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 404 quand la notification est introuvable', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(false)

      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/unknown/read',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
