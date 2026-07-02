import { paymentsService } from '../payments.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    savedPaymentMethod: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cmds) => Promise.all(cmds)),
  },
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Practitioner Saved Payment Methods Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSavedPaymentMethods', () => {
    it('récupère les moyens de paiement enregistrés pour un praticien', async () => {
      const mockMethods = [
        {
          id: 'method-1',
          type: 'CARD',
          label: 'Visa •••• 4242',
          isDefault: true,
          cardLast4: '4242',
          cardBrand: 'Visa',
          cardExpMonth: 12,
          cardExpYear: 2028,
          mobileOperator: null,
          mobileNumber: null,
          isVerified: true,
          createdAt: new Date('2026-07-02T10:00:00Z'),
        },
      ]

      mockPrisma.savedPaymentMethod.findMany.mockResolvedValue(mockMethods as any)

      const result = await paymentsService.getSavedPaymentMethods('practitioner-1', 'PRACTITIONER')

      expect(mockPrisma.savedPaymentMethod.findMany).toHaveBeenCalledWith({
        where: { practitionerId: 'practitioner-1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('method-1')
      expect(result[0].isVerified).toBe(true)
    })
  })

  describe('addPaymentMethod', () => {
    it('ajoute un moyen de paiement Mobile Money pour un praticien', async () => {
      const inputData = {
        type: 'MOBILE_MONEY' as const,
        mobileOperator: 'orange_money',
        mobileNumber: '0707070707',
        isDefault: true,
      }

      const mockCreatedMethod = {
        id: 'method-2',
        type: 'MOBILE_MONEY',
        label: 'Orange Money - 07••••0707',
        isDefault: true,
        cardLast4: null,
        cardBrand: null,
        cardExpMonth: null,
        cardExpYear: null,
        mobileOperator: 'orange_money',
        mobileNumber: '0707070707',
        isVerified: false,
        createdAt: new Date(),
      }

      mockPrisma.savedPaymentMethod.findFirst.mockResolvedValue(null) // no duplicates
      mockPrisma.savedPaymentMethod.create.mockResolvedValue(mockCreatedMethod as any)

      const result = await paymentsService.addPaymentMethod('practitioner-1', inputData, 'PRACTITIONER')

      expect(mockPrisma.savedPaymentMethod.updateMany).toHaveBeenCalledWith({
        where: { practitionerId: 'practitioner-1', isDefault: true },
        data: { isDefault: false },
      })
      expect(mockPrisma.savedPaymentMethod.create).toHaveBeenCalledWith({
        data: {
          practitionerId: 'practitioner-1',
          type: 'MOBILE_MONEY',
          label: 'Orange Money - ******0707',
          isDefault: true,
          cardLast4: null,
          cardBrand: null,
          cardExpMonth: null,
          cardExpYear: null,
          mobileOperator: 'orange_money',
          mobileNumber: '0707070707',
          isVerified: false,
        },
      })
      expect(result.id).toBe('method-2')
      expect(result.isVerified).toBe(false)
    })
  })

  describe('verifyPaymentMethod', () => {
    it('vérifie un moyen de paiement pour un praticien', async () => {
      const mockMethod = {
        id: 'method-1',
        practitionerId: 'practitioner-1',
        isVerified: false,
      }

      const mockUpdatedMethod = {
        id: 'method-1',
        type: 'CARD',
        label: 'Visa •••• 4242',
        isDefault: true,
        isVerified: true,
        createdAt: new Date(),
      }

      mockPrisma.savedPaymentMethod.findUnique.mockResolvedValue(mockMethod as any)
      mockPrisma.savedPaymentMethod.update.mockResolvedValue(mockUpdatedMethod as any)

      const result = await paymentsService.verifyPaymentMethod('method-1', 'practitioner-1', '123456', 'PRACTITIONER')

      expect(mockPrisma.savedPaymentMethod.update).toHaveBeenCalledWith({
        where: { id: 'method-1' },
        data: {
          isVerified: true,
          verifiedAt: expect.any(Date),
        },
      })
      expect(result.isVerified).toBe(true)
    })
  })
})
