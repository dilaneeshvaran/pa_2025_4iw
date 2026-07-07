import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Types (mirroring dashboard.vue) ──────────────────────────────────────────

interface Practitioner {
  id: string
  firstName: string
  lastName: string
  title: string
  specialty: string | null
  photo: string | null
  cancellationNotice?: number
}

interface Appointment {
  id: string
  appointmentDate: string
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  consultationFee: number
  practitioner: Practitioner
}

// ── Logique extraite du composant ────────────────────────────────────────────
// Ces fonctions reproduisent fidèlement les computed properties de dashboard.vue

function canModifyNext(apt: Appointment | null): boolean {
  if (!apt) return false
  if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false
  const cancellationNotice = apt.practitioner.cancellationNotice ?? 24
  const now = Date.now()
  const aptDate = new Date(apt.appointmentDate)
  const parts = apt.startTime.split(':').map(Number)
  const aptMs = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] ?? 0,
    parts[1] ?? 0,
    0,
    0
  ).getTime()
  const diffHours = (aptMs - now) / (1000 * 60 * 60)
  return diffHours >= cancellationNotice
}

function canCancelNext(apt: Appointment | null): boolean {
  if (!apt) return false
  if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false
  const now = Date.now()
  const aptDate = new Date(apt.appointmentDate)
  const parts = apt.startTime.split(':').map(Number)
  const aptMs = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] ?? 0,
    parts[1] ?? 0,
    0,
    0
  ).getTime()
  return aptMs > now
}

function canJoinNext(apt: Appointment | null): boolean {
  if (!apt) return false
  if (apt.type !== 'TELECONSULTATION') return false
  if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return false
  const now = Date.now()
  const aptDate = new Date(apt.appointmentDate)
  const parts = apt.startTime.split(':').map(Number)
  const aptMs = new Date(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] ?? 0,
    parts[1] ?? 0,
    0,
    0
  ).getTime()
  const diffMinutes = (aptMs - now) / (1000 * 60)
  return diffMinutes <= 15 && diffMinutes >= -60
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'APPOINTMENT_REMINDER': return 'Bell'
    case 'DOCUMENT_SHARED': return 'FileText'
    case 'HEALTH_REMINDER': return 'Activity'
    default: return 'Bell'
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const buildPractitioner = (overrides: Partial<Practitioner> = {}): Practitioner => ({
  id: 'pract-1',
  firstName: 'Jean',
  lastName: 'Dupont',
  title: 'Dr',
  specialty: 'Médecine générale',
  photo: null,
  cancellationNotice: 24,
  ...overrides,
})

const buildAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  appointmentDate: '',
  startTime: '10:00',
  endTime: '10:30',
  type: 'IN_PERSON',
  status: 'CONFIRMED',
  reason: null,
  consultationFee: 50,
  practitioner: buildPractitioner(),
  ...overrides,
})

// crée une date iso relative à maintenant dans le fuseau horaire local
function futureDate(hours: number): string {
  const base = new Date('2026-07-03T12:00:00.000Z')
  const localTime = new Date(base.getTime() + hours * 60 * 60 * 1000)
  const yyyy = localTime.getFullYear()
  const mm = String(localTime.getMonth() + 1).padStart(2, '0')
  const dd = String(localTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function futureTime(hours: number): string {
  const base = new Date('2026-07-03T12:00:00.000Z')
  const localTime = new Date(base.getTime() + hours * 60 * 60 * 1000)
  return `${String(localTime.getHours()).padStart(2, '0')}:00`
}

function pastDate(hours: number): string {
  const base = new Date('2026-07-03T12:00:00.000Z')
  const localTime = new Date(base.getTime() - hours * 60 * 60 * 1000)
  const yyyy = localTime.getFullYear()
  const mm = String(localTime.getMonth() + 1).padStart(2, '0')
  const dd = String(localTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function pastTime(hours: number): string {
  const base = new Date('2026-07-03T12:00:00.000Z')
  const localTime = new Date(base.getTime() - hours * 60 * 60 * 1000)
  return `${String(localTime.getHours()).padStart(2, '0')}:00`
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('patient dashboard - canModifyNext', () => {
  it("retourne false si le rendez-vous est null", () => {
    expect(canModifyNext(null)).toBe(false)
  })

  it("retourne false si le statut est CANCELLED", () => {
    const apt = buildAppointment({
      status: 'CANCELLED',
      appointmentDate: futureDate(48),
      startTime: futureTime(48),
    })
    expect(canModifyNext(apt)).toBe(false)
  })

  it("retourne false si le statut est COMPLETED", () => {
    const apt = buildAppointment({
      status: 'COMPLETED',
      appointmentDate: futureDate(48),
      startTime: futureTime(48),
    })
    expect(canModifyNext(apt)).toBe(false)
  })

  it("retourne true si le rendez-vous est dans plus de 24h (délai par défaut)", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(48),
      startTime: futureTime(48),
    })
    expect(canModifyNext(apt)).toBe(true)
  })

  it("retourne false si le rendez-vous est dans moins de 24h (délai par défaut)", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(2),
      startTime: futureTime(2),
    })
    expect(canModifyNext(apt)).toBe(false)
  })

  it("respecte le cancellationNotice personnalisé du praticien (48h)", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(36),
      startTime: futureTime(36),
      practitioner: buildPractitioner({ cancellationNotice: 48 }),
    })
    expect(canModifyNext(apt)).toBe(false)
  })

  it("retourne true si le rendez-vous est dans plus de 48h avec un délai de 48h", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(72),
      startTime: futureTime(72),
      practitioner: buildPractitioner({ cancellationNotice: 48 }),
    })
    expect(canModifyNext(apt)).toBe(true)
  })

  it("utilise 24h par défaut si cancellationNotice est undefined", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(48),
      startTime: futureTime(48),
      practitioner: buildPractitioner({ cancellationNotice: undefined }),
    })
    expect(canModifyNext(apt)).toBe(true)
  })
})

describe('patient dashboard - canCancelNext', () => {
  it("retourne false si le rendez-vous est null", () => {
    expect(canCancelNext(null)).toBe(false)
  })

  it("retourne false si le statut est CANCELLED", () => {
    const apt = buildAppointment({
      status: 'CANCELLED',
      appointmentDate: futureDate(24),
      startTime: futureTime(24),
    })
    expect(canCancelNext(apt)).toBe(false)
  })

  it("retourne false si le statut est COMPLETED", () => {
    const apt = buildAppointment({
      status: 'COMPLETED',
      appointmentDate: futureDate(24),
      startTime: futureTime(24),
    })
    expect(canCancelNext(apt)).toBe(false)
  })

  it("retourne true si le rendez-vous est dans le futur", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: futureDate(2),
      startTime: futureTime(2),
    })
    expect(canCancelNext(apt)).toBe(true)
  })

  it("retourne false si le rendez-vous est dans le passé", () => {
    const apt = buildAppointment({
      status: 'CONFIRMED',
      appointmentDate: pastDate(2),
      startTime: pastTime(2),
    })
    expect(canCancelNext(apt)).toBe(false)
  })

  it("retourne true pour un rendez-vous PENDING dans le futur", () => {
    const apt = buildAppointment({
      status: 'PENDING',
      appointmentDate: futureDate(5),
      startTime: futureTime(5),
    })
    expect(canCancelNext(apt)).toBe(true)
  })
})

describe('patient dashboard - canJoinNext', () => {
  it("retourne false si le rendez-vous est null", () => {
    expect(canJoinNext(null)).toBe(false)
  })

  it("retourne false si le type n'est pas TELECONSULTATION", () => {
    const apt = buildAppointment({
      type: 'IN_PERSON',
      status: 'CONFIRMED',
      appointmentDate: futureDate(0),
      startTime: futureTime(0),
    })
    expect(canJoinNext(apt)).toBe(false)
  })

  it("retourne false si le statut est CANCELLED", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'CANCELLED',
      appointmentDate: futureDate(0),
      startTime: futureTime(0),
    })
    expect(canJoinNext(apt)).toBe(false)
  })

  it("retourne false si le statut est NO_SHOW", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'NO_SHOW',
      appointmentDate: futureDate(0),
      startTime: futureTime(0),
    })
    expect(canJoinNext(apt)).toBe(false)
  })

  it("retourne true si la téléconsultation commence dans moins de 15 minutes", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'CONFIRMED',
      appointmentDate: futureDate(0),
      startTime: (() => {
        const d = new Date('2026-07-03T12:00:00.000Z')
        d.setMinutes(d.getMinutes() + 10)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      })(),
    })
    expect(canJoinNext(apt)).toBe(true)
  })

  it("retourne true si la téléconsultation a commencé depuis moins de 60 minutes", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'CONFIRMED',
      appointmentDate: pastDate(0),
      startTime: (() => {
        const d = new Date('2026-07-03T12:00:00.000Z')
        d.setMinutes(d.getMinutes() - 30)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      })(),
    })
    expect(canJoinNext(apt)).toBe(true)
  })

  it("retourne false si la téléconsultation a commencé depuis plus de 60 minutes", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'CONFIRMED',
      appointmentDate: pastDate(2),
      startTime: pastTime(2),
    })
    expect(canJoinNext(apt)).toBe(false)
  })

  it("retourne false si la téléconsultation est trop loin dans le futur (> 15 min)", () => {
    const apt = buildAppointment({
      type: 'TELECONSULTATION',
      status: 'CONFIRMED',
      appointmentDate: futureDate(2),
      startTime: futureTime(2),
    })
    expect(canJoinNext(apt)).toBe(false)
  })
})

describe('patient dashboard - getNotificationIcon', () => {
  it("retourne 'Bell' pour APPOINTMENT_REMINDER", () => {
    expect(getNotificationIcon('APPOINTMENT_REMINDER')).toBe('Bell')
  })

  it("retourne 'FileText' pour DOCUMENT_SHARED", () => {
    expect(getNotificationIcon('DOCUMENT_SHARED')).toBe('FileText')
  })

  it("retourne 'Activity' pour HEALTH_REMINDER", () => {
    expect(getNotificationIcon('HEALTH_REMINDER')).toBe('Activity')
  })

  it("retourne 'Bell' par défaut pour un type inconnu", () => {
    expect(getNotificationIcon('UNKNOWN_TYPE')).toBe('Bell')
  })
})
