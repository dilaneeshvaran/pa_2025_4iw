export function getClientLocalTime(now: Date, offsetStr?: string): Date {
  if (!offsetStr) return now
  const offsetMinutes = parseInt(offsetStr, 10)
  if (isNaN(offsetMinutes)) return now
  // now is in UTC. Subtract the client's local timezone offset (in minutes) 
  // to get a Date object whose UTC representation matches the client's local time components.
  return new Date(now.getTime() - offsetMinutes * 60 * 1000)
}
