import { campaignsService } from '../campaigns.service'

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    campaign: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    campaignRecipient: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    practitioner: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  buildEmailHtml: jest.fn(({ contentHtml, accentColor }) => (
    `<html data-accent="${accentColor}">${contentHtml}</html>`
  )),
}))

import prisma from '../../../config/database'
import { buildEmailHtml, sendEmail } from '../../../utils/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const baseInput = {
  title: 'Maintenance',
  message: 'Une intervention est prévue',
  messageType: 'MAINTENANCE',
  targetType: 'ALL_PATIENTS',
  channels: ['EMAIL'],
  createdBy: 'admin-1',
}

describe('CampaignsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-07-08T10:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('compte les destinataires actifs patients et praticiens', async () => {
    mockPrisma.patient.count.mockResolvedValue(3 as any)
    mockPrisma.practitioner.count.mockResolvedValue(2 as any)

    await expect(campaignsService.getRecipientCounts()).resolves.toEqual({
      patients: 3,
      practitioners: 2,
      total: 5,
    })
    expect(mockPrisma.patient.count).toHaveBeenCalledWith({
      where: { user: { status: 'ACTIVE', deletedAt: null } },
    })
  })

  it('applique les filtres ville et dates au comptage personnalisé', async () => {
    mockPrisma.patient.count.mockResolvedValue(4 as any)
    mockPrisma.practitioner.count.mockResolvedValue(6 as any)

    const total = await campaignsService.getFilteredRecipientCount({
      targetType: 'CUSTOM',
      targetUserTypes: [],
      targetLocations: ['Abidjan'],
      targetRegisteredFrom: '2026-01-01',
      targetRegisteredTo: '2026-06-30',
    })

    expect(total).toBe(10)
    expect(mockPrisma.patient.count).toHaveBeenCalledWith({
      where: {
        user: { status: 'ACTIVE', deletedAt: null },
        createdAt: {
          gte: new Date('2026-01-01'),
          lte: new Date('2026-06-30'),
        },
        city: { in: ['Abidjan'], mode: 'insensitive' },
      },
    })
  })

  it('retourne les villes disponibles triées sans valeurs nulles', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { city: 'Yamoussoukro' },
      { city: null },
    ] as any)
    mockPrisma.practitioner.findMany.mockResolvedValue([
      { city: 'Abidjan' },
      { city: 'Yamoussoukro' },
    ] as any)

    await expect(campaignsService.getAvailableCities()).resolves.toEqual([
      'Abidjan',
      'Yamoussoukro',
    ])
  })

  describe('createAndSendCampaign', () => {
    beforeEach(() => {
      mockPrisma.patient.findMany.mockResolvedValue([
        { id: 'patient-1', user: { email: 'patient@example.test' } },
      ] as any)
      mockPrisma.practitioner.findMany.mockResolvedValue([
        { id: 'practitioner-1', user: { email: 'practitioner@example.test' } },
      ] as any)
      mockPrisma.campaign.create.mockResolvedValue({
        id: 'campaign-1',
        title: baseInput.title,
      } as any)
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([])
      mockPrisma.campaign.update.mockResolvedValue({} as any)
    })

    it('récupère tous les patients actifs pour ALL_PATIENTS', async () => {
      await campaignsService.createAndSendCampaign(baseInput)

      expect(mockPrisma.patient.findMany).toHaveBeenCalled()
      expect(mockPrisma.practitioner.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'COMPLETED',
          totalRecipients: 1,
          recipients: {
            create: [
              {
                email: 'patient@example.test',
                patientId: 'patient-1',
                practitionerId: undefined,
              },
            ],
          },
        }),
      })
    })

    it('inclut patients et praticiens quand CUSTOM ne précise aucun type', async () => {
      await campaignsService.createAndSendCampaign({
        ...baseInput,
        targetType: 'CUSTOM',
        targetUserTypes: [],
      })

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalRecipients: 2,
          recipients: {
            create: [
              {
                email: 'patient@example.test',
                patientId: 'patient-1',
                practitionerId: undefined,
              },
              {
                email: 'practitioner@example.test',
                patientId: undefined,
                practitionerId: 'practitioner-1',
              },
            ],
          },
        }),
      })
    })

    it('planifie une campagne future sans envoi immédiat', async () => {
      await campaignsService.createAndSendCampaign({
        ...baseInput,
        scheduledAt: '2026-07-09T10:00:00.000Z',
      })

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'ACTIVE',
          scheduledAt: new Date('2026-07-09T10:00:00.000Z'),
        }),
      })
      expect(mockPrisma.campaignRecipient.findMany).not.toHaveBeenCalled()
    })

    it('envoie immédiatement une campagne email non planifiée', async () => {
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([
        { id: 'recipient-1', email: 'ok@example.test' },
      ] as any)

      await campaignsService.createAndSendCampaign(baseInput)

      expect(sendEmail).toHaveBeenCalledWith(
        'ok@example.test',
        baseInput.title,
        expect.stringContaining('Une intervention est prévue'),
      )
      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: { sent: true, sentAt: new Date('2026-07-08T10:00:00.000Z') },
      })
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: {
          sentAt: new Date('2026-07-08T10:00:00.000Z'),
          sentCount: 1,
          failedCount: 0,
          status: 'COMPLETED',
        },
      })
    })
  })

  it('gère les erreurs individuelles pendant le batch email', async () => {
    mockPrisma.campaignRecipient.findMany.mockResolvedValue([
      { id: 'recipient-1', email: 'ok@example.test' },
      { id: 'recipient-2', email: 'ko@example.test' },
    ] as any)
    ;(sendEmail as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SMTP down'))

    await (campaignsService as any).sendCampaignEmails(
      'campaign-1',
      'Sujet',
      'Message',
      'INFO',
    )

    expect(mockPrisma.campaignRecipient.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'recipient-2' },
      data: { error: 'SMTP down' },
    })
    expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: expect.objectContaining({
        sentCount: 1,
        failedCount: 1,
      }),
    })
  })

  it('construit les filtres de liste des campagnes avec pagination', async () => {
    mockPrisma.campaign.findMany.mockResolvedValue([{ id: 'campaign-1' }] as any)
    mockPrisma.campaign.count.mockResolvedValue(21 as any)

    await expect(
      campaignsService.getCampaigns({
        status: 'ACTIVE',
        messageType: 'INFO',
        search: 'maintenance',
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({
      campaigns: [{ id: 'campaign-1' }],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    })
    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
          messageType: 'INFO',
          OR: [
            { title: { contains: 'maintenance', mode: 'insensitive' } },
            { message: { contains: 'maintenance', mode: 'insensitive' } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    )
  })

  it('récupère une campagne avec ses destinataires', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'campaign-1' } as any)

    await expect(campaignsService.getCampaignById('campaign-1')).resolves.toEqual({
      id: 'campaign-1',
    })
    expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      include: expect.objectContaining({
        recipients: expect.objectContaining({ take: 100 }),
      }),
    })
  })

  it('utilise une couleur grise pour les emails de maintenance', () => {
    const html = (campaignsService as any).buildCampaignEmailHtml(
      'Intervention',
      '<maintenance>',
      'MAINTENANCE',
    )

    expect(buildEmailHtml).toHaveBeenCalledWith(
      expect.objectContaining({
        accentColor: '#64748b',
        contentHtml: expect.stringContaining('&lt;maintenance&gt;'),
      }),
    )
    expect(html).toContain('data-accent="#64748b"')
  })
})
