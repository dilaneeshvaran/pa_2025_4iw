/**
 * @deprecated Appointment scheduling uses platform time (GMT / Côte d'Ivoire).
 * Do not use client timezone offsets for appointment date or slot comparisons.
 */
export function getClientLocalTime(now: Date, offsetStr?: string): Date {
  if (!offsetStr) return now
  const offsetMinutes = parseInt(offsetStr, 10)
  if (isNaN(offsetMinutes)) return now
  return new Date(now.getTime() - offsetMinutes * 60 * 1000)
}