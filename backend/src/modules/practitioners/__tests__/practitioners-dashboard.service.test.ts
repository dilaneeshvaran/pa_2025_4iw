process.env.TZ = 'UTC'
jest.mock('../../teleconsultations/teleconsultations.service', () => ({
  teleconsultationsService: {
    cleanupExpiredSessions: jest.fn().mockResolvedValue(undefined),
  },
}))

import { practitionerDashboardService } from '../practitioners-dashboard.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    practitioner: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    virtualQueue: {
      count: jest.fn(),
    },
    practitionerTodo: {
      findMany: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
    },
    savedPaymentMethod: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

const prismaMockInstance = require('../../../config/database').default
import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PractitionerDashboardService.getDashboardData', () => {
  const july7 = new Date('2026-07-07T00:00:00.000Z')

  const pastAppointment = {
    id: 'apt-past',
    appointmentDate: july7,
    startTime: '23:25',
    endTime: '23:55',
    type: 'IN_PERSON',
    status: 'CONFIRMED',
    reason: 'Consultation',
    patient: {
      id: 'patient-1',
      firstName: 'patient',
      lastName: 'test',
      phone: '0102030405',
    },
  }

  const july8 = new Date('2026-07-08T00:00:00.000Z')

  const futureAppointment = {
    id: 'apt-future',
    appointmentDate: july8,
    startTime: '09:00',
    endTime: '09:30',
    type: 'IN_PERSON',
    status: 'CONFIRMED',
    reason: 'Suivi',
    patient: {
      id: 'patient-2',
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '0607080910',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.appointment.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 0 },
    })
    ;(mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 0n }])
    ;(mockPrisma.virtualQueue.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.practitionerTodo.findMany as jest.Mock).mockResolvedValue([])
    ;(mockPrisma.practitioner.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
    })
    ;(mockPrisma.conversation.findMany as jest.Mock).mockResolvedValue([])
    ;(mockPrisma.appointment.updateMany as jest.Mock).mockResolvedValue({
      count: 0,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('exclut un rendez-vous passé selon le fuseau horaire client', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-07T22:30:00.000Z'))
    ;(mockPrisma.appointment.findMany as jest.Mock).mockImplementation(
      (args: { take?: number; where?: { appointmentDate?: { lte?: Date } } }) => {
        if (args.where?.appointmentDate?.lte) {
          return Promise.resolve([])
        }
        if (args.take === 20) {
          return Promise.resolve([pastAppointment])
        }
        return Promise.resolve([])
      },
    )

    const result = await practitionerDashboardService.getDashboardData(
      'pract-123',
      '-120',
    )

    expect(result.nextAppointment).toBeNull()
  })

  it('retourne le prochain rendez-vous futur selon le fuseau horaire client', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-07T22:30:00.000Z'))
    ;(mockPrisma.appointment.findMany as jest.Mock).mockImplementation(
      (args: { take?: number; where?: { appointmentDate?: { lte?: Date } } }) => {
        if (args.where?.appointmentDate?.lte) {
          return Promise.resolve([])
        }
        if (args.take === 20) {
          return Promise.resolve([pastAppointment, futureAppointment])
        }
        return Promise.resolve([])
      },
    )

    const result = await practitionerDashboardService.getDashboardData(
      'pract-123',
      '-120',
    )

    expect(result.nextAppointment).not.toBeNull()
    expect(result.nextAppointment?.id).toBe('apt-future')
    expect(result.nextAppointment?.startTime).toBe('09:00')
  })
})

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

  describe('getProfile', () => {
    const publicProfile = {
      id: 'pract-123',
      userId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      isProfilePublic: true,
      messagingEnabled: false,
      baseConsultationFee: 15000,
      teleconsultationFee: null,
      emergencyFee: null,
      acceptedPaymentMethods: ['CARD'],
      qualifications: [],
      licenseVerifiedAt: null,
    }

    it('unpublishes a profile that is still public without acceptedPaymentMethods', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        ...publicProfile,
        acceptedPaymentMethods: [],
      } as any)

      const result = await practitionerDashboardService.getProfile('pract-123')

      expect(result.isProfilePublic).toBe(false)
      expect(mockPrisma.practitioner.update).toHaveBeenCalledWith({
        where: { id: 'pract-123' },
        data: { isProfilePublic: false },
      })
    })

    it('unpublishes a profile that is still public without baseConsultationFee', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        ...publicProfile,
        baseConsultationFee: null,
      } as any)

      const result = await practitionerDashboardService.getProfile('pract-123')

      expect(result.isProfilePublic).toBe(false)
      expect(mockPrisma.practitioner.update).toHaveBeenCalledWith({
        where: { id: 'pract-123' },
        data: { isProfilePublic: false },
      })
    })

    it('keeps a public profile that meets the requirements', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue(publicProfile as any)

      const result = await practitionerDashboardService.getProfile('pract-123')

      expect(result.isProfilePublic).toBe(true)
      expect(mockPrisma.practitioner.update).not.toHaveBeenCalled()
    })
  })

  describe('updateBillingConfig', () => {
    it('unpublishes the profile when the last payment method is removed', async () => {
      mockPrisma.practitioner.update.mockResolvedValueOnce({
        baseConsultationFee: 15000,
        teleconsultationFee: null,
        emergencyFee: null,
        acceptedPaymentMethods: [],
        bankInfo: null,
        isProfilePublic: true,
      } as any)

      const result = await practitionerDashboardService.updateBillingConfig(
        'pract-123',
        { acceptedPaymentMethods: [] } as any,
      )

      expect(result.isProfilePublic).toBe(false)
      expect(result.profileUnpublished).toBe(true)
      expect(mockPrisma.practitioner.update).toHaveBeenLastCalledWith({
        where: { id: 'pract-123' },
        data: { isProfilePublic: false },
      })
    })

    it('leaves the profile public when the requirements are still met', async () => {
      mockPrisma.practitioner.update.mockResolvedValueOnce({
        baseConsultationFee: 15000,
        teleconsultationFee: null,
        emergencyFee: null,
        acceptedPaymentMethods: ['CASH'],
        bankInfo: null,
        isProfilePublic: true,
      } as any)

      const result = await practitionerDashboardService.updateBillingConfig(
        'pract-123',
        { acceptedPaymentMethods: ['CASH'] } as any,
      )

      expect(result.isProfilePublic).toBe(true)
      expect(result.profileUnpublished).toBe(false)
      expect(mockPrisma.practitioner.update).toHaveBeenCalledTimes(1)
    })
  })
})
