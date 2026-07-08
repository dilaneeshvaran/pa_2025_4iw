import prisma from '../../config/database'
import { sendEmail, buildEmailHtml } from '../../utils/email'

interface RecipientCountFilters {
  targetType: string
  targetUserTypes?: string[]
  targetLocations?: string[]
  targetRegisteredFrom?: string
  targetRegisteredTo?: string
}

interface CreateCampaignInput {
  title: string
  message: string
  messageType: string
  targetType: string
  targetUserTypes?: string[]
  targetLocations?: string[]
  targetRegisteredFrom?: string
  targetRegisteredTo?: string
  channels: string[]
  scheduledAt?: string
  createdBy: string
}

interface CampaignListFilters {
  status?: string
  messageType?: string
  search?: string
  page?: number
  limit?: number
}

class CampaignsService {
  async getRecipientCounts(): Promise<{
    patients: number
    practitioners: number
    total: number
  }> {
    const [patients, practitioners] = await Promise.all([
      prisma.patient.count({
        where: { user: { status: 'ACTIVE', deletedAt: null } },
      }),
      prisma.practitioner.count({
        where: { user: { status: 'ACTIVE', deletedAt: null } },
      }),
    ])

    return {
      patients,
      practitioners,
      total: patients + practitioners,
    }
  }

  async getFilteredRecipientCount(
    filters: RecipientCountFilters,
  ): Promise<number> {
    const {
      targetType,
      targetUserTypes,
      targetLocations,
      targetRegisteredFrom,
      targetRegisteredTo,
    } = filters

    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (targetRegisteredFrom) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        gte: new Date(targetRegisteredFrom),
      }
    }
    if (targetRegisteredTo) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: new Date(targetRegisteredTo),
      }
    }

    const locationFilter =
      targetLocations && targetLocations.length > 0
        ? { city: { in: targetLocations, mode: 'insensitive' as const } }
        : {}

    if (targetType === 'ALL_PATIENTS') {
      return prisma.patient.count({
        where: {
          user: { status: 'ACTIVE', deletedAt: null },
          ...dateFilter,
          ...locationFilter,
        },
      })
    }

    if (targetType === 'ALL_PRACTITIONERS') {
      return prisma.practitioner.count({
        where: {
          user: { status: 'ACTIVE', deletedAt: null },
          ...dateFilter,
          ...locationFilter,
        },
      })
    }

    if (targetType === 'ALL_USERS') {
      const [patients, practitioners] = await Promise.all([
        prisma.patient.count({
          where: {
            user: { status: 'ACTIVE', deletedAt: null },
            ...dateFilter,
            ...locationFilter,
          },
        }),
        prisma.practitioner.count({
          where: {
            user: { status: 'ACTIVE', deletedAt: null },
            ...dateFilter,
            ...locationFilter,
          },
        }),
      ])
      return patients + practitioners
    }

    if (targetType === 'CUSTOM') {
      let total = 0
      const types = targetUserTypes || []

      if (types.includes('PATIENT') || types.length === 0) {
        total += await prisma.patient.count({
          where: {
            user: { status: 'ACTIVE', deletedAt: null },
            ...dateFilter,
            ...locationFilter,
          },
        })
      }
      if (types.includes('PRACTITIONER') || types.length === 0) {
        total += await prisma.practitioner.count({
          where: {
            user: { status: 'ACTIVE', deletedAt: null },
            ...dateFilter,
            ...locationFilter,
          },
        })
      }
      return total
    }

    return 0
  }

  async getAvailableCities(): Promise<string[]> {
    const [patientCities, practitionerCities] = await Promise.all([
      prisma.patient.findMany({
        where: {
          city: { not: null },
          user: { status: 'ACTIVE', deletedAt: null },
        },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.practitioner.findMany({
        where: { user: { status: 'ACTIVE', deletedAt: null } },
        select: { city: true },
        distinct: ['city'],
      }),
    ])

    const cities = new Set<string>()
    patientCities.forEach((p) => {
      if (p.city) cities.add(p.city)
    })
    practitionerCities.forEach((p) => {
      if (p.city) cities.add(p.city)
    })

    return Array.from(cities).sort()
  }

  private async getRecipients(
    input: CreateCampaignInput,
  ): Promise<
    Array<{ email: string; patientId?: string; practitionerId?: string }>
  > {
    const recipients: Array<{
      email: string
      patientId?: string
      practitionerId?: string
    }> = []

    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (input.targetRegisteredFrom) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        gte: new Date(input.targetRegisteredFrom),
      }
    }
    if (input.targetRegisteredTo) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: new Date(input.targetRegisteredTo),
      }
    }

    const locationFilter =
      input.targetLocations && input.targetLocations.length > 0
        ? { city: { in: input.targetLocations, mode: 'insensitive' as const } }
        : {}

    const shouldIncludePatients =
      input.targetType === 'ALL_PATIENTS' ||
      input.targetType === 'ALL_USERS' ||
      (input.targetType === 'CUSTOM' &&
        ((input.targetUserTypes || []).includes('PATIENT') ||
          (input.targetUserTypes || []).length === 0))

    const shouldIncludePractitioners =
      input.targetType === 'ALL_PRACTITIONERS' ||
      input.targetType === 'ALL_USERS' ||
      (input.targetType === 'CUSTOM' &&
        ((input.targetUserTypes || []).includes('PRACTITIONER') ||
          (input.targetUserTypes || []).length === 0))

    if (shouldIncludePatients) {
      const patients = await prisma.patient.findMany({
        where: {
          user: { status: 'ACTIVE', deletedAt: null },
          ...dateFilter,
          ...locationFilter,
        },
        select: { id: true, user: { select: { email: true } } },
      })
      patients.forEach((p) => {
        recipients.push({ email: p.user.email, patientId: p.id })
      })
    }

    if (shouldIncludePractitioners) {
      const practitioners = await prisma.practitioner.findMany({
        where: {
          user: { status: 'ACTIVE', deletedAt: null },
          ...dateFilter,
          ...locationFilter,
        },
        select: { id: true, user: { select: { email: true } } },
      })
      practitioners.forEach((p) => {
        recipients.push({ email: p.user.email, practitionerId: p.id })
      })
    }

    return recipients
  }

  async createAndSendCampaign(input: CreateCampaignInput) {
    const recipients = await this.getRecipients(input)

    if (recipients.length === 0) {
      throw new Error(
        'Aucun destinataire trouvé pour les critères sélectionnés',
      )
    }

    const isScheduled =
      !!input.scheduledAt && new Date(input.scheduledAt) > new Date()

    const campaign = await prisma.campaign.create({
      data: {
        title: input.title,
        description: `Message groupé - ${input.messageType}`,
        message: input.message,
        messageType: input.messageType,
        targetType: input.targetType as any,
        targetUserTypes: input.targetUserTypes || [],
        targetLocations: input.targetLocations || [],
        targetRegisteredFrom: input.targetRegisteredFrom
          ? new Date(input.targetRegisteredFrom)
          : null,
        targetRegisteredTo: input.targetRegisteredTo
          ? new Date(input.targetRegisteredTo)
          : null,
        channels: input.channels,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: isScheduled ? 'ACTIVE' : 'COMPLETED',
        totalRecipients: recipients.length,
        createdBy: input.createdBy,
        recipients: {
          create: recipients.map((r) => ({
            email: r.email,
            patientId: r.patientId ?? undefined,
            practitionerId: r.practitionerId ?? undefined,
          })),
        },
      },
    })

    if (!isScheduled && input.channels.includes('EMAIL')) {
      // send email now
      await this.sendCampaignEmails(
        campaign.id,
        input.title,
        input.message,
        input.messageType,
      )
    }

    return campaign
  }

  private async sendCampaignEmails(
    campaignId: string,
    subject: string,
    message: string,
    messageType: string,
  ) {
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId, sent: false },
    })

    let sentCount = 0
    let failedCount = 0

    const html = this.buildCampaignEmailHtml(subject, message, messageType)

    for (const recipient of recipients) {
      try {
        await sendEmail(recipient.email, subject, html)
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { sent: true, sentAt: new Date() },
        })
        sentCount++
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { error: errorMessage },
        })
        failedCount++
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentAt: new Date(),
        sentCount,
        failedCount,
        status: 'COMPLETED',
      },
    })
  }

  private buildCampaignEmailHtml(
    subject: string,
    message: string,
    messageType: string,
  ): string {
    const typeColors: Record<
      string,
      { bg: string; border: string; text: string }
    > = {
      INFO: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
      WARNING: { bg: '#fff5e6', border: '#ff8200', text: '#b35900' },
      URGENT: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      MAINTENANCE: { bg: '#f8fafc', border: '#64748b', text: '#334155' },
    }
    const colors = typeColors[messageType] || typeColors.INFO

    const typeLabels: Record<string, string> = {
      INFO: 'Information',
      WARNING: 'Avertissement',
      URGENT: 'Urgent',
      MAINTENANCE: 'Maintenance',
    }

    const escapedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')

    const accentColor = colors.border

    return buildEmailHtml({
      title: subject,
      preheader: typeLabels[messageType] || messageType,
      contentHtml: `
        <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
          <strong style="color: ${colors.text}; font-size: 14px;">${typeLabels[messageType] || messageType}</strong>
        </div>
        <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">${subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
        <div style="color: #334155; line-height: 1.6; font-size: 15px;">
          ${escapedMessage}
        </div>
      `,
      accentColor,
    })
  }

  async getCampaigns(filters: CampaignListFilters) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }
    if (filters.messageType) {
      where.messageType = filters.messageType
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { recipients: true },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ])

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getCampaignById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          orderBy: { sentAt: 'desc' },
          include: {
            patient: { select: { firstName: true, lastName: true } },
            practitioner: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { recipients: true },
        },
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    return campaign
  }
}

export const campaignsService = new CampaignsService()
