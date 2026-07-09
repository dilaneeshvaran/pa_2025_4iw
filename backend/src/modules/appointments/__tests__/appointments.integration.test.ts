import { FastifyInstance } from 'fastify'
import { appointmentsRoutes } from '../appointments.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import {
  paginatedResult,
  patientProfile,
  testUser,
} from '../../../__tests__/helpers/integration-fixtures'
import prisma from '../../../config/database'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../../../config/redis', () => ({
  reserveSlot: jest.fn(),
  releaseSlotReservation: jest.fn(),
}))

jest.mock('../../../plugins/rate-limit', () => ({
  bookingRateLimit: jest.fn(async () => undefined),
}))

jest.mock('../appointments.service', () => ({
  __esModule: true,
  appointmentsService: {
    createAppointment: jest.fn(),
    getPatientAppointments: jest.fn(),
    getNextAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
    toggleEarlierSlotAlert: jest.fn(),
    updateAppointment: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { appointmentsService: mockAppointmentsService } = jest.requireMock(
  '../appointments.service',
) as {
  appointmentsService: {
    createAppointment: jest.Mock
    getPatientAppointments: jest.Mock
    getNextAppointment: jest.Mock
    cancelAppointment: jest.Mock
    toggleEarlierSlotAlert: jest.Mock
    updateAppointment: jest.Mock
  }
}

const appointmentPayload = {
  practitionerId: 'practitioner-1',
  appointmentDate: '2026-08-15',
  startTime: '10:30',
  type: 'IN_PERSON',
  reason: 'Consultation de suivi',
}

describe('Appointments integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )
    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(
      patientProfile('patient-1'),
    )

    app = buildIntegrationApp({
      route: appointmentsRoutes,
      prefix: '/api/appointments',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('POST /api/appointments', () => {
    it('retourne 201 pour une creation authentifiee', async () => {
      mockAppointmentsService.createAppointment.mockResolvedValue({
        id: 'appointment-1',
        ...appointmentPayload,
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/appointments',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: appointmentPayload,
      })

      expect(response.statusCode).toBe(201)
      expect(mockAppointmentsService.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-1',
          practitionerId: 'practitioner-1',
        }),
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/appointments',
        payload: appointmentPayload,
      })

      expect(response.statusCode).toBe(401)
    })

    it('rejette un payload invalide avec 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/appointments',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: { ...appointmentPayload, appointmentDate: '15/08/2026' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/appointments/patient', () => {
    it('retourne 200 avec les rendez-vous du patient', async () => {
      mockAppointmentsService.getPatientAppointments.mockResolvedValue(
        paginatedResult([{ id: 'appointment-1' }]),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/appointments/patient',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toHaveLength(1)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/appointments/patient',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/appointments/patient/next', () => {
    it('retourne 200 avec le prochain rendez-vous', async () => {
      mockAppointmentsService.getNextAppointment.mockResolvedValue({
        id: 'appointment-next',
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/appointments/patient/next',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe('appointment-next')
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/appointments/patient/next',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PATCH /api/appointments/:id/cancel', () => {
    it('retourne 200 apres annulation', async () => {
      mockAppointmentsService.cancelAppointment.mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1/cancel',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: { reason: 'Indisponible' },
      })

      expect(response.statusCode).toBe(200)
      expect(mockAppointmentsService.cancelAppointment).toHaveBeenCalledWith(
        'appointment-1',
        'patient-1',
        'Indisponible',
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1/cancel',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 404 si le profil patient est introuvable', async () => {
      ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1/cancel',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/appointments/:id/earlier-slot-alert', () => {
    it("retourne 200 apres modification de l'alerte", async () => {
      mockAppointmentsService.toggleEarlierSlotAlert.mockResolvedValue({
        id: 'appointment-1',
        earlierSlotAlertEnabled: true,
      })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1/earlier-slot-alert',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: { enabled: true },
      })

      expect(response.statusCode).toBe(200)
      expect(mockAppointmentsService.toggleEarlierSlotAlert).toHaveBeenCalledWith(
        'appointment-1',
        'patient-1',
        true,
      )
    })

    it('rejette un payload invalide avec 400', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1/earlier-slot-alert',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: { enabled: 'yes' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /api/appointments/:id', () => {
    it('retourne 200 apres modification', async () => {
      mockAppointmentsService.updateAppointment.mockResolvedValue({
        id: 'appointment-1',
        startTime: '11:00',
      })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1',
        headers: authHeader('PATIENT', 'patient-user'),
        payload: { startTime: '11:00' },
      })

      expect(response.statusCode).toBe(200)
      expect(mockAppointmentsService.updateAppointment).toHaveBeenCalledWith(
        'appointment-1',
        'patient-1',
        { startTime: '11:00' },
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/appointments/appointment-1',
        payload: { startTime: '11:00' },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
