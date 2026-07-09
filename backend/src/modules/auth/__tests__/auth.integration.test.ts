import { FastifyInstance } from 'fastify'
import { authRoutes } from '../auth.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import { testUser } from '../../../__tests__/helpers/integration-fixtures'
import prisma from '../../../config/database'
import { AuthService } from '../auth.service'

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

jest.mock('../auth.service', () => ({
  __esModule: true,
  mockAuthService: {
    signup: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
    verifyEmail: jest.fn(),
    resetPassword: jest.fn(),
  },
  AuthService: jest.fn(function (this: unknown) {
    return jest.requireMock('../auth.service').mockAuthService
  }),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { mockAuthService } = jest.requireMock('../auth.service') as {
  mockAuthService: {
    signup: jest.Mock
    login: jest.Mock
    refreshAccessToken: jest.Mock
    logout: jest.Mock
    verifyEmail: jest.Mock
    resetPassword: jest.Mock
  }
}
const mockedAuthServiceClass = AuthService as jest.Mock

const validSignupPayload = {
  email: 'patient@example.com',
  password: 'Password1!',
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: '+33612345678',
  dateOfBirth: '1990-01-01',
  gender: 'MALE',
}

describe('Auth integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    mockedAuthServiceClass.mockClear()

    app = buildIntegrationApp({
      route: authRoutes,
      prefix: '/api/auth',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('POST /api/auth/signup', () => {
    it('retourne 201 pour une inscription valide', async () => {
      mockAuthService.signup.mockResolvedValue({
        user: { id: 'user-1', email: 'patient@example.com', role: 'PATIENT' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: validSignupPayload,
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({ email: 'patient@example.com' }),
          }),
        }),
      )
    })

    it('rejette un email invalide avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: { ...validSignupPayload, email: 'email-invalide' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('rejette un mot de passe faible avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: { ...validSignupPayload, password: 'weak' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('rejette les champs manquants avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: { email: 'patient@example.com' },
      })

      expect(response.statusCode).toBe(400)
    })

    it("retourne 400 quand l'email existe deja", async () => {
      mockAuthService.signup.mockRejectedValue(
        new Error('Un utilisateur avec cet email existe déjà'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: validSignupPayload,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('email existe déjà')
    })
  })

  describe('POST /api/auth/login', () => {
    it('retourne 200 pour des identifiants valides', async () => {
      mockAuthService.login.mockResolvedValue({
        user: { id: 'user-1', email: 'patient@example.com', role: 'PATIENT' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'patient@example.com',
          password: 'Password1!',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'patient@example.com',
        'Password1!',
      )
    })

    it('rejette un payload invalide avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'bad-email', password: '' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('retourne 401 pour des identifiants incorrects', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Email ou mot de passe incorrect'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'patient@example.com',
          password: 'WrongPassword1!',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('retourne 200 avec un refresh token valide', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: { refreshToken: 'refresh-token' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.accessToken).toBe('new-access-token')
    })

    it('rejette un token absent avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('retourne 200 avec un refresh token', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        payload: { refreshToken: 'refresh-token' },
      })

      expect(response.statusCode).toBe(200)
    })

    it('rejette un token absent avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  it('POST /api/auth/verify-email rejette un token invalide avec 400', async () => {
    mockAuthService.verifyEmail.mockRejectedValue(new Error('Token invalide'))

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: { token: 'invalid-token' },
    })

    expect(response.statusCode).toBe(400)
  })

  describe('POST /api/auth/reset-password', () => {
    it('rejette un mot de passe faible avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: 'reset-token', newPassword: 'weak' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('rejette un token vide avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: '', newPassword: 'Password1!' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/auth/validate', () => {
    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/validate',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 200 avec un token valide', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/validate',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.user.role).toBe('PATIENT')
    })
  })
})
