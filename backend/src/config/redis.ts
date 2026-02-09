import Redis from 'ioredis'

const REDIS_URL = process.env.BACKEND_REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required for bullmq
})

// slot reservation functions
const SLOT_RESERVATION_TTL = 600 // 10 minutes in seconds

export function getSlotReservationKey(
  practitionerId: string,
  date: string,
  time: string,
): string {
  return `slot_reservation:${practitionerId}:${date}:${time}`
}

export async function reserveSlot(
  practitionerId: string,
  date: string,
  time: string,
  patientId: string,
): Promise<boolean> {
  const key = getSlotReservationKey(practitionerId, date, time)

  // use set nx (set if not exists) with ttl
  const result = await redis.set(
    key,
    patientId,
    'EX',
    SLOT_RESERVATION_TTL,
    'NX',
  )

  return result === 'OK'
}

export async function isSlotReserved(
  practitionerId: string,
  date: string,
  time: string,
  excludePatientId?: string,
): Promise<boolean> {
  const key = getSlotReservationKey(practitionerId, date, time)
  const reservedBy = await redis.get(key)

  if (!reservedBy) {
    return false
  }

  // if excluded patient id is provided and matches, slot is not considered reserved
  if (excludePatientId && reservedBy === excludePatientId) {
    return false
  }

  return true
}

export async function releaseSlotReservation(
  practitionerId: string,
  date: string,
  time: string,
): Promise<void> {
  const key = getSlotReservationKey(practitionerId, date, time)
  await redis.del(key)
}

export async function extendSlotReservation(
  practitionerId: string,
  date: string,
  time: string,
): Promise<boolean> {
  const key = getSlotReservationKey(practitionerId, date, time)
  const result = await redis.expire(key, SLOT_RESERVATION_TTL)
  return result === 1
}
