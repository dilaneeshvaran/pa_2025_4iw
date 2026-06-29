import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

// `plan` and `status` are free-form strings in the schema; we constrain the
// values the admin UI can set so the data stays consistent.
export const SUBSCRIPTION_PLANS = ['FREE', 'PREMIUM', 'PRO'] as const
export const SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'CANCELLED',
  'SUSPENDED',
  'EXPIRED',
] as const

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

interface SubscriptionFilters {
  search?: string
  status?: string
  plan?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface AdminSubscriptionDto {
  id: string
  practitionerId: string
  practitionerName: string
  email: string | null
  title: string | null
  city: string | null
  plan: string
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

const practitionerInclude = {
  practitioner: {
    select: {
      firstName: true,
      lastName: true,
      title: true,
      city: true,
      user: { select: { email: true } },
    },
  },
} satisfies Prisma.SubscriptionInclude

type SubscriptionWithPractitioner = Prisma.SubscriptionGetPayload<{
  include: typeof practitionerInclude
}>

function toDto(sub: SubscriptionWithPractitioner): AdminSubscriptionDto {
  const p = sub.practitioner
  const fullName = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim()

  return {
    id: sub.id,
    practitionerId: sub.practitionerId,
    practitionerName: fullName || '-',
    email: p?.user?.email ?? null,
    title: p?.title ?? null,
    city: p?.city ?? null,
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  }
}

export class AdminSubscriptionsService {
  async getSubscriptions(filters: SubscriptionFilters) {
    const {
      search,
      status,
      plan,
      sortOrder = 'desc',
      page = 1,
      limit = 15,
    } = filters

    const where: Prisma.SubscriptionWhereInput = {}

    if (status) where.status = status
    if (plan) where.plan = plan

    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const }
      where.practitioner = {
        OR: [
          { firstName: contains },
          { lastName: contains },
          { user: { email: contains } },
        ],
      }
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const skip = (Math.max(page, 1) - 1) * safeLimit

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: practitionerInclude,
        orderBy: { createdAt: sortOrder },
        skip,
        take: safeLimit,
      }),
      prisma.subscription.count({ where }),
    ])

    return {
      subscriptions: subscriptions.map(toDto),
      pagination: {
        page: Math.max(page, 1),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async getStats() {
    const now = new Date()
    const [total, active, cancelled, suspended, scheduledCancel, expired] =
      await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'CANCELLED' } }),
        prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
        prisma.subscription.count({ where: { cancelAtPeriodEnd: true } }),
        prisma.subscription.count({
          where: { currentPeriodEnd: { lt: now } },
        }),
      ])

    return { total, active, cancelled, suspended, scheduledCancel, expired }
  }

  async getById(id: string): Promise<AdminSubscriptionDto> {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: practitionerInclude,
    })

    if (!sub) {
      throw new Error('Subscription not found')
    }

    return toDto(sub)
  }

  async update(
    id: string,
    data: {
      plan?: string
      status?: string
      cancelAtPeriodEnd?: boolean
    },
  ): Promise<AdminSubscriptionDto> {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!sub) {
      throw new Error('Subscription not found')
    }

    const updateData: Prisma.SubscriptionUpdateInput = {}
    if (data.plan !== undefined) updateData.plan = data.plan
    if (data.status !== undefined) updateData.status = data.status
    if (data.cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd
    }

    await prisma.subscription.update({ where: { id }, data: updateData })

    return this.getById(id)
  }
}

export const adminSubscriptionsService = new AdminSubscriptionsService()
