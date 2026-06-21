import { reviewsRouter } from '../reviews.router'
import { reviewsService } from '../reviews.service'
import prisma from '../../../config/database'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    patient: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../reviews.service', () => ({
  reviewsService: {
    createReview: jest.fn(),
    getReviewByAppointment: jest.fn(),
    getPractitionerReviews: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockReviewsService = reviewsService as jest.Mocked<typeof reviewsService>

describe('Reviews ts-rest Router', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createReview', () => {
    it('returns 403 when user is not a PATIENT', async () => {
      const response = await (reviewsRouter.createReview as any)({
        body: { appointmentId: 'apt-1', rating: 5, comment: 'Great!' },
        request: {
          user: { id: 'user-1', role: 'DOCTOR' },
          log: { error: jest.fn() },
        },
      })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Accès refusé')
    })

    it('returns 404 when patient profile does not exist', async () => {
      ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await (reviewsRouter.createReview as any)({
        body: { appointmentId: 'apt-1', rating: 5, comment: 'Great!' },
        request: {
          user: { id: 'user-1', role: 'PATIENT' },
          log: { error: jest.fn() },
        },
      })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Patient introuvable')
    })

    it('creates a review successfully', async () => {
      const mockPatient = { id: 'patient-1' }
      const mockCreatedReview = {
        id: 'review-1',
        appointmentId: 'apt-1',
        patientId: 'patient-1',
        practitionerId: 'doctor-1',
        rating: 5,
        comment: 'Great!',
        createdAt: new Date(),
        isPublished: true,
        response: null,
        respondedAt: null,
      }
      ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
      ;(mockReviewsService.createReview as jest.Mock).mockResolvedValue(mockCreatedReview)

      const response = await (reviewsRouter.createReview as any)({
        body: { appointmentId: 'apt-1', rating: 5, comment: 'Great!' },
        request: {
          user: { id: 'user-1', role: 'PATIENT' },
          log: { error: jest.fn() },
        },
      })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('review-1')
      expect(response.body.message).toBe('Avis publié avec succès')
    })
  })

  describe('getReviewByAppointment', () => {
    it('returns review by appointment ID', async () => {
      const mockPatient = { id: 'patient-1' }
      const mockReview = {
        id: 'review-1',
        rating: 4,
        comment: 'Good',
        createdAt: new Date(),
        response: null,
        respondedAt: null,
      }
      ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
      ;(mockReviewsService.getReviewByAppointment as jest.Mock).mockResolvedValue(mockReview)

      const response = await (reviewsRouter.getReviewByAppointment as any)({
        params: { appointmentId: 'apt-1' },
        request: {
          user: { id: 'user-1', role: 'PATIENT' },
          log: { error: jest.fn() },
        },
      })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.rating).toBe(4)
    })
  })

  describe('getPractitionerReviews', () => {
    it('returns practitioner reviews list', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Perfect',
          createdAt: new Date(),
          response: null,
          respondedAt: null,
          patient: { firstName: 'Alice', lastName: 'Smith' },
        },
      ]
      ;(mockReviewsService.getPractitionerReviews as jest.Mock).mockResolvedValue(mockReviews)

      const response = await (reviewsRouter.getPractitionerReviews as any)({
        params: { practitionerId: 'doctor-1' },
        request: { log: { error: jest.fn() } },
      })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data[0].patient.firstName).toBe('Alice')
    })
  })
})
