export type HealthReminderDayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type HealthReminderDurationUnit = 'DAY' | 'WEEK' | 'MONTH'
export type HealthReminderIntervalUnit = 'DAY' | 'WEEK'
export type HealthReminderRecurrenceType = 'INTERVAL' | 'WEEKDAYS'
export type HealthReminderStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'

export interface CreateHealthReminderRequest {
  message: string
  times: string[]
  startDate: string
  durationValue: number
  durationUnit: HealthReminderDurationUnit
  recurrence:
    | {
        type: 'INTERVAL'
        intervalValue: number
        intervalUnit: HealthReminderIntervalUnit
      }
    | {
        type: 'WEEKDAYS'
        daysOfWeek: HealthReminderDayOfWeek[]
      }
}

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
  daysOfWeek: HealthReminderDayOfWeek[]
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
