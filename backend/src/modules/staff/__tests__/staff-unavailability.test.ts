import { staffService } from '../staff.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    staff: {
      findUnique: jest.fn(),
    },
    cabinetPractitioner: {
      findMany: jest.fn(),
    },
    blockedSlot: {
      findMany: jest.fn(),
    },
    absence: {
      findMany: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Staff Unavailability Retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject retrieve if staff is not assigned to the practitioner', async () => {
    // Mock staff query
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: 'staff-1',
      userId: 'user-1',
      cabinetId: null,
      practitionerId: 'pract-2', // assigned to practitioner 2
      practitioner: null,
    } as any)

    // Attempt to access practitioner 1's blocked slots
    await expect(
      staffService.getPractitionerBlockedSlots('user-1', 'pract-1')
    ).rejects.toThrow("Vous n'avez pas accès aux indisponibilités de ce praticien")
  })

  it('should retrieve blocked slots if staff has access', async () => {
    // Mock staff query
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: 'staff-1',
      userId: 'user-1',
      cabinetId: null,
      practitionerId: 'pract-1', // assigned to practitioner 1
      practitioner: {
        id: 'pract-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        title: 'Dr',
      },
    } as any)

    // Mock database response for blocked slots
    mockPrisma.blockedSlot.findMany.mockResolvedValue([
      { id: 'blocked-1', date: new Date(), startTime: '12:00', endTime: '14:00', reason: 'Pause' }
    ] as any)

    const result = await staffService.getPractitionerBlockedSlots('user-1', 'pract-1')

    expect(result).toHaveLength(1)
    expect(result[0].reason).toBe('Pause')
    expect(mockPrisma.blockedSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ practitionerId: 'pract-1' }),
      })
    )
  })

  it('should retrieve absences if staff has access', async () => {
    // Mock staff query
    mockPrisma.staff.findUnique.mockResolvedValue({
      id: 'staff-1',
      userId: 'user-1',
      cabinetId: null,
      practitionerId: 'pract-1',
      practitioner: {
        id: 'pract-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        title: 'Dr',
      },
    } as any)

    // Mock database response for absences
    mockPrisma.absence.findMany.mockResolvedValue([
      { id: 'absence-1', startDate: new Date(), endDate: new Date(), reason: 'Conges' }
    ] as any)

    const result = await staffService.getPractitionerAbsences('user-1', 'pract-1')

    expect(result).toHaveLength(1)
    expect(result[0].reason).toBe('Conges')
    expect(mockPrisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ practitionerId: 'pract-1' }),
      })
    )
  })
})
