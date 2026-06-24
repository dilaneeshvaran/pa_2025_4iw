import { AvailabilitiesService } from '../availabilities.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    practitioner: {
      findUnique: jest.fn(),
    },
    availability: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Availability Overlap Validation', () => {
  let service: AvailabilitiesService

  beforeEach(() => {
    service = new AvailabilitiesService()
    jest.clearAllMocks()
  })

  it('should allow non-overlapping slots in different cabinets', async () => {
    mockPrisma.practitioner.findUnique.mockResolvedValue({ id: 'pract-1', consultationDuration: 30 } as any)
    mockPrisma.availability.findFirst.mockResolvedValue(null) // no existing standard slot for day + cabinet

    // Mock existing slots in other cabinets: Mon 08:00 - 12:00 in cabinet 1
    mockPrisma.availability.findMany.mockResolvedValue([
      { id: 'avail-1', cabinetId: 'cab-1', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '12:00' }
    ] as any)

    mockPrisma.availability.create.mockResolvedValue({
      id: 'avail-2',
      cabinetId: 'cab-2',
      dayOfWeek: 'MONDAY',
      startTime: '13:00',
      endTime: '17:00'
    } as any)

    const result = await service.upsertAvailability('pract-1', {
      cabinetId: 'cab-2',
      dayOfWeek: 'MONDAY',
      startTime: '13:00',
      endTime: '17:00',
      isEmergencySlot: false,
      isActive: true,
    })

    expect(result).toBeDefined()
    expect(mockPrisma.availability.create).toHaveBeenCalled()
  })

  it('should reject overlapping slots across different cabinets', async () => {
    mockPrisma.practitioner.findUnique.mockResolvedValue({ id: 'pract-1', consultationDuration: 30 } as any)
    mockPrisma.availability.findFirst.mockResolvedValue(null)

    // Mock existing slot: Mon 08:00 - 12:00 in cabinet 1
    mockPrisma.availability.findMany.mockResolvedValue([
      { id: 'avail-1', cabinetId: 'cab-1', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '12:00' }
    ] as any)

    // Try to create slot: Mon 11:00 - 14:00 in cabinet 2 (overlaps 11:00 to 12:00)
    await expect(
      service.upsertAvailability('pract-1', {
        cabinetId: 'cab-2',
        dayOfWeek: 'MONDAY',
        startTime: '11:00',
        endTime: '14:00',
      })
    ).rejects.toThrow("Conflit d'horaire : vous êtes déjà disponible sur ce créneau")
  })

  describe('getAppointments and getDaySummary cabinet filtering', () => {
    it('should filter getAppointments by cabinetId when specified', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'apt-1',
          appointmentDate: new Date(),
          startTime: '09:00',
          endTime: '09:30',
          duration: 30,
          type: 'IN_PERSON',
          status: 'CONFIRMED',
          consultationFee: 1000,
          patient: { id: 'patient-1', firstName: 'John', lastName: 'Doe', phone: '123' }
        }
      ] as any)

      const result = await service.getAppointments('pract-1', '2026-06-24', '2026-06-24', 'cab-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            practitionerId: 'pract-1',
            cabinetId: 'cab-1',
          })
        })
      )
    })

    it('should filter getDaySummary by cabinetId when specified', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        { type: 'IN_PERSON' }
      ] as any)

      const result = await service.getDaySummary('pract-1', '2026-06-24', 'cab-1')

      expect(result.total).toBe(1)
      expect(result.cabinet).toBe(1)
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            practitionerId: 'pract-1',
            cabinetId: 'cab-1',
          })
        })
      )
    })
  })
})
