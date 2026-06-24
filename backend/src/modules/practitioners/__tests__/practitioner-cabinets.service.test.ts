import { practitionerCabinetsService } from '../practitioner-cabinets.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    practitioner: {
      findUnique: jest.fn(),
    },
    cabinetPractitioner: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    cabinetInvitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMockInstance)),
  },
}))

const prismaMockInstance = require('../../../config/database').default

jest.mock('../../../utils/email', () => ({
  sendCabinetLeaveAppointmentCancelledEmail: jest.fn().mockResolvedValue(undefined),
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PractitionerCabinetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('acceptInvitation', () => {
    it('should accept a cabinet invitation and allow multi-cabinet membership', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({ id: 'pract-1' } as any)
      mockPrisma.cabinetInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        cabinetId: 'cab-1',
        practitionerId: 'pract-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      } as any)
      mockPrisma.cabinetPractitioner.findFirst.mockResolvedValue(null) // not already member

      mockPrisma.cabinetInvitation.update.mockResolvedValue({} as any)
      mockPrisma.cabinetPractitioner.upsert.mockResolvedValue({} as any)

      const result = await practitionerCabinetsService.acceptInvitation('user-pract-1', 'invite-1')

      expect(result).toBeDefined()
      expect(mockPrisma.cabinetPractitioner.upsert).toHaveBeenCalled()
    })
  })

  describe('leaveCabinet', () => {
    it('should leave a cabinet and cancel all future appointments in that cabinet', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({
        id: 'pract-1',
        title: 'Dr.',
        firstName: 'John',
        lastName: 'Doe',
      } as any)

      mockPrisma.cabinetPractitioner.findFirst.mockResolvedValue({
        id: 'cp-1',
        cabinet: { name: 'My Cabinet' }
      } as any)

      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'apt-1',
          appointmentDate: new Date(),
          startTime: '10:00',
          patient: {
            firstName: 'Jane',
            lastName: 'Smith',
            user: { email: 'jane@example.com' }
          }
        }
      ] as any)

      const result = await practitionerCabinetsService.leaveCabinet('user-pract-1', 'cab-1')

      expect(result.success).toBe(true)
      expect(mockPrisma.cabinetPractitioner.update).toHaveBeenCalled()
      expect(mockPrisma.appointment.updateMany).toHaveBeenCalled()
    })
  })

  describe('getCabinetColleagues', () => {
    it('should return other practitioners in the cabinet', async () => {
      mockPrisma.practitioner.findUnique.mockResolvedValue({ id: 'pract-1' } as any)
      mockPrisma.cabinetPractitioner.findFirst.mockResolvedValue({ id: 'cp-1' } as any) // is member
      mockPrisma.cabinetPractitioner.findMany.mockResolvedValue([
        {
          practitioner: {
            id: 'pract-2',
            firstName: 'Alice',
            lastName: 'Smith',
            title: 'Dr.',
            phone: '123',
            specialties: []
          },
          isPaused: false,
          joinedAt: new Date()
        }
      ] as any)

      const result = await practitionerCabinetsService.getCabinetColleagues('user-pract-1', 'cab-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('pract-2')
      expect(result[0].firstName).toBe('Alice')
    })
  })
})
