export {
  PLATFORM_TIMEZONE,
  parseAppointmentDate,
  parseTimeParts,
  getAppointmentTimestamp,
  combineDateAndTime,
  getUTCStartOfDay,
  getUTCEndOfDay,
  isAppointmentFuture,
  getTeleconsultationJoinWindow,
  canJoinTeleconsultation,
  isTeleconsultationSoon,
  getMinutesUntilTeleconsultationJoin,
  formatTimeUntilJoin,
  formatAppointmentDateKey,
} from '@medicote/shared/utils/appointment-time'

import { isAppointmentFuture as isFuture } from '@medicote/shared/utils/appointment-time'

export function filterFutureAppointments<
  T extends { appointmentDate: Date | string; startTime: string },
>(appointments: T[], now: Date = new Date()): T[] {
  return appointments.filter((apt) =>
    isFuture(apt.appointmentDate, apt.startTime, now),
  )
}