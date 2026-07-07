/**
 * MediCôte appointment date/time helpers.
 * Calendar dates are UTC midnight; HH:mm values are wall-clock times in
 * Côte d'Ivoire (Africa/Abidjan, GMT, no DST).
 */

export const PLATFORM_TIMEZONE = 'Africa/Abidjan'

export function parseAppointmentDate(date: Date | string): Date {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day))
    }

    const parsed = new Date(date)
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
      ),
    )
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

export function parseTimeParts(timeStr: string): {
  hours: number
  minutes: number
} {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours: hours ?? 0, minutes: minutes ?? 0 }
}

export function getAppointmentTimestamp(
  appointmentDate: Date | string,
  timeStr: string,
): number {
  const day = parseAppointmentDate(appointmentDate)
  const { hours, minutes } = parseTimeParts(timeStr)
  return Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    hours,
    minutes,
    0,
    0,
  )
}

export function combineDateAndTime(
  appointmentDate: Date | string,
  timeStr: string,
): Date {
  return new Date(getAppointmentTimestamp(appointmentDate, timeStr))
}

export function getUTCStartOfDay(date: Date | string = new Date()): Date {
  const ref = typeof date === 'string' ? new Date(date) : date
  return new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()),
  )
}

export function getUTCEndOfDay(date: Date | string): Date {
  const start = getUTCStartOfDay(date)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

export function isAppointmentFuture(
  appointmentDate: Date | string,
  startTime: string,
  now: Date = new Date(),
): boolean {
  return getAppointmentTimestamp(appointmentDate, startTime) > now.getTime()
}

export function getTeleconsultationJoinWindow(
  appointmentDate: Date | string,
  startTime: string,
  endTime: string,
  options?: { earlyMinutes?: number; lateAfterEndMinutes?: number },
): {
  startMs: number
  endMs: number
  earlyJoinMs: number
  lateJoinMs: number
} {
  const earlyMinutes = options?.earlyMinutes ?? 15
  const lateAfterEndMinutes = options?.lateAfterEndMinutes ?? 30
  const startMs = getAppointmentTimestamp(appointmentDate, startTime)
  const endMs = getAppointmentTimestamp(appointmentDate, endTime)

  return {
    startMs,
    endMs,
    earlyJoinMs: startMs - earlyMinutes * 60 * 1000,
    lateJoinMs: endMs + lateAfterEndMinutes * 60 * 1000,
  }
}

export function canJoinTeleconsultation(
  appointmentDate: Date | string,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
  options?: { earlyMinutes?: number; lateAfterEndMinutes?: number },
): boolean {
  const { earlyJoinMs, lateJoinMs } = getTeleconsultationJoinWindow(
    appointmentDate,
    startTime,
    endTime,
    options,
  )
  const timestamp = now.getTime()
  return timestamp >= earlyJoinMs && timestamp <= lateJoinMs
}

export function isTeleconsultationSoon(
  appointmentDate: Date | string,
  startTime: string,
  now: Date = new Date(),
  options?: { earlyMinutes?: number; withinMinutes?: number },
): boolean {
  const earlyMinutes = options?.earlyMinutes ?? 15
  const withinMinutes = options?.withinMinutes ?? 120
  const startMs = getAppointmentTimestamp(appointmentDate, startTime)
  const diffMinutes = (startMs - now.getTime()) / (1000 * 60)
  return diffMinutes > earlyMinutes && diffMinutes <= withinMinutes
}

export function getMinutesUntilTeleconsultationJoin(
  appointmentDate: Date | string,
  startTime: string,
  now: Date = new Date(),
  earlyMinutes = 15,
): number {
  const startMs = getAppointmentTimestamp(appointmentDate, startTime)
  const joinTime = startMs - earlyMinutes * 60 * 1000
  return Math.ceil((joinTime - now.getTime()) / (1000 * 60))
}

export function formatTimeUntilJoin(minutes: number): string {
  if (minutes <= 0) return 'maintenant'
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? `${mins}min` : ''}`
  }
  return `${minutes} min`
}

export function formatAppointmentDateKey(date: Date | string): string {
  const day = parseAppointmentDate(date)
  const year = day.getUTCFullYear()
  const month = String(day.getUTCMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(day.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${dayOfMonth}`
}