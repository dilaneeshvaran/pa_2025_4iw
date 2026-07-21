import { OAuthService } from '../oauth.service'
import { UserRole, UserStatus, AuditAction } from '@prisma/client'

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    staff: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMockInstance)),
  },
}))

const prismaMockInstance = require('../../../config/database').default

jest.mock('../../../config/redis', () => ({
  redis: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
  },
}))

const mockRedis = require('../../../config/redis').redis

jest.mock('../../../utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('access_token_google'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh_token_google'),
  verifyRefreshToken: jest.fn(),
  generateMfaToken: jest.fn(),
  verifyMfaToken: jest.fn(),
}))

jest.mock('../../../utils/normalize-email', () => ({
  normalizeEmail: jest.fn((email: string) => email.toLowerCase()),
}))

jest.mock('google-auth-library', () => {
  const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock=true')
  const mockGetToken = jest.fn()
  const mockVerifyIdToken = jest.fn()

  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      generateAuthUrl: mockGenerateAuthUrl,
      getToken: mockGetToken,
      verifyIdToken: mockVerifyIdToken,
    })),
    __mockGenerateAuthUrl: mockGenerateAuthUrl,
    __mockGetToken: mockGetToken,
    __mockVerifyIdToken: mockVerifyIdToken,
  }
})

const { __mockGetToken: mockGetToken, __mockVerifyIdToken: mockVerifyIdToken } =
  require('google-auth-library')

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockGoogleProfile = {
  sub: 'google-uid-123',
  email: 'user@gmail.com',
  email_verified: true,
  name: 'Jean Dupont',
  given_name: 'Jean',
  family_name: 'Dupont',
  picture: 'https://lh3.googleusercontent.com/photo.jpg',
}

function setupGoogleTokenMocks() {
  mockGetToken.mockResolvedValue({
    tokens: { id_token: 'mock-id-token' },
  })
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => mockGoogleProfile,
  })
}

function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'user@gmail.com',
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    googleId: null,
    password: 'hashed_password',
    emailVerified: new Date(),
    deletedAt: null,
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('OAuthService', () => {
  let oauthService: OAuthService

  beforeEach(() => {
    jest.clearAllMocks()
    oauthService = new OAuthService()

    // Default: redis returns stored state
    mockRedis.get.mockResolvedValue(JSON.stringify({ nonce: 'test-nonce', redirectUrl: '' }))

    // Default: audit log creation
    prismaMockInstance.auditLog.create.mockResolvedValue({})

    // Default: refresh token creation
    prismaMockInstance.refreshToken.create.mockResolvedValue({})
  })

  describe('buildAuthorizationUrl', () => {
    it('devrait générer une URL d\'autorisation et stocker le state dans Redis', async () => {
      const url = await oauthService.buildAuthorizationUrl()

      expect(url).toContain('accounts.google.com')
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('oauth:state:'),
        expect.any(String),
        'EX',
        600,
      )
    })

    it('devrait stocker l\'URL de redirection dans le state', async () => {
      await oauthService.buildAuthorizationUrl('/patient/dashboard')

      const setCall = mockRedis.set.mock.calls[0]
      const storedData = JSON.parse(setCall[1])
      expect(storedData.redirectUrl).toBe('/patient/dashboard')
    })
  })

  describe('validateState', () => {
    it('devrait valider un state valide et le supprimer', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ nonce: 'n', redirectUrl: '/dash' }))

      const result = await oauthService.validateState('valid-state')

      expect(result.nonce).toBe('n')
      expect(result.redirectUrl).toBe('/dash')
      expect(mockRedis.del).toHaveBeenCalledWith('oauth:state:valid-state')
    })

    it('devrait rejeter un state invalide', async () => {
      mockRedis.get.mockResolvedValue(null)

      await expect(oauthService.validateState('invalid-state')).rejects.toThrow(
        'State OAuth invalide ou expiré',
      )
    })
  })

  describe('exchangeAuthorizationCode', () => {
    it('devrait échanger le code contre un ID token', async () => {
      mockGetToken.mockResolvedValue({
        tokens: { id_token: 'valid-id-token' },
      })

      const result = await oauthService.exchangeAuthorizationCode('auth-code')

      expect(result.idToken).toBe('valid-id-token')
    })

    it('devrait échouer si l\'ID token est manquant', async () => {
      mockGetToken.mockResolvedValue({
        tokens: { access_token: 'at' },
      })

      await expect(
        oauthService.exchangeAuthorizationCode('auth-code'),
      ).rejects.toThrow('token ID manquant')
    })
  })

  describe('validateAndDecodeIdToken', () => {
    it('devrait décoder un ID token valide', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockGoogleProfile,
      })

      const profile = await oauthService.validateAndDecodeIdToken('valid-token')

      expect(profile.sub).toBe('google-uid-123')
      expect(profile.email).toBe('user@gmail.com')
      expect(profile.given_name).toBe('Jean')
    })

    it('devrait rejeter un token sans payload', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      })

      await expect(
        oauthService.validateAndDecodeIdToken('bad-token'),
      ).rejects.toThrow('profil introuvable')
    })

    it('devrait rejeter un email non vérifié', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ ...mockGoogleProfile, email_verified: false }),
      })

      await expect(
        oauthService.validateAndDecodeIdToken('unverified-token'),
      ).rejects.toThrow('email non vérifié')
    })
  })

  describe('loginWithGoogle', () => {
    describe('Cas 1 : Utilisateur inexistant', () => {
      it('devrait créer un nouvel utilisateur PATIENT', async () => {
        prismaMockInstance.user.findUnique.mockResolvedValue(null)
        prismaMockInstance.user.findFirst.mockResolvedValue(null)

        const createdUser = createMockUser({ id: 'new-user-1', googleId: 'google-uid-123' })
        prismaMockInstance.user.create.mockResolvedValue(createdUser)
        prismaMockInstance.patient.create.mockResolvedValue({})
        prismaMockInstance.patient.findUnique.mockResolvedValue({
          firstName: 'Jean',
          lastName: 'Dupont',
        })

        // After creation, findUnique for the final user fetch
        prismaMockInstance.user.findUnique
          .mockResolvedValueOnce(null) // first call: findUnique by googleId
          .mockResolvedValueOnce(createdUser) // second call: fetch after creation

        const result = await oauthService.loginWithGoogle(mockGoogleProfile)

        expect(result.user).toBeDefined()
        expect(result.user!.role).toBe(UserRole.PATIENT)
        expect(result.tokens).toBeDefined()
        expect(result.tokens!.accessToken).toBe('access_token_google')

        // Verify audit log for REGISTER_GOOGLE
        expect(prismaMockInstance.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: AuditAction.REGISTER_GOOGLE,
            }),
          }),
        )

        // Verify audit log for LOGIN_GOOGLE
        expect(prismaMockInstance.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: AuditAction.LOGIN_GOOGLE,
            }),
          }),
        )
      })
    })

    describe('Cas 2 : Utilisateur existant, même email, sans googleId', () => {
      it('devrait lier le compte Google et connecter', async () => {
        const existingUser = createMockUser()

        prismaMockInstance.user.findUnique
          .mockResolvedValueOnce(null) // no match by googleId
          .mockResolvedValueOnce(existingUser) // fetch after link

        prismaMockInstance.user.findFirst.mockResolvedValue(existingUser) // match by email
        prismaMockInstance.user.update.mockResolvedValue(existingUser)
        prismaMockInstance.patient.findUnique.mockResolvedValue({
          firstName: 'Jean',
          lastName: 'Dupont',
        })

        const result = await oauthService.loginWithGoogle(mockGoogleProfile)

        expect(result.user).toBeDefined()
        expect(result.tokens).toBeDefined()

        // Verify account was linked
        expect(prismaMockInstance.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'user-1' },
            data: { googleId: 'google-uid-123' },
          }),
        )

        // Verify ACCOUNT_LINKED_GOOGLE audit log
        expect(prismaMockInstance.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: AuditAction.ACCOUNT_LINKED_GOOGLE,
            }),
          }),
        )
      })
    })

    describe('Cas 3 : Compte Google déjà lié', () => {
      it('devrait connecter directement', async () => {
        const linkedUser = createMockUser({ googleId: 'google-uid-123' })

        prismaMockInstance.user.findUnique
          .mockResolvedValueOnce(linkedUser) // match by googleId
          .mockResolvedValueOnce(linkedUser) // fetch after login

        prismaMockInstance.user.update.mockResolvedValue(linkedUser)
        prismaMockInstance.patient.findUnique.mockResolvedValue({
          firstName: 'Jean',
          lastName: 'Dupont',
        })

        const result = await oauthService.loginWithGoogle(mockGoogleProfile)

        expect(result.user).toBeDefined()
        expect(result.tokens).toBeDefined()
        expect(result.user!.email).toBe('user@gmail.com')
      })
    })

    describe('Cas 4 : Compte supprimé', () => {
      it('devrait refuser la connexion', async () => {
        const deletedUser = createMockUser({ deletedAt: new Date() })

        prismaMockInstance.user.findUnique.mockResolvedValueOnce(null)
        prismaMockInstance.user.findFirst.mockResolvedValue(deletedUser)

        await expect(oauthService.loginWithGoogle(mockGoogleProfile)).rejects.toThrow(
          'Ce compte a été supprimé',
        )

        // Verify GOOGLE_LOGIN_FAILED audit log
        expect(prismaMockInstance.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: AuditAction.GOOGLE_LOGIN_FAILED,
              metadata: { reason: 'Compte supprimé' },
            }),
          }),
        )
      })
    })

    describe('Compte suspendu', () => {
      it('devrait refuser la connexion pour un compte suspendu', async () => {
        const suspendedUser = createMockUser({ status: UserStatus.SUSPENDED })

        prismaMockInstance.user.findUnique.mockResolvedValueOnce(null)
        prismaMockInstance.user.findFirst.mockResolvedValue(suspendedUser)

        await expect(oauthService.loginWithGoogle(mockGoogleProfile)).rejects.toThrow(
          'Votre compte a été suspendu',
        )

        // Verify GOOGLE_LOGIN_FAILED audit log
        expect(prismaMockInstance.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: AuditAction.GOOGLE_LOGIN_FAILED,
              metadata: { reason: 'Compte suspendu' },
            }),
          }),
        )
      })
    })

    describe('Génération JWT', () => {
      it('devrait utiliser le service AuthService existant pour générer les tokens', async () => {
        const linkedUser = createMockUser({ googleId: 'google-uid-123' })

        prismaMockInstance.user.findUnique
          .mockResolvedValueOnce(linkedUser)
          .mockResolvedValueOnce(linkedUser)

        prismaMockInstance.user.update.mockResolvedValue(linkedUser)
        prismaMockInstance.patient.findUnique.mockResolvedValue({
          firstName: 'Jean',
          lastName: 'Dupont',
        })

        const result = await oauthService.loginWithGoogle(mockGoogleProfile)

        expect(result.tokens!.accessToken).toBe('access_token_google')
        expect(result.tokens!.refreshToken).toBe('refresh_token_google')

        // Verify refresh token was stored in DB
        expect(prismaMockInstance.refreshToken.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: 'user-1',
              token: 'refresh_token_google',
            }),
          }),
        )
      })
    })
  })

  describe('handleCallback', () => {
    it('devrait orchestrer le flux complet : state → code → token → login', async () => {
      setupGoogleTokenMocks()

      const newUser = createMockUser({ id: 'new-user-cb', googleId: 'google-uid-123' })
      prismaMockInstance.user.findUnique
        .mockResolvedValueOnce(null) // no match by googleId
        .mockResolvedValueOnce(newUser) // fetch after creation

      prismaMockInstance.user.findFirst.mockResolvedValue(null) // no match by email
      prismaMockInstance.user.create.mockResolvedValue(newUser)
      prismaMockInstance.patient.create.mockResolvedValue({})
      prismaMockInstance.patient.findUnique.mockResolvedValue({
        firstName: 'Jean',
        lastName: 'Dupont',
      })

      mockRedis.get.mockResolvedValue(
        JSON.stringify({ nonce: 'n', redirectUrl: '/patient/dashboard' }),
      )

      const result = await oauthService.handleCallback('auth-code', 'valid-state')

      expect(result.authResponse.user).toBeDefined()
      expect(result.authResponse.tokens).toBeDefined()
      expect(result.redirectUrl).toBe('/patient/dashboard')
    })

    it('devrait échouer avec un state invalide', async () => {
      mockRedis.get.mockResolvedValue(null)

      await expect(
        oauthService.handleCallback('auth-code', 'bad-state'),
      ).rejects.toThrow('State OAuth invalide ou expiré')
    })
  })
})
