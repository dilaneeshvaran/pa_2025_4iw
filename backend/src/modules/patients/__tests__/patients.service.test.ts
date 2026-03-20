import { PatientsService } from '../patients.service'

// Valeurs d'enum Prisma utilisées dans les tests (évite une dépendance au client généré)
const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const

const AppointmentType = {
  IN_PERSON: 'IN_PERSON',
  TELECONSULTATION: 'TELECONSULTATION',
} as const

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    patient: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// ── Imports après mocks ────────────────────────────────────────────────────────

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ── Helpers ────────────────────────────────────────────────────────────────────

const now = new Date()

const daysAgo = (n: number): Date => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d
}

const daysFromNow = (n: number): Date => {
  const d = new Date(now)
  d.setDate(d.getDate() + n)
  return d
}

const buildPatientRow = (overrides: any = {}) => ({
  id: 'patient-1',
  userId: 'user-1',
  firstName: 'Marie',
  lastName: 'Curie',
  dateOfBirth: new Date('1985-03-15'),
  gender: 'FEMALE',
  phone: '0601020304',
  city: 'Paris',
  bloodType: 'A+',
  address: '1 rue des Sciences',
  allergies: [],
  chronicConditions: [],
  height: null,
  weight: null,
  penaltyUntil: null,
  user: { email: 'marie.curie@example.com' },
  appointments: [],
  ...overrides,
})

const buildAppointmentEntry = (overrides: any = {}) => ({
  id: 'apt-1',
  appointmentDate: daysFromNow(2),
  startTime: '10:00',
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.CONFIRMED,
  ...overrides,
})

const defaultQuery = {
  page: 1,
  limit: 10,
  search: undefined,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
  filter: undefined,
  gender: undefined,
}

// ── Tests : getPatientsList ────────────────────────────────────────────────────

describe('PatientsService.getPatientsList', () => {
  let service: PatientsService

  beforeEach(() => {
    service = new PatientsService()
    jest.clearAllMocks()
  })

  it("retourne une liste vide si le praticien n'a aucun patient", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([])

    const result = await service.getPatientsList('pract-1', defaultQuery)

    expect(result.patients).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
  })

  it("retourne la liste des patients avec les champs calculés", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([{ patientId: 'patient-1' }])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(1)

    const completedApt = buildAppointmentEntry({
      appointmentDate: daysAgo(5),
      status: AppointmentStatus.COMPLETED,
    })
    const upcomingApt = buildAppointmentEntry({
      id: 'apt-2',
      appointmentDate: daysFromNow(3),
      status: AppointmentStatus.CONFIRMED,
    })

    const patient = buildPatientRow({ appointments: [completedApt, upcomingApt] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([patient])

    const result = await service.getPatientsList('pract-1', defaultQuery)

    expect(result.patients).toHaveLength(1)
    expect(result.patients[0]?.email).toBe('marie.curie@example.com')
    expect(result.patients[0]?.totalConsultations).toBe(1)
    expect(result.patients[0]?.nextAppointment).not.toBeNull()
    expect(result.patients[0]?.lastAppointment).not.toBeNull()
  })

  it("marque un patient comme 'nouveau' si son premier RDV date de moins de 30 jours", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([{ patientId: 'patient-1' }])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(1)

    const recentApt = buildAppointmentEntry({
      appointmentDate: daysAgo(10),
      status: AppointmentStatus.COMPLETED,
    })
    const patient = buildPatientRow({ appointments: [recentApt] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([patient])

    const result = await service.getPatientsList('pract-1', defaultQuery)
    expect(result.patients[0]?.isNew).toBe(true)
  })

  it("ne marque pas un patient comme 'nouveau' si son premier RDV date de plus de 30 jours", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([{ patientId: 'patient-1' }])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(1)

    const oldApt = buildAppointmentEntry({
      appointmentDate: daysAgo(45),
      status: AppointmentStatus.COMPLETED,
    })
    const patient = buildPatientRow({ appointments: [oldApt] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([patient])

    const result = await service.getPatientsList('pract-1', defaultQuery)
    expect(result.patients[0]?.isNew).toBe(false)
  })

  it("filtre par 'new' (filter = 'new')", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { patientId: 'patient-1' },
      { patientId: 'patient-2' },
    ])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(2)

    const recentApt = buildAppointmentEntry({ appointmentDate: daysAgo(5), status: AppointmentStatus.COMPLETED })
    const oldApt = buildAppointmentEntry({ appointmentDate: daysAgo(60), status: AppointmentStatus.COMPLETED })

    const newPatient = buildPatientRow({ id: 'patient-1', appointments: [recentApt] })
    const oldPatient = buildPatientRow({ id: 'patient-2', lastName: 'Martin', appointments: [oldApt] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([newPatient, oldPatient])

    const result = await service.getPatientsList('pract-1', { ...defaultQuery, filter: 'new' })

    expect(result.patients).toHaveLength(1)
    expect(result.patients[0]?.id).toBe('patient-1')
  })

  it("filtre les patients avec un prochain rendez-vous (filter = 'withUpcoming')", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { patientId: 'patient-1' },
      { patientId: 'patient-2' },
    ])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(2)

    const upcomingApt = buildAppointmentEntry({ appointmentDate: daysFromNow(5), status: AppointmentStatus.CONFIRMED })
    const pastApt = buildAppointmentEntry({ appointmentDate: daysAgo(5), status: AppointmentStatus.COMPLETED })

    const withUpcoming = buildPatientRow({ id: 'patient-1', appointments: [upcomingApt] })
    const withoutUpcoming = buildPatientRow({ id: 'patient-2', appointments: [pastApt] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([withUpcoming, withoutUpcoming])

    const result = await service.getPatientsList('pract-1', { ...defaultQuery, filter: 'withUpcoming' })

    expect(result.patients).toHaveLength(1)
    expect(result.patients[0]?.id).toBe('patient-1')
  })

  it("trie par nom de famille (sortBy = 'name')", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { patientId: 'patient-1' },
      { patientId: 'patient-2' },
    ])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(2)

    const patientB = buildPatientRow({ id: 'patient-1', lastName: 'Zola', appointments: [] })
    const patientA = buildPatientRow({ id: 'patient-2', lastName: 'Arnaud', appointments: [] })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([patientB, patientA])

    const result = await service.getPatientsList('pract-1', { ...defaultQuery, sortBy: 'name', sortOrder: 'asc' })

    expect(result.patients[0]?.lastName).toBe('Arnaud')
    expect(result.patients[1]?.lastName).toBe('Zola')
  })

  it("trie par totalConsultations décroissant", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { patientId: 'patient-1' },
      { patientId: 'patient-2' },
    ])
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(2)

    const singleApt = buildAppointmentEntry({ status: AppointmentStatus.COMPLETED })
    const manyApts = [
      buildAppointmentEntry({ id: 'apt-a', status: AppointmentStatus.COMPLETED }),
      buildAppointmentEntry({ id: 'apt-b', status: AppointmentStatus.COMPLETED }),
      buildAppointmentEntry({ id: 'apt-c', status: AppointmentStatus.COMPLETED }),
    ]

    const p1 = buildPatientRow({ id: 'patient-1', lastName: 'Rare', appointments: [singleApt] })
    const p2 = buildPatientRow({ id: 'patient-2', lastName: 'Regulier', appointments: manyApts })
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([p1, p2])

    const result = await service.getPatientsList('pract-1', {
      ...defaultQuery,
      sortBy: 'totalConsultations',
      sortOrder: 'desc',
    })

    expect(result.patients[0]?.totalConsultations).toBe(3)
    expect(result.patients[1]?.totalConsultations).toBe(1)
  })

  it("pagine correctement les résultats", async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => ({ patientId: `patient-${i}` })),
    )
    ;(mockPrisma.patient.count as jest.Mock).mockResolvedValue(3)

    const patients = Array.from({ length: 3 }, (_, i) =>
      buildPatientRow({ id: `patient-${i}`, lastName: `Patient${i}`, appointments: [] }),
    )
    ;(mockPrisma.patient.findMany as jest.Mock).mockResolvedValue(patients)

    const result = await service.getPatientsList('pract-1', { ...defaultQuery, page: 2, limit: 2 })

    expect(result.patients).toHaveLength(1)
    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(2)
  })
})

// ── Tests : getPatientDetail ───────────────────────────────────────────────────

describe('PatientsService.getPatientDetail', () => {
  let service: PatientsService

  beforeEach(() => {
    service = new PatientsService()
    jest.clearAllMocks()
  })

  it("retourne null si le patient n'a aucun rendez-vous avec ce praticien", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(result).toBeNull()
  })

  it("retourne null si le patient n'existe pas en base", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await service.getPatientDetail('pract-1', 'patient-inexistant')
    expect(result).toBeNull()
  })

  it("retourne les détails complets du patient", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      height: 165,
      weight: 60,
      allergies: ['Pénicilline'],
      chronicConditions: ['Asthme'],
      appointments: [
        buildAppointmentEntry({ appointmentDate: daysAgo(10), status: AppointmentStatus.COMPLETED }),
        buildAppointmentEntry({ id: 'apt-2', appointmentDate: daysFromNow(5), status: AppointmentStatus.CONFIRMED }),
      ],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')

    expect(result).not.toBeNull()
    expect(result?.firstName).toBe('Marie')
    expect(result?.lastName).toBe('Curie')
    expect(result?.email).toBe('marie.curie@example.com')
    expect(result?.height).toBe(165)
    expect(result?.weight).toBe(60)
    expect(result?.allergies).toEqual(['Pénicilline'])
    expect(result?.chronicConditions).toEqual(['Asthme'])
    expect(result?.totalConsultations).toBe(1)
    expect(result?.nextAppointment).not.toBeNull()
    expect(result?.lastAppointment).not.toBeNull()
  })

  it("calcule isNew = true pour un patient avec premier RDV < 30 jours", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      appointments: [
        buildAppointmentEntry({ appointmentDate: daysAgo(7), status: AppointmentStatus.COMPLETED }),
      ],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(result?.isNew).toBe(true)
  })

  it("calcule isNew = false pour un patient avec premier RDV > 30 jours", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      appointments: [
        buildAppointmentEntry({ appointmentDate: daysAgo(60), status: AppointmentStatus.COMPLETED }),
      ],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(result?.isNew).toBe(false)
  })

  it("nextAppointment est null si tous les rendez-vous sont dans le passé", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      appointments: [
        buildAppointmentEntry({ appointmentDate: daysAgo(10), status: AppointmentStatus.COMPLETED }),
      ],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(result?.nextAppointment).toBeNull()
  })

  it("lastAppointment est null si aucun rendez-vous n'est COMPLETED", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      appointments: [
        buildAppointmentEntry({ appointmentDate: daysFromNow(5), status: AppointmentStatus.PENDING }),
      ],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(result?.lastAppointment).toBeNull()
  })

  it("convertit height et weight en Number", async () => {
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-1' })

    const patient = buildPatientRow({
      height: '175.5' as any,
      weight: '72.3' as any,
      appointments: [],
    })
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(patient)

    const result = await service.getPatientDetail('pract-1', 'patient-1')
    expect(typeof result?.height).toBe('number')
    expect(typeof result?.weight).toBe('number')
    expect(result?.height).toBe(175.5)
    expect(result?.weight).toBe(72.3)
  })
})
