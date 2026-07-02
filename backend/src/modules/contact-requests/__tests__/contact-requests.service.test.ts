import { ContactRequestsService } from '../contact-requests.service'
import { UserRole, UserStatus } from '@prisma/client'

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    contactRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    practitioner: {
      create: jest.fn(),
    },
    cabinet: {
      create: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
}))

jest.mock('../../../utils/crypto', () => ({
  generateToken: jest.fn().mockReturnValue('mock_reset_token'),
}))

jest.mock('../../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  buildEmailHtml: jest.fn().mockReturnValue('<html>mock email</html>'),
}))

import prisma from '../../../config/database'
import { sendEmail } from '../../../utils/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('ContactRequestsService - Approve Practitioner Request with Plan', () => {
  let service: ContactRequestsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ContactRequestsService()
  })

  it('should approve a practitioner request and create the user, practitioner, and subscription', async () => {
    const mockRequest = {
      id: 'req-1',
      requestType: 'PRACTITIONER',
      status: 'PENDING',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+22501020304',
      orderNumber: 'ONMCI-123',
      clinicAddress: 'Plateau, Abidjan',
      adminContactEmail: null,
      adminContactPhone: null,
      cabinetName: null,
      cabinetAddress: null,
      cabinetRccm: null,
      adminContactName: null,
    }

    mockPrisma.contactRequest.findUnique.mockResolvedValue(mockRequest as any)
    mockPrisma.user.findFirst.mockResolvedValue(null) // no existing user
    mockPrisma.user.create.mockResolvedValue({ id: 'user-1' } as any)
    mockPrisma.practitioner.create.mockResolvedValue({ id: 'pract-1' } as any)
    mockPrisma.subscription.create.mockResolvedValue({ id: 'sub-1' } as any)
    mockPrisma.passwordResetToken.create.mockResolvedValue({} as any)
    mockPrisma.contactRequest.update.mockResolvedValue({} as any)

    const result = await service.approveRequest('req-1', 'admin-user-id', 'pro')

    expect(result).toEqual({ success: true, userId: 'user-1' })
    expect(mockPrisma.contactRequest.findUnique).toHaveBeenCalledWith({ where: { id: 'req-1' } })
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'jean.dupont@example.com',
        password: 'hashed_password',
        role: UserRole.PRACTITIONER,
        status: UserStatus.ACTIVE,
        emailVerified: expect.any(Date),
      },
    })
    expect(mockPrisma.practitioner.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        title: 'Dr.',
        phone: '+22501020304',
        licenseNumber: 'ONMCI-123',
        licenseVerified: true,
        licenseVerifiedAt: expect.any(Date),
        address: 'Plateau, Abidjan',
        city: '',
        baseConsultationFee: 0,
      },
    })
    expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
      data: {
        practitionerId: 'pract-1',
        plan: 'PRO',
        status: 'ACTIVE',
      },
    })
    expect(sendEmail).toHaveBeenCalledWith(
      'jean.dupont@example.com',
      'Votre compte MediCôte a été approuvé',
      expect.any(String),
    )
  })

  it('should throw an error if plan is missing for a practitioner request', async () => {
    const mockRequest = {
      id: 'req-2',
      requestType: 'PRACTITIONER',
      status: 'PENDING',
      email: 'jean.dupont@example.com',
    }

    mockPrisma.contactRequest.findUnique.mockResolvedValue(mockRequest as any)

    await expect(
      service.approveRequest('req-2', 'admin-user-id'),
    ).rejects.toThrow("Le plan d'abonnement est requis pour les praticiens")

    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('should throw an error if plan is invalid for a practitioner request', async () => {
    const mockRequest = {
      id: 'req-3',
      requestType: 'PRACTITIONER',
      status: 'PENDING',
      email: 'jean.dupont@example.com',
    }

    mockPrisma.contactRequest.findUnique.mockResolvedValue(mockRequest as any)

    await expect(
      service.approveRequest('req-3', 'admin-user-id', 'invalid-plan-name'),
    ).rejects.toThrow("Le plan d'abonnement sélectionné est invalide")

    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('should approve a cabinet request without requiring or creating a subscription', async () => {
    const mockRequest = {
      id: 'req-4',
      requestType: 'CABINET',
      status: 'PENDING',
      firstName: 'Amina',
      lastName: 'Kone',
      email: 'cabinet.amina@example.com',
      phone: '+22501020305',
      cabinetName: 'Clinique Amina',
      cabinetAddress: 'Cocody, Abidjan',
      cabinetRccm: 'CI-ABJ-2026-B-1234',
      adminContactName: 'Amina Kone',
      adminContactEmail: 'amina.k@example.com',
      adminContactPhone: '+22501020305',
    }

    mockPrisma.contactRequest.findUnique.mockResolvedValue(mockRequest as any)
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'user-2' } as any)
    mockPrisma.cabinet.create.mockResolvedValue({ id: 'cab-1' } as any)
    mockPrisma.passwordResetToken.create.mockResolvedValue({} as any)
    mockPrisma.contactRequest.update.mockResolvedValue({} as any)

    const result = await service.approveRequest('req-4', 'admin-user-id')

    expect(result).toEqual({ success: true, cabinetId: 'cab-1', userId: 'user-2' })
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'amina.k@example.com',
        password: 'hashed_password',
        role: UserRole.CABINET_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: expect.any(Date),
      },
    })
    expect(mockPrisma.cabinet.create).toHaveBeenCalled()
    expect(mockPrisma.subscription.create).not.toHaveBeenCalled()
  })
})
