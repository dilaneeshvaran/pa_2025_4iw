import { paymentsService } from '../payments.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    invoice: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}))

import prisma from '../../../config/database'
const mockPrisma = prisma as jest.Mocked<typeof prisma>

const buildMockInvoice = (overrides = {}) => ({
  id: 'invoice-1',
  invoiceNumber: 'FACT-2026-001',
  invoiceDate: new Date('2026-07-02T10:00:00Z'),
  subtotal: 10000,
  taxRate: 0,
  taxAmount: 0,
  total: 10000,
  items: [
    {
      description: 'Consultation générale',
      quantity: 1,
      unitPrice: 10000,
      amount: 10000,
    },
  ],
  billedToName: 'Aya Kouassi',
  billedToAddress: 'Abidjan Cocody',
  billedToEmail: 'aya@test.ci',
  billedToPhone: '0102030405',
  billedFromName: 'Dr. Koffi',
  billedFromAddress: 'Clinic Cocody',
  billedFromLicense: 'LIC-123',
  payment: {
    status: 'COMPLETED',
    method: 'MOBILE_MONEY',
    paidAt: new Date('2026-07-02T10:05:00Z'),
    practitionerId: 'practitioner-1',
    appointment: {
      appointmentDate: new Date('2026-07-02T00:00:00Z'),
      startTime: '10:00',
      type: 'CONSULTATION',
    },
  },
  ...overrides,
})

describe('generatePractitionerInvoicePdf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('génère un PDF avec succès si la facture appartient au bon praticien', async () => {
    const mockInvoice = buildMockInvoice()
    mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any)

    const result = await paymentsService.generatePractitionerInvoicePdf('invoice-1', 'practitioner-1')

    expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      include: {
        payment: {
          include: { patient: true, practitioner: true, appointment: true },
        },
      },
    })
    expect(result).toBeInstanceOf(Buffer)
    expect(result.toString()).toBe('mock-pdf-content')
  })

  it('lève une erreur si la facture n’est pas trouvée', async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)

    await expect(
      paymentsService.generatePractitionerInvoicePdf('invoice-invalid', 'practitioner-1')
    ).rejects.toThrow('Facture non trouvée')
  })

  it('lève une erreur si le praticien n’a pas accès à la facture', async () => {
    const mockInvoice = buildMockInvoice({
      payment: {
        practitionerId: 'practitioner-2', // different practitioner
        appointment: {
          appointmentDate: new Date(),
          startTime: '10:00',
        },
      },
    })
    mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any)

    await expect(
      paymentsService.generatePractitionerInvoicePdf('invoice-1', 'practitioner-1')
    ).rejects.toThrow('Accès refusé')
  })
})
