import { cabinetService } from '../cabinet.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    cabinet: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cabinetPractitioner: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staff: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cabinetInvitation: {
      deleteMany: jest.fn(),
    },
    availability: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    absence: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    blockedSlot: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prismaMockInstance)),
  },
}))

// We need a dummy reference to pass to the transaction mock callback
const prismaMockInstance = require('../../../config/database').default

jest.mock('../../../utils/email', () => ({
  sendCabinetLeaveAppointmentCancelledEmail: jest.fn().mockResolvedValue(undefined),
  sendStaffAccountCreatedEmail: jest.fn().mockResolvedValue(undefined),
  sendCabinetInvitationEmail: jest.fn().mockResolvedValue(undefined),
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('CabinetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('deleteCabinet', () => {
    it('should delete a cabinet and cancel all future appointments', async () => {
      mockPrisma.cabinet.findFirst.mockResolvedValue({ id: 'cab-1', name: 'My Cabinet', adminUserId: 'admin-1' } as any)
      mockPrisma.cabinetPractitioner.findMany.mockResolvedValue([
        {
          practitioner: { id: 'pract-1', title: 'Dr.', firstName: 'John', lastName: 'Doe' }
        }
      ] as any)

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

      mockPrisma.staff.findMany.mockResolvedValue([
        { id: 'staff-1', userId: 'user-staff-1' }
      ] as any)

      const result = await cabinetService.deleteCabinet('admin-1')

      expect(result.success).toBe(true)
      expect(mockPrisma.appointment.updateMany).toHaveBeenCalled()
      expect(mockPrisma.cabinetPractitioner.updateMany).toHaveBeenCalled()
      expect(mockPrisma.cabinet.delete).toHaveBeenCalled()
    })
  })

  describe('transferOwnership', () => {
    it('should transfer ownership to a new admin user', async () => {
      mockPrisma.cabinet.findFirst.mockResolvedValueOnce({ id: 'cab-1', adminUserId: 'admin-1' } as any) // getCabinetByAdminUserId
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'new-admin-1', email: 'new@example.com', role: 'USER' } as any)
      mockPrisma.cabinet.findFirst.mockResolvedValueOnce(null) // no existing cabinet for new user

      const result = await cabinetService.transferOwnership('admin-1', 'new@example.com')

      expect(result.success).toBe(true)
      expect(mockPrisma.cabinet.update).toHaveBeenCalledWith({
        where: { id: 'cab-1' },
        data: {
          adminUserId: 'new-admin-1',
          adminContactEmail: 'new@example.com',
        }
      })
    })
  })

  describe('getPractitionerSchedule', () => {
    it('should return cabinet-specific schedule', async () => {
      mockPrisma.cabinet.findFirst.mockResolvedValue({ id: 'cab-1' } as any)
      mockPrisma.cabinetPractitioner.findFirst.mockResolvedValue({ id: 'cp-1' } as any)

      ;(mockPrisma.availability.findMany as jest.Mock).mockResolvedValue([{ id: 'avail-1', startTime: '08:00' }])
      ;(mockPrisma.absence.findMany as jest.Mock).mockResolvedValue([{ id: 'abs-1' }])
      ;(mockPrisma.blockedSlot.findMany as jest.Mock).mockResolvedValue([{ id: 'bs-1' }])

      const result = await cabinetService.getPractitionerSchedule('admin-1', 'pract-1')

      expect(result.availabilities).toHaveLength(1)
      expect(result.absences).toHaveLength(1)
      expect(result.blockedSlots).toHaveLength(1)
    })
  })

  describe('getPractitionerPatients', () => {
    it('should return cabinet-scoped patient history', async () => {
      mockPrisma.cabinet.findFirst.mockResolvedValue({ id: 'cab-1' } as any)
      mockPrisma.cabinetPractitioner.findFirst.mockResolvedValue({ id: 'cp-1' } as any)

      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          patientId: 'patient-1',
          appointmentDate: new Date(),
          patient: {
            id: 'patient-1',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '123456',
            user: { email: 'jane@example.com' }
          }
        }
      ] as any)

      const result = await cabinetService.getPractitionerPatients('admin-1', 'pract-1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('patient-1')
    })
  })
})
