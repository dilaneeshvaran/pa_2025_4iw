import type {
  DayOfWeek,
  HealthReminderDurationUnit,
  HealthReminderIntervalUnit,
  HealthReminderRecurrenceType,
  HealthReminderStatus,
} from '@prisma/client'

export interface HealthReminderResponse {
  id: string
  patientId: string
  practitionerId: string
  message: string
  times: string[]
  startDate: string
  endDate: string
  durationValue: number
  durationUnit: HealthReminderDurationUnit
  recurrenceType: HealthReminderRecurrenceType
  intervalValue: number | null
  intervalUnit: HealthReminderIntervalUnit | null
  daysOfWeek: DayOfWeek[]
  status: HealthReminderStatus
  nextOccurrence: string | null
  scheduleLabel: string
  createdAt: string
}

export interface PatientHealthReminderOccurrence {
  id: string
  reminderId: string
  message: string
  scheduledFor: string
  practitioner: {
    id: string
    title: string
    firstName: string
    lastName: string
  }
}

export class HealthReminderAccessError extends Error {
  constructor(message = "Ce patient n'est pas rattaché à votre suivi") {
    super(message)
    this.name = 'HealthReminderAccessError'
  }
}

export class HealthReminderValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HealthReminderValidationError'
  }
}
