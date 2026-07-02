import { MessagesService } from '../messages.service'

// Mock prisma database config
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    practitioner: {
      findUnique: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
  },
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('MessagesService - Conversation Closed for Patient', () => {
  let service: MessagesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new MessagesService()
  })

  describe('toggleConversationClosedForPatient', () => {
    it('should throw error if conversation is not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null)

      await expect(
        service.toggleConversationClosedForPatient('conv-123', 'prac-user-id'),
      ).rejects.toThrow('Conversation introuvable')
    })

    it('should throw error if user is not the conversation practitioner', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PATIENT_PRACTITIONER',
        practitioner: {
          user: { id: 'practitioner-owner-user-id' },
        },
      } as any)

      await expect(
        service.toggleConversationClosedForPatient('conv-123', 'other-user-id'),
      ).rejects.toThrow('Non autorisé à modifier cette conversation')
    })

    it('should throw error if conversation is not patient-practitioner type', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PRACTITIONER_PRACTITIONER',
        practitioner: {
          user: { id: 'prac-user-id' },
        },
      } as any)

      await expect(
        service.toggleConversationClosedForPatient('conv-123', 'prac-user-id'),
      ).rejects.toThrow(
        "Cette action n'est disponible que pour les conversations patient-praticien",
      )
    })

    it('should successfully toggle conversation from open to closed', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PATIENT_PRACTITIONER',
        isClosedForPatient: false,
        practitioner: {
          user: { id: 'prac-user-id' },
        },
      } as any)

      mockPrisma.conversation.update.mockResolvedValue({} as any)

      const result = await service.toggleConversationClosedForPatient(
        'conv-123',
        'prac-user-id',
      )

      expect(result).toBe(true)
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        data: { isClosedForPatient: true },
      })
    })

    it('should successfully toggle conversation from closed to open', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PATIENT_PRACTITIONER',
        isClosedForPatient: true,
        practitioner: {
          user: { id: 'prac-user-id' },
        },
      } as any)

      mockPrisma.conversation.update.mockResolvedValue({} as any)

      const result = await service.toggleConversationClosedForPatient(
        'conv-123',
        'prac-user-id',
      )

      expect(result).toBe(false)
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        data: { isClosedForPatient: false },
      })
    })
  })

  describe('canPatientSendMessage', () => {
    it('should return false if conversation does not exist', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null)

      const result = await service.canPatientSendMessage('conv-123', 'patient-user-id')
      expect(result).toBe(false)
    })

    it('should return false if the patient user is not involved in the conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        patient: {
          user: { id: 'another-patient-user-id' },
        },
      } as any)

      const result = await service.canPatientSendMessage('conv-123', 'patient-user-id')
      expect(result).toBe(false)
    })

    it('should return true for practitioner-practitioner conversations', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PRACTITIONER_PRACTITIONER',
        patient: {
          user: { id: 'patient-user-id' },
        },
      } as any)

      const result = await service.canPatientSendMessage('conv-123', 'patient-user-id')
      expect(result).toBe(true)
    })

    it('should return true if conversation is open (not closed for patient)', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PATIENT_PRACTITIONER',
        isClosedForPatient: false,
        patient: {
          user: { id: 'patient-user-id' },
        },
      } as any)

      const result = await service.canPatientSendMessage('conv-123', 'patient-user-id')
      expect(result).toBe(true)
    })

    it('should return false if conversation is closed for patient', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        type: 'PATIENT_PRACTITIONER',
        isClosedForPatient: true,
        patient: {
          user: { id: 'patient-user-id' },
        },
      } as any)

      const result = await service.canPatientSendMessage('conv-123', 'patient-user-id')
      expect(result).toBe(false)
    })
  })
})
