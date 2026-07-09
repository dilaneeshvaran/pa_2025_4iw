import { FastifyInstance } from 'fastify'
import { documentsRoutes } from '../documents.routes'
import {
  authHeader,
  buildIntegrationApp,
  closeIntegrationApp,
} from '../../../__tests__/helpers/integration-app'
import {
  emptyDocumentResult,
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

jest.mock('../documents.service', () => ({
  __esModule: true,
  documentsService: {
    getReceivedDocuments: jest.fn(),
    getPatientOwnDocuments: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const { documentsService: mockDocumentsService } = jest.requireMock(
  '../documents.service',
) as {
  documentsService: {
    getReceivedDocuments: jest.Mock
    getPatientOwnDocuments: jest.Mock
  }
}

describe('Documents integration routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(
      testUser('PATIENT', 'patient-user'),
    )
    mockDocumentsService.getReceivedDocuments.mockResolvedValue(
      emptyDocumentResult,
    )
    mockDocumentsService.getPatientOwnDocuments.mockResolvedValue(
      emptyDocumentResult,
    )

    app = buildIntegrationApp({
      route: documentsRoutes,
      prefix: '/api/documents',
    })
    await app.ready()
  })

  afterEach(async () => {
    await closeIntegrationApp(app)
  })

  describe('GET /api/documents/received', () => {
    it('retourne 200 pour un patient authentifie', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/received?page=2&limit=5&type=all',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(mockDocumentsService.getReceivedDocuments).toHaveBeenCalledWith(
        'patient-user',
        'all',
        undefined,
        2,
        5,
      )
      expect(response.json().pagination.total).toBe(0)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/received',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/documents/own', () => {
    it('retourne 200 pour les documents du patient', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/own?search=bilan',
        headers: authHeader('PATIENT', 'patient-user'),
      })

      expect(response.statusCode).toBe(200)
      expect(mockDocumentsService.getPatientOwnDocuments).toHaveBeenCalledWith(
        'patient-user',
        'all',
        'bilan',
        1,
        12,
      )
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/own',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
