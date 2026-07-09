import { FastifyInstance } from 'fastify'
import { adminUsersRoutes } from '../admin-users.routes'
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

jest.mock('../admin-users.service', () => ({
  __esModule: true,
  adminUsersService: {
    createAdmin: jest.fn(),
    getUsers: jest.fn(),
    getStats: jest.fn(),
    getUserById: jest.fn(),
    updateStatus: jest.fn(),
    deleteUser: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { adminUsersService: mockAdminUsersService } = jest.requireMock(
  '../admin-users.service',
) as {
  adminUsersService: {
    createAdmin: jest.Mock
    getUsers: jest.Mock
    getStats: jest.Mock
    getUserById: jest.Mock
    updateStatus: jest.Mock
    deleteUser: jest.Mock
  }
}

const createAdminPayload = {
  email: 'admin@example.com',
  password: 'Password1!',
}

describe('Admin users integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('ADMIN', 'admin-user'),
    )

    app = buildIntegrationApp({
      route: adminUsersRoutes,
      prefix: '/api/admin/users',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('POST /api/admin/users', () => {
    it('retourne 201 pour un administrateur authentifie', async () => {
      mockAdminUsersService.createAdmin.mockResolvedValue({
        id: 'created-admin',
        email: 'admin@example.com',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/users',
        headers: authHeader('ADMIN', 'admin-user'),
        payload: createAdminPayload,
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().data.email).toBe('admin@example.com')
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/users',
        payload: createAdminPayload,
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/users',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: createAdminPayload,
      })

      expect(response.statusCode).toBe(403)
    })

    it('rejette un payload invalide avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/users',
        headers: authHeader('ADMIN', 'admin-user'),
        payload: { email: 'bad-email', password: 'weak' },
      })

      expect(response.statusCode).toBe(400)
    })

    it("retourne 400 quand l'email existe deja", async () => {
      mockAdminUsersService.createAdmin.mockRejectedValue(
        new Error('Un utilisateur avec cet email existe d\u00e9j\u00e0'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/users',
        headers: authHeader('ADMIN', 'admin-user'),
        payload: createAdminPayload,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/admin/users', () => {
    it('retourne 200 avec la liste des utilisateurs', async () => {
      mockAdminUsersService.getUsers.mockResolvedValue({
        users: [{ id: 'user-1' }],
        total: 1,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: authHeader('ADMIN', 'admin-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.users).toHaveLength(1)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  it('GET /api/admin/users/stats retourne 200 pour un admin', async () => {
    mockAdminUsersService.getStats.mockResolvedValue({ total: 4 })

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users/stats',
      headers: authHeader('ADMIN', 'admin-user'),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.total).toBe(4)
  })

  it('GET /api/admin/users/stats retourne 403 pour un patient', async () => {
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users/stats',
      headers: authHeader('PATIENT', 'patient-user'),
    })

    expect(response.statusCode).toBe(403)
  })

  describe('GET /api/admin/users/:userId', () => {
    it('retourne 200 avec le detail utilisateur', async () => {
      mockAdminUsersService.getUserById.mockResolvedValue({ id: 'user-1' })

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users/user-1',
        headers: authHeader('ADMIN', 'admin-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe('user-1')
    })

    it('retourne 404 quand l utilisateur est introuvable', async () => {
      mockAdminUsersService.getUserById.mockRejectedValue(
        new Error('User not found'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users/unknown',
        headers: authHeader('ADMIN', 'admin-user'),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  it('PATCH /api/admin/users/:userId/status retourne 200 pour un admin', async () => {
    mockAdminUsersService.updateStatus.mockResolvedValue({
      id: 'user-1',
      status: 'SUSPENDED',
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/user-1/status',
      headers: authHeader('ADMIN', 'admin-user'),
      payload: { status: 'SUSPENDED' },
    })

    expect(response.statusCode).toBe(200)
  })

  it('PATCH /api/admin/users/:userId/status retourne 403 pour un patient', async () => {
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/user-1/status',
      headers: authHeader('PATIENT', 'patient-user'),
      payload: { status: 'SUSPENDED' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('DELETE /api/admin/users/:userId retourne 200 pour un admin', async () => {
    mockAdminUsersService.deleteUser.mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/users/user-1',
      headers: authHeader('ADMIN', 'admin-user'),
    })

    expect(response.statusCode).toBe(200)
  })

  it('DELETE /api/admin/users/:userId retourne 403 pour un patient', async () => {
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/users/user-1',
      headers: authHeader('PATIENT', 'patient-user'),
    })

    expect(response.statusCode).toBe(403)
  })
})
