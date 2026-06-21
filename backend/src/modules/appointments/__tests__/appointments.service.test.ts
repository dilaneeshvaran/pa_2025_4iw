import { AppointmentsService } from '../appointments.service'

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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('../../../config/redis', () => ({
  isSlotReserved: jest.fn().mockResolvedValue(false),
  releaseSlotReservation: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../utils/email', () => ({
  sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendEarlierSlotAlertEmail: jest.fn().mockResolvedValue(undefined),
  sendAppointmentCancelledByPatientEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../utils/reminder-scheduler', () => ({
  scheduleAppointmentReminders: jest.fn().mockResolvedValue(undefined),
}))

// ── Imports après mocks ────────────────────────────────────────────────────────

import prisma from '../../../config/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ── Helpers ────────────────────────────────────────────────────────────────────

const today = new Date()
today.setUTCHours(0, 0, 0, 0)

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

// Heure de référence déterministe : aujourd'hui à midi UTC.
// Le service interprète startTime en UTC (setUTCHours), donc on fige l'horloge
// pour éviter toute dépendance à la timezone ou à l'heure d'exécution.
const noonUTC = new Date(today)
noonUTC.setUTCHours(12, 0, 0, 0)

const buildPractitioner = (overrides = {}) => ({
  id: 'pract-1',
  firstName: 'Jean',
  lastName: 'Dupont',
  title: 'Dr',
  address: '1 rue de la Paix',
  city: 'Paris',
  cancellationNotice: 24,
  consultationDuration: 30,
  specialties: [{ specialty: { name: 'Médecine générale' }, isPrimary: true }],
  cabinets: [],
  ...overrides,
})

const buildAppointmentRow = (overrides = {}) => ({
  id: 'apt-1',
  patientId: 'patient-1',
  practitionerId: 'pract-1',
  appointmentDate: tomorrow,
  startTime: '10:00',
  endTime: '10:30',
  duration: 30,
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.CONFIRMED,
  reason: null,
  consultationFee: 50,
  cancelledAt: null,
  cancelledBy: null,
  cancellationReason: null,
  cabinetId: null,
  cabinet: null,
  teleconsultationSession: null,
  practitioner: buildPractitioner(),
  ...overrides,
})

// ── Tests : getNextAppointment ─────────────────────────────────────────────────

describe('AppointmentsService.getNextAppointment', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('retourne null si aucun rendez-vous trouvé', async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([])

    const result = await service.getNextAppointment('patient-1')
    expect(result).toBeNull()
  })

  it('retourne le prochain rendez-vous futur', async () => {
    const apt = buildAppointmentRow({
      appointmentDate: tomorrow,
      startTime: '10:00',
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getNextAppointment('patient-1')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('apt-1')
    expect(result?.practitioner.firstName).toBe('Jean')
    expect(result?.practitioner.specialty).toBe('Médecine générale')
  })

  it("filtre les rendez-vous du jour déjà passés en heure", async () => {
    jest.useFakeTimers().setSystemTime(noonUTC)
    // Créneau aujourd'hui à 11:00 UTC, soit une heure avant l'heure figée (midi UTC)
    const apt = buildAppointmentRow({
      appointmentDate: today,
      startTime: '11:00',
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getNextAppointment('patient-1')
    expect(result).toBeNull()
  })

  it('retourne le rendez-vous du jour si l\'heure est dans le futur', async () => {
    jest.useFakeTimers().setSystemTime(noonUTC)
    // Créneau aujourd'hui à 14:00 UTC, soit deux heures après l'heure figée (midi UTC)
    const apt = buildAppointmentRow({
      appointmentDate: today,
      startTime: '14:00',
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getNextAppointment('patient-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('apt-1')
  })

  it('inclut le cabinet actif du praticien si disponible', async () => {
    const cabinet = { id: 'cab-1', name: 'Cabinet Central', address: '2 rue de Rivoli', city: 'Paris' }
    const apt = buildAppointmentRow({
      appointmentDate: tomorrow,
      startTime: '10:00',
      practitioner: buildPractitioner({
        cabinets: [{ leftAt: null, isPaused: false, cabinet }],
      }),
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getNextAppointment('patient-1')
    expect(result?.practitioner.address).toBe('2 rue de Rivoli')
    expect(result?.practitioner.city).toBe('Paris')
  })
})

// ── Tests : getPastAppointments ────────────────────────────────────────────────

describe('AppointmentsService.getPastAppointments', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('retourne une liste vide si aucun rendez-vous passé', async () => {
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([])

    const result = await service.getPastAppointments('patient-1')
    expect(result).toEqual([])
  })

  it('retourne les rendez-vous passés avec statut COMPLETED', async () => {
    const apt = buildAppointmentRow({
      appointmentDate: yesterday,
      startTime: '09:00',
      status: AppointmentStatus.COMPLETED,
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getPastAppointments('patient-1')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('apt-1')
    expect(result[0]?.status).toBe(AppointmentStatus.COMPLETED)
  })

  it('inclut les rendez-vous annulés (CANCELLED)', async () => {
    const apt = buildAppointmentRow({
      appointmentDate: yesterday,
      startTime: '09:00',
      status: AppointmentStatus.CANCELLED,
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getPastAppointments('patient-1')
    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe(AppointmentStatus.CANCELLED)
  })

  it('inclut les rendez-vous NO_SHOW', async () => {
    const apt = buildAppointmentRow({
      appointmentDate: yesterday,
      startTime: '09:00',
      status: AppointmentStatus.NO_SHOW,
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getPastAppointments('patient-1')
    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe(AppointmentStatus.NO_SHOW)
  })

  it('respecte la limite par défaut de 5 résultats', async () => {
    const appointments = Array.from({ length: 6 }, (_, i) =>
      buildAppointmentRow({ id: `apt-${i}`, appointmentDate: yesterday, startTime: '09:00', status: AppointmentStatus.COMPLETED })
    )
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)

    const result = await service.getPastAppointments('patient-1')
    expect(result).toHaveLength(5)
  })

  it('accepte une limite personnalisée', async () => {
    const appointments = Array.from({ length: 4 }, (_, i) =>
      buildAppointmentRow({ id: `apt-${i}`, appointmentDate: yesterday, startTime: '09:00', status: AppointmentStatus.COMPLETED })
    )
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)

    const result = await service.getPastAppointments('patient-1', 3)
    expect(result).toHaveLength(3)
  })

  it("filtre les rendez-vous du jour dont l'heure est dans le futur", async () => {
    jest.useFakeTimers().setSystemTime(noonUTC)
    // Rendez-vous aujourd'hui à 14:00 UTC (futur vs midi UTC), statut PENDING
    // → ne doit pas être dans les passés
    const apt = buildAppointmentRow({
      appointmentDate: today,
      startTime: '14:00',
      status: AppointmentStatus.PENDING,
    })
    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

    const result = await service.getPastAppointments('patient-1')
    expect(result).toHaveLength(0)
  })
})

// ── Tests : cancelAppointment ──────────────────────────────────────────────────

describe('AppointmentsService.cancelAppointment', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  it('annule un rendez-vous valide', async () => {
    const apt = buildAppointmentRow({
      id: 'apt-1',
      patientId: 'patient-1',
      appointmentDate: tomorrow,
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)
    ;(mockPrisma.appointment.update as jest.Mock).mockResolvedValue({ ...apt, status: AppointmentStatus.CANCELLED })

    await expect(service.cancelAppointment('apt-1', 'patient-1')).resolves.toBeUndefined()

    expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    )
  })

  it("lève une erreur si le rendez-vous n'existe pas", async () => {
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(service.cancelAppointment('apt-inexistant', 'patient-1')).rejects.toThrow(
      'Rendez-vous non trouvé',
    )
  })

  it("lève une erreur si le patient n'est pas propriétaire du rendez-vous", async () => {
    const apt = buildAppointmentRow({ patientId: 'autre-patient' })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.cancelAppointment('apt-1', 'patient-1')).rejects.toThrow(
      'Vous ne pouvez pas annuler ce rendez-vous',
    )
  })

  it("lève une erreur si le rendez-vous est déjà CANCELLED", async () => {
    const apt = buildAppointmentRow({
      patientId: 'patient-1',
      status: AppointmentStatus.CANCELLED,
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.cancelAppointment('apt-1', 'patient-1')).rejects.toThrow(
      'Ce rendez-vous ne peut pas être annulé',
    )
  })

  it("lève une erreur si le rendez-vous est déjà COMPLETED", async () => {
    const apt = buildAppointmentRow({
      patientId: 'patient-1',
      status: AppointmentStatus.COMPLETED,
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.cancelAppointment('apt-1', 'patient-1')).rejects.toThrow(
      'Ce rendez-vous ne peut pas être annulé',
    )
  })

  it("lève une erreur si le rendez-vous est dans le passé", async () => {
    const apt = buildAppointmentRow({
      patientId: 'patient-1',
      appointmentDate: yesterday,
      startTime: '09:00',
      status: AppointmentStatus.CONFIRMED,
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.cancelAppointment('apt-1', 'patient-1')).rejects.toThrow(
      'Vous ne pouvez pas annuler un rendez-vous passé',
    )
  })

  it("passe la raison d'annulation si fournie", async () => {
    const apt = buildAppointmentRow({
      patientId: 'patient-1',
      appointmentDate: tomorrow,
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)
    ;(mockPrisma.appointment.update as jest.Mock).mockResolvedValue({})

    await service.cancelAppointment('apt-1', 'patient-1', 'Empêchement personnel')

    expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cancellationReason: 'Empêchement personnel' }),
      }),
    )
  })
})

// ── Tests : updateAppointment ──────────────────────────────────────────────────

describe('AppointmentsService.updateAppointment', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  const buildAptWithPractitioner = (overrides = {}) => ({
    ...buildAppointmentRow({
      patientId: 'patient-1',
      appointmentDate: tomorrow,
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      status: AppointmentStatus.CONFIRMED,
    }),
    practitioner: buildPractitioner({ cancellationNotice: 24, consultationDuration: 30 }),
    ...overrides,
  })

  it("lève une erreur si le rendez-vous n'existe pas", async () => {
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(service.updateAppointment('apt-1', 'patient-1', { startTime: '11:00' })).rejects.toThrow(
      'Rendez-vous non trouvé',
    )
  })

  it("lève une erreur si le patient n'est pas propriétaire", async () => {
    const apt = buildAptWithPractitioner({ patientId: 'autre-patient' })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.updateAppointment('apt-1', 'patient-1', { startTime: '11:00' })).rejects.toThrow(
      'Vous ne pouvez pas modifier ce rendez-vous',
    )
  })

  it("lève une erreur si le rendez-vous est CANCELLED", async () => {
    const apt = buildAptWithPractitioner({ status: AppointmentStatus.CANCELLED })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.updateAppointment('apt-1', 'patient-1', {})).rejects.toThrow(
      'Ce rendez-vous ne peut pas être modifié',
    )
  })

  it("lève une erreur si le rendez-vous est COMPLETED", async () => {
    const apt = buildAptWithPractitioner({ status: AppointmentStatus.COMPLETED })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.updateAppointment('apt-1', 'patient-1', {})).rejects.toThrow(
      'Ce rendez-vous ne peut pas être modifié',
    )
  })

  it("lève une erreur si la modification est trop proche (délai de préavis non respecté)", async () => {
    const soonDate = new Date()
    soonDate.setHours(soonDate.getHours() + 2)
    const soonTime = `${String(soonDate.getHours()).padStart(2, '0')}:00`

    const apt = buildAptWithPractitioner({
      appointmentDate: soonDate,
      startTime: soonTime,
      practitioner: buildPractitioner({ cancellationNotice: 24, consultationDuration: 30 }),
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(service.updateAppointment('apt-1', 'patient-1', { startTime: '12:00' })).rejects.toThrow(
      'Vous ne pouvez modifier un rendez-vous que',
    )
  })

  it('met à jour la date et l\'heure avec succès', async () => {
    const farFuture = new Date(today)
    farFuture.setDate(farFuture.getDate() + 5)
    const apt = buildAptWithPractitioner({
      appointmentDate: farFuture,
      startTime: '10:00',
    })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null) // pas de conflit
    ;(mockPrisma.appointment.update as jest.Mock).mockResolvedValue({
      ...apt,
      startTime: '11:00',
      endTime: '11:30',
      practitioner: {
        ...buildPractitioner(),
        specialties: [{ specialty: { name: 'Médecine générale' } }],
      },
    })

    const result = await service.updateAppointment('apt-1', 'patient-1', {
      startTime: '11:00',
    })

    expect(result.startTime).toBe('11:00')
  })

  it("lève une erreur si le nouveau créneau est déjà pris", async () => {
    const farFuture = new Date(today)
    farFuture.setDate(farFuture.getDate() + 5)
    const apt = buildAptWithPractitioner({ appointmentDate: farFuture, startTime: '10:00' })
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)
    ;(mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'apt-autre' }) // conflit

    await expect(service.updateAppointment('apt-1', 'patient-1', { startTime: '11:00' })).rejects.toThrow(
      "Ce créneau n'est plus disponible",
    )
  })
})

describe('AppointmentsService.toggleEarlierSlotAlert', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  it('active l\'alerte pour un rendez-vous à venir (plus de 48h)', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3) // 72 heures dans le futur

    const apt = buildAppointmentRow({
      id: 'apt-1',
      patientId: 'patient-1',
      appointmentDate: futureDate,
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
      earlierSlotAlertEnabled: false,
    })

    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)
    ;(mockPrisma.appointment.update as jest.Mock).mockResolvedValue({
      ...apt,
      earlierSlotAlertEnabled: true,
    })

    const result = await service.toggleEarlierSlotAlert('apt-1', 'patient-1', true)

    expect(result.earlierSlotAlertEnabled).toBe(true)
    expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1' },
        data: { earlierSlotAlertEnabled: true },
      }),
    )
  })

  it('lève une erreur si le rendez-vous est prévu dans moins de 48h', async () => {
    const soonDate = new Date()
    soonDate.setHours(soonDate.getHours() + 10) // 10h dans le futur

    const apt = buildAppointmentRow({
      id: 'apt-1',
      patientId: 'patient-1',
      appointmentDate: soonDate,
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
    })

    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apt)

    await expect(
      service.toggleEarlierSlotAlert('apt-1', 'patient-1', true),
    ).rejects.toThrow('Vous ne pouvez activer ou désactiver cette alerte que')
  })
})

describe('AppointmentsService.notifyPatientsOfEarlierSlot', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService()
    jest.clearAllMocks()
  })

  it('envoie un email aux patients éligibles ayant activé l\'alerte', async () => {
    const cancelledDate = new Date()
    cancelledDate.setDate(cancelledDate.getDate() + 2) // libéré dans 2 jours

    const patientAptDate = new Date()
    patientAptDate.setDate(patientAptDate.getDate() + 5) // rendez-vous du patient dans 5 jours

    const candidates = [
      {
        id: 'apt-candidate-1',
        patientId: 'patient-alerted',
        appointmentDate: patientAptDate,
        startTime: '10:00',
        status: AppointmentStatus.CONFIRMED,
        earlierSlotAlertEnabled: true,
        patient: {
          firstName: 'Marc',
          lastName: 'Koffi',
          user: { email: 'marc@koffi.ci' },
        },
        practitioner: {
          id: 'pract-1',
          title: 'Dr',
          firstName: 'Jean',
          lastName: 'Dupont',
          specialties: [{ specialty: { name: 'Médecine générale' } }],
          cabinets: [],
        },
      },
    ]

    ;(mockPrisma.appointment.findMany as jest.Mock).mockResolvedValue(candidates)

    const { sendEarlierSlotAlertEmail } = require('../../../utils/email')

    await service.notifyPatientsOfEarlierSlot('pract-1', cancelledDate, '09:00')

    expect(sendEarlierSlotAlertEmail).toHaveBeenCalledWith(
      'marc@koffi.ci',
      expect.objectContaining({
        patientName: 'Marc Koffi',
        practitionerId: 'pract-1',
      }),
    )
  })
})
