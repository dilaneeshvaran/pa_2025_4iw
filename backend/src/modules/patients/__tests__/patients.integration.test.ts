import { FastifyInstance } from 'fastify'
import { practitionerPatientsRoutes } from '../patients.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import {
  practitionerProfile,
  testUser,
} from '../../../__tests__/helpers/integration-fixtures'
import prisma from '../../../config/database'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../patients.service', () => ({
  __esModule: true,
  patientsService: {
    getPatientsList: jest.fn(),
    getPatientDetail: jest.fn(),
    getPatientDocuments: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { patientsService: mockPatientsService } = jest.requireMock(
  '../patients.service',
) as {
  patientsService: {
    getPatientsList: jest.Mock
    getPatientDetail: jest.Mock
    getPatientDocuments: jest.Mock
  }
}

describe('Practitioner patients integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PRACTITIONER', 'practitioner-user'),
    )
    ;(mockPrisma.practitioner.findUnique as jest.Mock).mockResolvedValue(
      practitionerProfile('practitioner-1'),
    )

    app = buildIntegrationApp({
      route: practitionerPatientsRoutes,
      prefix: '/api/practitioner/patients',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('GET /api/practitioner/patients', () => {
    it('retourne 200 pour un praticien authentifie', async () => {
      mockPatientsService.getPatientsList.mockResolvedValue({
        data: [{ id: 'patient-1' }],
        total: 1,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients',
        headers: authHeader('PRACTITIONER', 'practitioner-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(mockPatientsService.getPatientsList).toHaveBeenCalledWith(
        'practitioner-1',
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('GET /api/practitioner/patients/:id', () => {
    it('retourne 200 avec le detail patient', async () => {
      mockPatientsService.getPatientDetail.mockResolvedValue({
        id: 'patient-1',
        firstName: 'Jean',
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients/patient-1',
        headers: authHeader('PRACTITIONER', 'practitioner-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe('patient-1')
    })

    it('retourne 404 quand le patient est introuvable', async () => {
      mockPatientsService.getPatientDetail.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients/unknown',
        headers: authHeader('PRACTITIONER', 'practitioner-user'),
      })

      expect(response.statusCode).toBe(404)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients/patient-1',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('GET /api/practitioner/patients/:id/documents', () => {
    it('retourne 200 avec les documents patient', async () => {
      mockPatientsService.getPatientDocuments.mockResolvedValue([
        { id: 'document-1' },
      ])

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients/patient-1/documents',
        headers: authHeader('PRACTITIONER', 'practitioner-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toHaveLength(1)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioner/patients/patient-1/documents',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
