import { practitionerDashboardService } from '../practitioners-dashboard.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    practitioner: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const prismaMockInstance = require('../../../config/database').default
import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PractitionerDashboardService - Profile Visibility Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateProfile', () => {
    it('should throw an error if trying to make profile public without baseConsultationFee', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        id: 'pract-123',
        baseConsultationFee: null,
        acceptedPaymentMethods: ['CARD'],
      } as any)

      await expect(
        practitionerDashboardService.updateProfile('pract-123', {
          isProfilePublic: true,
        })
      ).rejects.toThrow(
        'Vous devez définir au moins le tarif de consultation de base avant de rendre votre profil public'
      )

      expect(mockPrisma.practitioner.findUnique).toHaveBeenCalledWith({
        where: { id: 'pract-123' },
        select: {
          baseConsultationFee: true,
          teleconsultationFee: true,
          emergencyFee: true,
          acceptedPaymentMethods: true,
        },
      })
    })

    it('should throw an error if trying to make profile public without acceptedPaymentMethods', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        id: 'pract-123',
        baseConsultationFee: 15000,
        acceptedPaymentMethods: [],
      } as any)

      await expect(
        practitionerDashboardService.updateProfile('pract-123', {
          isProfilePublic: true,
        })
      ).rejects.toThrow(
        'Vous devez sélectionner au moins un moyen de paiement accepté en cabinet avant de rendre votre profil public'
      )
    })

    it('should allow making profile public if both baseConsultationFee and acceptedPaymentMethods are defined', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        id: 'pract-123',
        baseConsultationFee: 15000,
        acceptedPaymentMethods: ['CARD'],
      } as any)

      mockPrisma.practitioner.update.mockResolvedValue({
        id: 'pract-123',
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        title: 'Dr',
        phone: '1234567890',
        bio: 'Bio',
        languages: ['fr'],
        photoUrl: 'http://photo',
        isProfilePublic: true,
        messagingEnabled: false,
        acceptedPaymentMethods: ['CARD'],
        qualifications: [],
      } as any)

      const result = await practitionerDashboardService.updateProfile('pract-123', {
        isProfilePublic: true,
      })

      expect(result).toBeDefined()
      expect(result.isProfilePublic).toBe(true)
      expect(result.acceptedPaymentMethods).toEqual(['CARD'])
      expect(mockPrisma.practitioner.update).toHaveBeenCalledWith({
        where: { id: 'pract-123' },
        data: { isProfilePublic: true },
        include: { qualifications: true },
      })
    })
  })
})
