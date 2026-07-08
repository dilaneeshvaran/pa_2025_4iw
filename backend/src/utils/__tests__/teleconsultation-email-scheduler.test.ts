import { Queue, Worker } from 'bullmq'
import {
  scheduleTeleconsultationJoinedEmail,
  startTeleconsultationEmailWorker,
} from '../teleconsultation-email-scheduler'
import prisma from '../../config/database'
import { sendTeleconsultationParticipantJoinedEmail } from '../email'

let workerCallback: any

jest.mock('bullmq', () => {
  const mockAdd = jest.fn()
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: mockAdd,
    })),
    Worker: jest.fn().mockImplementation((name, cb) => {
      workerCallback = cb
      return {
        on: jest.fn(),
      }
    }),
  }
})

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    teleconsultationSession: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../../config/redis', () => ({
  redis: {},
}))

jest.mock('../email', () => ({
  sendTeleconsultationParticipantJoinedEmail: jest.fn().mockResolvedValue(undefined),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = sendTeleconsultationParticipantJoinedEmail as jest.MockedFunction<
  typeof sendTeleconsultationParticipantJoinedEmail
>

describe('teleconsultation-email-scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    workerCallback = null
  })

  it('devrait ajouter un job dans la file avec le bon delai', async () => {
    const jobData = {
      sessionId: 'session-1',
      to: 'practitioner@example.com',
      recipientName: 'Dr. Dupont',
      senderName: 'Marie Curie',
      appointmentId: 'apt-1',
      isRecipientPatient: false,
    }

    await scheduleTeleconsultationJoinedEmail(jobData, 10000)

    const mockQueue = Queue as jest.Mock
    const mockAdd = mockQueue.mock.results[0].value.add

    expect(mockAdd).toHaveBeenCalledWith(
      'joined-email',
      jobData,
      expect.objectContaining({
        delay: 10000,
        jobId: 'session-1-practitioner-joined',
      })
    )
  })

  describe('Worker', () => {
    it('devrait envoyer le mail si le destinataire n\'a pas encore rejoint la session', async () => {
      startTeleconsultationEmailWorker()
      expect(workerCallback).toBeTruthy()

      const jobData = {
        sessionId: 'session-1',
        to: 'practitioner@example.com',
        recipientName: 'Dr. Dupont',
        senderName: 'Marie Curie',
        appointmentId: 'apt-1',
        isRecipientPatient: false,
      }

      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        patientJoinedAt: new Date(),
        practitionerJoinedAt: null, // Le destinataire n'a pas rejoint
      } as any)

      await workerCallback({ data: jobData })

      expect(mockSendEmail).toHaveBeenCalledWith('practitioner@example.com', {
        recipientName: 'Dr. Dupont',
        senderName: 'Marie Curie',
        appointmentId: 'apt-1',
        isRecipientPatient: false,
      })
    })

    it('devrait passer le mail si la session de teleconsultation est introuvable', async () => {
      startTeleconsultationEmailWorker()

      const jobData = {
        sessionId: 'session-1',
        to: 'practitioner@example.com',
        recipientName: 'Dr. Dupont',
        senderName: 'Marie Curie',
        appointmentId: 'apt-1',
        isRecipientPatient: false,
      }

      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue(null)

      await workerCallback({ data: jobData })

      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('devrait passer le mail si le destinataire a deja rejoint la session', async () => {
      startTeleconsultationEmailWorker()

      const jobData = {
        sessionId: 'session-1',
        to: 'practitioner@example.com',
        recipientName: 'Dr. Dupont',
        senderName: 'Marie Curie',
        appointmentId: 'apt-1',
        isRecipientPatient: false,
      }

      mockPrisma.teleconsultationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        patientJoinedAt: new Date(),
        practitionerJoinedAt: new Date(), // Le destinataire (praticien) a déjà rejoint !
      } as any)

      await workerCallback({ data: jobData })

      expect(mockSendEmail).not.toHaveBeenCalled()
    })
  })
})
