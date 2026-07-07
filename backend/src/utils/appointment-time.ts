import type { Appointment } from '@prisma/client'


export function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const appointmentTime = new Date(date)
  // Treat HH:mm as local wall time so that for the Paris school presentation,
  // booked times (e.g. 15:30) appear exactly as 15:30 in UI and emails
  // when everything runs on a Paris (UTC+2) machine.
  appointmentTime.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return appointmentTime
}


export function isAppointmentFuture(
  appointmentDate: Date | string,
  startTime: string,
  now: Date = new Date()
): boolean {
  const aptDate = new Date(appointmentDate)
  const dayStart = new Date(aptDate)
  dayStart.setHours(0, 0, 0, 0)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  if (dayStart.getTime() < today.getTime()) {
    return false
  }

  if (dayStart.getTime() === today.getTime()) {
    const aptTime = combineDateAndTime(aptDate, startTime)
    return aptTime.getTime() > now.getTime()
  }

  return true
}

export function filterFutureAppointments<T extends { appointmentDate: Date | string; startTime: string }>(
  appointments: T[],
  now: Date = new Date()
): T[] {
  return appointments.filter((apt) => isAppointmentFuture(apt.appointmentDate, apt.startTime, now))
}

export function getUTCStartOfDay(d: Date | string): Date {
  const res = new Date(d)
  // Local wall time for Paris presentation/demo so that "today" queries
  // and time comparisons match the clock the presenters are using.
  res.setHours(0, 0, 0, 0)
  return res
}

export function getUTCEndOfDay(d: Date | string): Date {
  const res = new Date(d)
  res.setHours(23, 59, 59, 999)
  return res
}
