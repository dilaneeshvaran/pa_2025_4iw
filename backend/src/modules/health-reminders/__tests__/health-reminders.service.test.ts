process.env.TZ = 'UTC'
import { HealthReminderStatus } from '@prisma/client'
import { HealthRemindersService } from '../health-reminders.service'
import { HealthReminderAccessError } from '../health-reminders.types'
import type { CreateHealthReminderInput } from '../health-reminders.schema'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    appointment: {
      findFirst: jest.fn(),
    },
    healthReminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    healthReminderDelivery: {
      findMany: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/health-reminder-scheduler', () => ({
  scheduleHealthReminderOccurrences: jest.fn().mockResolvedValue(undefined),
}))

import prisma from '../../../config/database'
import { scheduleHealthReminderOccurrences } from '../../../utils/health-reminder-scheduler'

interface MockPrisma {
  appointment: {
    findFirst: jest.Mock
  }
  healthReminder: {
    create: jest.Mock
    findMany: jest.Mock
    updateMany: jest.Mock
    findFirst: jest.Mock
    update: jest.Mock
  }
  healthReminderDelivery: {
    findMany: jest.Mock
  }
}

const mockPrisma = prisma as unknown as MockPrisma
const mockScheduleHealthReminderOccurrences =
  scheduleHealthReminderOccurrences as jest.Mock

const createInput: CreateHealthReminderInput = {
  message: 'Prendre le traitement après le repas.',
  times: ['19:00', '08:00', '12:00'],
  startDate: '2026-06-22',
  durationValue: 2,
  durationUnit: 'WEEK',
  recurrence: {
    type: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'DAY',
  },
}

function buildReminder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reminder-1',
    patientId: 'patient-1',
    practitionerId: 'practitioner-1',
    message: createInput.message,
    times: ['08:00', '12:00', '19:00'],
    startDate: new Date('2026-06-22T00:00:00.000Z'),
    endDate: new Date('2026-07-05T00:00:00.000Z'),
    durationValue: 2,
    durationUnit: 'WEEK',
    recurrenceType: 'INTERVAL',
    intervalValue: 1,
    intervalUnit: 'DAY',
    daysOfWeek: [],
    status: HealthReminderStatus.ACTIVE,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date('2026-06-22T07:00:00.000Z'),
    updatedAt: new Date('2026-06-22T07:00:00.000Z'),
    ...overrides,
  }
}

describe('HealthRemindersService.createHealthReminder', () => {
  let service: HealthRemindersService

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-22T07:00:00.000Z'))
    jest.clearAllMocks()
    service = new HealthRemindersService()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('crée un rappel santé avec horaires triés et durée calculée', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'apt-1' })
    mockPrisma.healthReminder.create.mockResolvedValue(buildReminder())

    const result = await service.createHealthReminder(
      'practitioner-1',
      'patient-1',
      createInput,
    )

    expect(mockPrisma.healthReminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientId: 'patient-1',
        practitionerId: 'practitioner-1',
        message: createInput.message,
        times: ['08:00', '12:00', '19:00'],
        startDate: new Date('2026-06-22T00:00:00.000Z'),
        endDate: new Date('2026-07-05T00:00:00.000Z'),
        recurrenceType: 'INTERVAL',
        intervalValue: 1,
        intervalUnit: 'DAY',
        daysOfWeek: [],
      }),
    })
    expect(mockScheduleHealthReminderOccurrences).toHaveBeenCalledWith(
      'reminder-1',
    )
    expect(result.scheduleLabel).toBe('Tous les jours à 08:00, 12:00 et 19:00')
    expect(result.nextOccurrence).toBe('2026-06-22T08:00:00.000Z')
  })

  it("refuse la création si le praticien n'a pas de relation avec le patient", async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue(null)

    await expect(
      service.createHealthReminder('practitioner-1', 'patient-1', createInput),
    ).rejects.toThrow(HealthReminderAccessError)
    expect(mockPrisma.healthReminder.create).not.toHaveBeenCalled()
  })
})

describe('HealthRemindersService.getPatientDashboardReminders', () => {
  let service: HealthRemindersService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new HealthRemindersService()
  })

  it('retourne les occurrences déjà notifiées pour le tableau de bord patient', async () => {
    mockPrisma.healthReminder.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.healthReminderDelivery.findMany.mockResolvedValue([
      {
        id: 'delivery-1',
        healthReminderId: 'reminder-1',
        scheduledFor: new Date('2026-06-22T08:00:00.000Z'),
        healthReminder: {
          message: "Boire un verre d'eau.",
          practitioner: {
            id: 'practitioner-1',
            title: 'Dr',
            firstName: 'Awa',
            lastName: 'Kone',
          },
        },
      },
    ])

    const result = await service.getPatientDashboardReminders('patient-1', 5)

    expect(mockPrisma.healthReminderDelivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
      }),
    )
    expect(result).toEqual([
      {
        id: 'delivery-1',
        reminderId: 'reminder-1',
        message: "Boire un verre d'eau.",
        scheduledFor: '2026-06-22T08:00:00.000Z',
        practitioner: {
          id: 'practitioner-1',
          title: 'Dr',
          firstName: 'Awa',
          lastName: 'Kone',
        },
      },
    ])
  })
})
