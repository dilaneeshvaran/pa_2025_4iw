import type {
  DayOfWeek,
  HealthReminderDurationUnit,
  HealthReminderIntervalUnit,
  HealthReminderRecurrenceType,
} from '@prisma/client'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const dayOfWeekByUtcIndex: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export interface HealthReminderScheduleDefinition {
  startDate: Date
  endDate: Date
  times: string[]
  recurrenceType: HealthReminderRecurrenceType
  intervalValue: number | null
  intervalUnit: HealthReminderIntervalUnit | null
  daysOfWeek: DayOfWeek[]
}

export function parseDateOnlyToUtcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0))
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

export function formatDateOnlyUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function computeHealthReminderEndDate(
  startDate: Date,
  durationValue: number,
  durationUnit: HealthReminderDurationUnit,
): Date {
  const start = startOfUtcDay(startDate)

  if (durationUnit === 'DAY') {
    return addDaysUtc(start, durationValue - 1)
  }

  if (durationUnit === 'WEEK') {
    return addDaysUtc(start, durationValue * 7 - 1)
  }

  return addDaysUtc(addMonthsClampedUtc(start, durationValue), -1)
}

export function computeHealthReminderOccurrences(
  schedule: HealthReminderScheduleDefinition,
  from?: Date,
): Date[] {
  const occurrences: Date[] = []
  const startDate = startOfUtcDay(schedule.startDate)
  const endDate = startOfUtcDay(schedule.endDate)
  const sortedTimes = Array.from(new Set(schedule.times)).sort()
  const lowerBound = from ? from.getTime() : null

  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    if (occursOnDate(currentDate, startDate, schedule)) {
      for (const time of sortedTimes) {
        const occurrence = combineUtcDateAndTime(currentDate, time)
        if (lowerBound === null || occurrence.getTime() >= lowerBound) {
          occurrences.push(occurrence)
        }
      }
    }
    currentDate = addDaysUtc(currentDate, 1)
  }

  return occurrences
}

export function getLastHealthReminderOccurrence(
  schedule: HealthReminderScheduleDefinition,
): Date | null {
  const occurrences = computeHealthReminderOccurrences(schedule)
  return occurrences.length > 0 ? occurrences[occurrences.length - 1] : null
}

export function getNextHealthReminderOccurrence(
  schedule: HealthReminderScheduleDefinition,
  from = new Date(),
): Date | null {
  const occurrences = computeHealthReminderOccurrences(schedule, from)
  return occurrences.length > 0 ? occurrences[0] : null
}

function occursOnDate(
  date: Date,
  startDate: Date,
  schedule: HealthReminderScheduleDefinition,
): boolean {
  const dayDiff = Math.floor(
    (startOfUtcDay(date).getTime() - startDate.getTime()) / MS_PER_DAY,
  )

  if (dayDiff < 0) {
    return false
  }

  if (schedule.recurrenceType === 'WEEKDAYS') {
    return schedule.daysOfWeek.includes(dayOfWeekByUtcIndex[date.getUTCDay()])
  }

  const intervalValue = schedule.intervalValue ?? 1

  if (schedule.intervalUnit === 'WEEK') {
    return dayDiff % (intervalValue * 7) === 0
  }

  return dayDiff % intervalValue === 0
}

function combineUtcDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours ?? 0,
      minutes ?? 0,
      0,
      0,
    ),
  )
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function addMonthsClampedUtc(date: Date, months: number): Date {
  const targetYear = date.getUTCFullYear()
  const targetMonth = date.getUTCMonth() + months
  const requestedDay = date.getUTCDate()
  const lastTargetDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate()

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(requestedDay, lastTargetDay),
    ),
  )
}
