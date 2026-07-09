import { FastifyInstance } from 'fastify'
import { practitionersRoutes } from '../practitioners.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import {
  paginatedResult,
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
    specialty: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('../practitioners.service', () => ({
  __esModule: true,
  practitionersService: {
    searchPractitioners: jest.fn(),
    getPractitionerById: jest.fn(),
    getAvailableSlots: jest.fn(),
    getStatistics: jest.fn(),
    getCabinets: jest.fn(),
    getCabinetById: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { practitionersService: mockPractitionersService } = jest.requireMock(
  '../practitioners.service',
) as {
  practitionersService: {
    searchPractitioners: jest.Mock
    getPractitionerById: jest.Mock
    getAvailableSlots: jest.Mock
    getStatistics: jest.Mock
    getCabinets: jest.Mock
    getCabinetById: jest.Mock
  }
}

describe('Practitioners integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PRACTITIONER', 'practitioner-user'),
    )
    ;(mockPrisma.practitioner.findUnique as jest.Mock).mockResolvedValue(
      practitionerProfile('practitioner-1'),
    )
    ;(mockPrisma.specialty.findMany as jest.Mock).mockResolvedValue([
      { id: 'specialty-1', name: 'Cardiologie' },
    ])
    mockPractitionersService.searchPractitioners.mockResolvedValue(
      paginatedResult([{ id: 'practitioner-1' }]),
    )
    mockPractitionersService.getPractitionerById.mockResolvedValue({
      id: 'practitioner-1',
    })
    mockPractitionersService.getAvailableSlots.mockResolvedValue([
      { date: '2026-08-15', slots: ['10:00'] },
    ])
    mockPractitionersService.getStatistics.mockResolvedValue({
      appointments: 12,
    })

    app = buildIntegrationApp({
      route: practitionersRoutes,
      prefix: '/api/practitioners',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('GET /api/practitioners/search', () => {
    it('retourne 200 pour une recherche publique', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/search',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toHaveLength(1)
    })

    it('retourne 200 avec des filtres', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/search?search=cardio&page=2&limit=10',
      })

      expect(response.statusCode).toBe(200)
      expect(mockPractitionersService.searchPractitioners).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'cardio',
          page: 2,
          limit: 10,
        }),
      )
    })
  })

  it('GET /api/practitioners/specialties retourne 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/practitioners/specialties',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data[0].name).toBe('Cardiologie')
  })

  describe('GET /api/practitioners/:id', () => {
    it('retourne 200 avec le praticien', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/practitioner-1',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe('practitioner-1')
    })

    it('retourne 404 si le praticien est introuvable', async () => {
      mockPractitionersService.getPractitionerById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/unknown',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/practitioners/:id/available-slots', () => {
    it('retourne 200 avec les disponibilites', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/practitioner-1/available-slots?days=7',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data).toHaveLength(1)
    })

    it('rejette une query invalide avec 400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/practitioner-1/available-slots?days=0',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/practitioners/statistics', () => {
    it('retourne 200 pour un praticien authentifie', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/statistics',
        headers: authHeader('PRACTITIONER', 'practitioner-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.appointments).toBe(12)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/statistics',
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 403 pour un patient authentifie', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        testUser('PATIENT', 'patient-user'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/practitioners/statistics',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
