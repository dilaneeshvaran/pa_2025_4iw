import { AdminUsersService } from '../admin-users.service'

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
}))

jest.mock('../../../utils/normalize-email', () => ({
  normalizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
}))

// ── Imports after mocks ─────────────────────────────────────────────────────

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ── Helpers ──────────────────────────────────────────────────────────────────

const buildAdminUser = (overrides = {}) => ({
  id: 'admin-1',
  email: 'admin@example.com',
  password: 'hashed_password',
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  emailVerified: new Date(),
  googleId: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  backupCodes: [],
  lastLoginAt: null,
  lastLoginIp: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  patient: null,
  practitioner: null,
  staff: null,
  adminOfCabinet: null,
  ...overrides,
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AdminUsersService', () => {
  let service: AdminUsersService

  beforeEach(() => {
    service = new AdminUsersService()
    jest.clearAllMocks()
  })

  // ── createAdmin ─────────────────────────────────────────────────────────────

  describe('createAdmin', () => {
    it('creates a new admin user and returns its DTO', async () => {
      const newAdmin = buildAdminUser()

      ;(mockPrisma.user.findFirst as jest.Mock)
        // duplicate check → not found
        .mockResolvedValueOnce(null)
        // getUserById includes mock
        .mockResolvedValueOnce(newAdmin)

      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(newAdmin)

      const result = await service.createAdmin({
        email: 'admin@example.com',
        password: 'Password1!',
      })

      expect(mockPrisma.user.findFirst).toHaveBeenCalledTimes(2)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'admin@example.com',
          password: 'hashed_password',
          role: 'ADMIN',
          status: 'ACTIVE',
        }),
      })
      expect(result.role).toBe('ADMIN')
    })

    it('throws when a user with the same email already exists', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        buildAdminUser(),
      )

      await expect(
        service.createAdmin({ email: 'admin@example.com', password: 'Password1!' }),
      ).rejects.toThrow('Un utilisateur avec cet email existe déjà')
    })

    it('throws when no password is provided', async () => {
      ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null)

      await expect(
        service.createAdmin({ email: 'admin@example.com' }),
      ).rejects.toThrow('Le mot de passe est obligatoire')
    })
  })
})
