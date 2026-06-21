import Fastify, { FastifyRequest } from 'fastify'
import prisma from '../../../config/database'
import { appointmentsService } from '../appointments.service'
import { appointmentsRoutes } from '../appointments.routes'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    patient: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../appointments.service', () => ({
  appointmentsService: {
    toggleEarlierSlotAlert: jest.fn(),
  },
}))

jest.mock('../../../middleware/authenticate', () => ({
  authenticate: jest.fn(async (request: FastifyRequest) => {
    const authenticatedRequest = request as FastifyRequest & {
      user: { id: string; role: string }
    }
    authenticatedRequest.user = {
      id: 'user-1',
      role: 'PATIENT',
    }
  }),
}))

jest.mock('../../../config/redis', () => ({
  reserveSlot: jest.fn(),
  releaseSlotReservation: jest.fn(),
}))

jest.mock('../../../plugins/rate-limit', () => ({
  bookingRateLimit: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAppointmentsService = appointmentsService as jest.Mocked<
  typeof appointmentsService
>

describe('appointments.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('monte la route PATCH /api/appointments/:id/earlier-slot-alert', async () => {
    const app = Fastify()
    await app.register(appointmentsRoutes, { prefix: '/api/appointments' })
    await app.ready()

    ;(mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue({
      id: 'patient-1',
    })
    ;(mockAppointmentsService.toggleEarlierSlotAlert as jest.Mock).mockResolvedValue(
      {
        id: 'apt-1',
        earlierSlotAlertEnabled: true,
      },
    )

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/appointments/apt-1/earlier-slot-alert',
      payload: { enabled: true },
    })

    expect(response.statusCode).toBe(200)
    expect(mockAppointmentsService.toggleEarlierSlotAlert).toHaveBeenCalledWith(
      'apt-1',
      'patient-1',
      true,
    )

    await app.close()
  })
})
