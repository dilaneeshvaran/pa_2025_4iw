import { AuthService } from '../auth.service'
import { UserRole, UserStatus } from '@prisma/client'

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn(),
}))

jest.mock('../../../utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('access_token'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh_token'),
  verifyRefreshToken: jest.fn(),
}))

jest.mock('../../../utils/crypto', () => ({
  generateToken: jest.fn().mockReturnValue('verification_token_abc'),
}))

jest.mock('../../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}))

// ── Imports after mocks ────────────────────────────────────────────────────────

import prisma from '../../../config/database'
import { comparePassword } from '../../../utils/bcrypt'
import { verifyRefreshToken } from '../../../utils/jwt'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed_password',
  role: UserRole.PATIENT,
  status: UserStatus.PENDING_VERIFICATION,
  emailVerified: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  lastLoginIp: null,
  googleId: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  backupCodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const signupData = {
  email: 'john@example.com',
  password: 'Password1!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+33612345678',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE' as const,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    service = new AuthService()
    jest.clearAllMocks()

    // Default: refresh token stored in DB
    ;(mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({})
  })

  // ── signup ─────────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('crée un utilisateur et retourne les tokens', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      const user = buildUser({ email: signupData.email })
      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(user)
      ;(mockPrisma.patient.create as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      const result = await service.signup(signupData)

      expect(result.user.email).toBe(signupData.email)
      expect(result.user.role).toBe(UserRole.PATIENT)
      expect(result.tokens.accessToken).toBe('access_token')
      expect(result.tokens.refreshToken).toBe('refresh_token')
    })

    it("force le rôle PATIENT indépendamment des données fournies", async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(buildUser())
      ;(mockPrisma.patient.create as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      await service.signup(signupData)

      const createCall = (mockPrisma.user.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.role).toBe(UserRole.PATIENT)
    })

    it('crée le profil patient après la création du compte', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(buildUser())
      ;(mockPrisma.patient.create as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      await service.signup(signupData)

      expect(mockPrisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: signupData.firstName,
            lastName: signupData.lastName,
          }),
        }),
      )
    })

    it('lève une erreur si l\'email est déjà utilisé', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(buildUser())

      await expect(service.signup(signupData)).rejects.toThrow(
        'Un utilisateur avec cet email existe déjà',
      )
    })

    it('envoie un email de vérification lors de l\'inscription', async () => {
      const { sendVerificationEmail } = require('../../../utils/email')
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(buildUser())
      ;(mockPrisma.patient.create as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      await service.signup(signupData)

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        buildUser().email,
        'verification_token_abc',
      )
    })
  })

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retourne les tokens pour des identifiants valides', async () => {
      const user = buildUser({ status: UserStatus.ACTIVE })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)
      mockComparePassword.mockResolvedValue(true)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue(user)

      const result = await service.login('test@example.com', 'Password1!')

      expect(result.tokens.accessToken).toBe('access_token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('lève une erreur si l\'utilisateur n\'existe pas', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.login('unknown@example.com', 'pass')).rejects.toThrow(
        'Email ou mot de passe incorrect',
      )
    })

    it('lève une erreur si le mot de passe est incorrect', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(buildUser())
      mockComparePassword.mockResolvedValue(false)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(
        'Email ou mot de passe incorrect',
      )
    })

    it('incrémente les tentatives échouées sur mauvais mot de passe', async () => {
      const user = buildUser({ failedLoginAttempts: 2 })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)
      mockComparePassword.mockResolvedValue(false)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow()

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.failedLoginAttempts).toBe(3)
    })

    it('verrouille le compte après 5 tentatives échouées', async () => {
      const user = buildUser({ failedLoginAttempts: 4 })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)
      mockComparePassword.mockResolvedValue(false)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow()

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.lockedUntil).toBeInstanceOf(Date)
      expect(updateCall.data.failedLoginAttempts).toBe(5)
    })

    it('lève une erreur si le compte est verrouillé', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000) // +10 min
      const user = buildUser({ lockedUntil })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)

      await expect(service.login('test@example.com', 'any')).rejects.toThrow(
        /Compte verrouillé/,
      )
    })

    it('lève une erreur si le compte est suspendu', async () => {
      const user = buildUser({ status: UserStatus.SUSPENDED })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)
      mockComparePassword.mockResolvedValue(true)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue(user)

      await expect(service.login('test@example.com', 'Password1!')).rejects.toThrow(
        'Votre compte a été suspendu',
      )
    })

    it('réinitialise les tentatives échouées lors d\'une connexion réussie', async () => {
      const user = buildUser({ status: UserStatus.ACTIVE, failedLoginAttempts: 3 })
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(user)
      mockComparePassword.mockResolvedValue(true)
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue(user)

      await service.login('test@example.com', 'Password1!')

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.failedLoginAttempts).toBe(0)
      expect(updateCall.data.lockedUntil).toBeNull()
    })
  })

  // ── verifyEmail ────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    const buildVerifToken = (overrides = {}) => ({
      id: 'token-1',
      userId: 'user-1',
      email: 'test@example.com',
      token: 'valid_token',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // +1h
      user: buildUser(),
      ...overrides,
    })

    it('vérifie l\'email avec un token valide', async () => {
      ;(mockPrisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(
        buildVerifToken(),
      )
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue({
        firstName: 'John',
      })

      await expect(service.verifyEmail('valid_token')).resolves.toBeUndefined()
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: UserStatus.ACTIVE }),
        }),
      )
    })

    it('lève une erreur si le token est invalide', async () => {
      ;(mockPrisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.verifyEmail('bad_token')).rejects.toThrow(
        'Token de vérification invalide',
      )
    })

    it('lève une erreur si le token a déjà été utilisé', async () => {
      ;(mockPrisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(
        buildVerifToken({ usedAt: new Date() }),
      )

      await expect(service.verifyEmail('used_token')).rejects.toThrow(
        'Ce token a déjà été utilisé',
      )
    })

    it('lève une erreur si le token a expiré', async () => {
      ;(mockPrisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(
        buildVerifToken({ expiresAt: new Date(Date.now() - 1000) }),
      )

      await expect(service.verifyEmail('expired_token')).rejects.toThrow(
        'Le token de vérification a expiré',
      )
    })
  })

  // ── resendVerificationEmail ────────────────────────────────────────────────

  describe('resendVerificationEmail', () => {
    it('renvoie un email de vérification', async () => {
      const { sendVerificationEmail } = require('../../../utils/email')
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        buildUser({ emailVerified: null }),
      )
      ;(mockPrisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})

      await service.resendVerificationEmail('test@example.com')

      expect(sendVerificationEmail).toHaveBeenCalled()
    })

    it('lève une erreur si l\'utilisateur n\'existe pas', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        service.resendVerificationEmail('unknown@example.com'),
      ).rejects.toThrow('Utilisateur non trouvé')
    })

    it('lève une erreur si l\'email est déjà vérifié', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        buildUser({ emailVerified: new Date() }),
      )

      await expect(
        service.resendVerificationEmail('test@example.com'),
      ).rejects.toThrow('Email déjà vérifié')
    })
  })

  // ── requestPasswordReset ───────────────────────────────────────────────────

  describe('requestPasswordReset', () => {
    it('envoie un email de réinitialisation', async () => {
      const { sendPasswordResetEmail } = require('../../../utils/email')
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(buildUser())
      ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})

      await service.requestPasswordReset('test@example.com')

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        buildUser().email,
        'verification_token_abc',
      )
    })

    it('ne révèle pas si l\'utilisateur existe (retour silencieux)', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        service.requestPasswordReset('ghost@example.com'),
      ).resolves.toBeUndefined()
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
    })
  })

  // ── resetPassword ──────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    const buildResetToken = (overrides = {}) => ({
      id: 'reset-1',
      userId: 'user-1',
      token: 'valid_reset_token',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ...overrides,
    })

    it('réinitialise le mot de passe avec un token valide', async () => {
      ;(mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        buildResetToken(),
      )
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.passwordResetToken.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({})

      await expect(
        service.resetPassword('valid_reset_token', 'NewPass1!'),
      ).resolves.toBeUndefined()
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })

    it('révoque tous les refresh tokens après réinitialisation', async () => {
      ;(mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        buildResetToken(),
      )
      ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.passwordResetToken.update as jest.Mock).mockResolvedValue({})
      ;(mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({})

      await service.resetPassword('valid_reset_token', 'NewPass1!')

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      )
    })

    it('lève une erreur si le token est invalide', async () => {
      ;(mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.resetPassword('bad', 'NewPass1!')).rejects.toThrow(
        'Token de réinitialisation invalide',
      )
    })

    it('lève une erreur si le token a déjà été utilisé', async () => {
      ;(mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        buildResetToken({ usedAt: new Date() }),
      )

      await expect(service.resetPassword('used', 'NewPass1!')).rejects.toThrow(
        'Ce token a déjà été utilisé',
      )
    })

    it('lève une erreur si le token a expiré', async () => {
      ;(mockPrisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        buildResetToken({ expiresAt: new Date(Date.now() - 1000) }),
      )

      await expect(service.resetPassword('expired', 'NewPass1!')).rejects.toThrow(
        'Le token de réinitialisation a expiré',
      )
    })
  })

  // ── refreshAccessToken ─────────────────────────────────────────────────────

  describe('refreshAccessToken', () => {
    const payload = { userId: 'user-1', email: 'test@example.com', role: 'PATIENT' }

    it('retourne de nouveaux tokens avec un refresh token valide', async () => {
      mockVerifyRefreshToken.mockReturnValue(payload)
      ;(mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        token: 'rt',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        buildUser({ role: UserRole.PATIENT }),
      )

      const tokens = await service.refreshAccessToken('rt')

      expect(tokens.accessToken).toBe('access_token')
      expect(tokens.refreshToken).toBe('refresh_token')
    })

    it('lève une erreur si le JWT est invalide', async () => {
      mockVerifyRefreshToken.mockImplementation(() => {
        throw new Error('invalid')
      })

      await expect(service.refreshAccessToken('bad_token')).rejects.toThrow(
        'Refresh token invalide ou expiré',
      )
    })

    it('lève une erreur si le token n\'existe pas en base', async () => {
      mockVerifyRefreshToken.mockReturnValue(payload)
      ;(mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.refreshAccessToken('unknown')).rejects.toThrow(
        'Refresh token non trouvé',
      )
    })

    it('lève une erreur si le token est révoqué', async () => {
      mockVerifyRefreshToken.mockReturnValue(payload)
      ;(mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        token: 'rt',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })

      await expect(service.refreshAccessToken('rt')).rejects.toThrow(
        'Refresh token révoqué',
      )
    })

    it('lève une erreur si le token est expiré en base', async () => {
      mockVerifyRefreshToken.mockReturnValue(payload)
      ;(mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        token: 'rt',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      })

      await expect(service.refreshAccessToken('rt')).rejects.toThrow(
        'Refresh token expiré',
      )
    })
  })

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('révoque le refresh token', async () => {
      ;(mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await service.logout('rt_to_revoke')

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: 'rt_to_revoke' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      )
    })
  })
})
