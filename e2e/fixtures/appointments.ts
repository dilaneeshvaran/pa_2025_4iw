import { type APIRequestContext } from '@playwright/test'

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:3001/api'

type AvailableDay = {
  date: string
  slots: string[]
}

export type BookableSlot = {
  date: string
  time: string
}

async function getPatientUpcomingAppointments(request: APIRequestContext, token: string) {
  const response = await request.get(`${apiBase}/appointments/patient?status=upcoming&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok()) {
    return []
  }

  const body = await response.json()
  return body.data as Array<{
    id: string
    appointmentDate: string
    startTime: string
    practitioner: { firstName: string; lastName: string }
    status: string
  }>
}

async function practitionerHasPatient(
  request: APIRequestContext,
  token: string,
  firstName = 'Jean',
  lastName = 'Dupont',
): Promise<boolean> {
  const response = await request.get(`${apiBase}/practitioner/patients?search=${firstName}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok()) {
    return false
  }

  const body = await response.json()
  const patients = body.data?.patients as Array<{ firstName: string; lastName: string }> | undefined
  return (
    patients?.some((patient) => patient.firstName === firstName && patient.lastName === lastName) ??
    false
  )
}

export async function hasUpcomingAppointmentWithPractitioner(
  request: APIRequestContext,
  token: string,
  firstName = 'Marie',
  lastName = 'Martin',
): Promise<boolean> {
  const appointments = await getPatientUpcomingAppointments(request, token)
  return appointments.some(
    (appointment) =>
      appointment.practitioner.firstName === firstName &&
      appointment.practitioner.lastName === lastName &&
      appointment.status !== 'CANCELLED',
  )
}

export async function getSeedPractitionerId(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${apiBase}/practitioners/search?search=Martin`)

  if (!response.ok()) {
    throw new Error(`Practitioner search failed: ${response.status()} ${await response.text()}`)
  }

  const body = await response.json()
  const practitioners = body.data as Array<{ id: string; firstName: string; lastName: string }>
  const practitioner =
    practitioners.find((item) => item.firstName === 'Marie' && item.lastName === 'Martin') ??
    practitioners[0]

  if (!practitioner?.id) {
    throw new Error('Seed practitioner Dr. Marie Martin not found')
  }

  return practitioner.id
}

export async function findFirstAvailableSlot(
  request: APIRequestContext,
  practitionerId: string,
  minDaysAhead = 0,
): Promise<BookableSlot> {
  const response = await request.get(
    `${apiBase}/practitioners/${practitionerId}/available-slots?days=30`,
    {
      headers: {
        'x-timezone-offset': String(new Date().getTimezoneOffset()),
      },
    },
  )

  if (!response.ok()) {
    throw new Error(`Available slots failed: ${response.status()} ${await response.text()}`)
  }

  const body = await response.json()
  const days = body.data as AvailableDay[]
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + minDaysAhead)
  const minDateStr = minDate.toISOString().slice(0, 10)

  for (const day of days) {
    if (day.date < minDateStr) {
      continue
    }

    const time = day.slots?.[0]
    if (time) {
      return { date: day.date, time }
    }
  }

  throw new Error(`No available slots found for practitioner ${practitionerId}`)
}

function isAtLeastHoursAhead(appointmentDate: string, startTime: string, hours: number): boolean {
  const [year, month, day] = appointmentDate.slice(0, 10).split('-').map(Number)
  const [hoursPart, minutesPart] = startTime.split(':').map(Number)
  const appointmentMs = new Date(year, month - 1, day, hoursPart, minutesPart, 0, 0).getTime()
  return appointmentMs - Date.now() >= hours * 60 * 60 * 1000
}

export async function createPatientAppointment(
  request: APIRequestContext,
  patientToken: string,
  options: {
    practitionerId: string
    appointmentDate: string
    startTime: string
    reason?: string
  },
) {
  const response = await request.post(`${apiBase}/appointments`, {
    headers: { Authorization: `Bearer ${patientToken}` },
    data: {
      practitionerId: options.practitionerId,
      appointmentDate: options.appointmentDate,
      startTime: options.startTime,
      type: 'IN_PERSON',
      reason: options.reason ?? 'E2E test appointment',
    },
  })

  if (!response.ok()) {
    const message = await response.text()
    if (
      response.status() === 429 &&
      (await hasUpcomingAppointmentWithPractitioner(request, patientToken))
    ) {
      return
    }

    throw new Error(`Failed to create appointment: ${response.status()} ${message}`)
  }

  const body = await response.json()
  return body.data as { id: string }
}

export async function ensurePatientPractitionerLink(
  request: APIRequestContext,
  practitionerToken: string,
  patientToken: string,
): Promise<void> {
  if (await practitionerHasPatient(request, practitionerToken)) {
    return
  }

  const practitionerId = await getSeedPractitionerId(request)
  const slot = await findFirstAvailableSlot(request, practitionerId)
  await createPatientAppointment(request, patientToken, {
    practitionerId,
    appointmentDate: slot.date,
    startTime: slot.time,
    reason: 'E2E lien patient-praticien',
  })
}

export async function ensureUpcomingAppointment(
  request: APIRequestContext,
  patientToken: string,
): Promise<void> {
  if (await hasUpcomingAppointmentWithPractitioner(request, patientToken)) {
    return
  }

  const practitionerId = await getSeedPractitionerId(request)
  const slot = await findFirstAvailableSlot(request, practitionerId)
  await createPatientAppointment(request, patientToken, {
    practitionerId,
    appointmentDate: slot.date,
    startTime: slot.time,
    reason: 'E2E rendez-vous à venir',
  })
}

export async function ensureAlertableAppointment(
  request: APIRequestContext,
  patientToken: string,
): Promise<void> {
  const appointments = await getPatientUpcomingAppointments(request, patientToken)
  const alertable = appointments.find(
    (appointment) =>
      appointment.practitioner.firstName === 'Marie' &&
      appointment.practitioner.lastName === 'Martin' &&
      appointment.status !== 'CANCELLED' &&
      isAtLeastHoursAhead(appointment.appointmentDate, appointment.startTime, 48),
  )

  if (alertable) {
    return
  }

  const practitionerId = await getSeedPractitionerId(request)
  const slot = await findFirstAvailableSlot(request, practitionerId, 3)
  await createPatientAppointment(request, patientToken, {
    practitionerId,
    appointmentDate: slot.date,
    startTime: slot.time,
    reason: 'E2E alerte créneau',
  })
}
