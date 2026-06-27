import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

interface MonthBucket {
  key: string
  label: string
}

// last `count` months, oldest first, as { key: 'YYYY-MM', label: 'janv. 25' }
function buildMonths(count: number): MonthBucket[] {
  const now = new Date()
  const months: MonthBucket[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    })
  }
  return months
}

function monthKey(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value) : 0
}

export class AdminStatisticsService {
  async getStatistics() {
    const months = buildMonths(12)
    const rangeStart = new Date()
    rangeStart.setMonth(rangeStart.getMonth() - 11, 1)
    rangeStart.setHours(0, 0, 0, 0)
    const now = new Date()

    const [
      totalUsers,
      usersByRole,
      cabinets,
      totalAppointments,
      appointmentsByStatus,
      completedRevenue,
      reviewAgg,
      activeSubscriptions,
      subscriptionsByPlan,
      patientDates,
      practitionerDates,
      appointmentRows,
      paymentRows,
      specialtyGroups,
      cityGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.cabinet.count(),
      prisma.appointment.count(),
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true, refundedAmount: true },
      }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.groupBy({ by: ['plan'], _count: { id: true } }),

      // raw dates for in-JS monthly bucketing (one query each)
      prisma.patient.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.practitioner.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: rangeStart } },
        select: { appointmentDate: true, status: true },
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: rangeStart },
        },
        select: { createdAt: true, amount: true },
      }),

      prisma.practitionerSpecialty.groupBy({
        by: ['specialtyId'],
        _count: { practitionerId: true },
      }),
      prisma.practitioner.groupBy({
        by: ['city'],
        _count: { id: true },
      }),
    ])

    // ----- overview -----
    const roleCount = (role: string) =>
      usersByRole.find((r) => r.role === role)?._count.id ?? 0

    const apptStatusMap: Record<string, number> = {}
    let completedAppointments = 0
    for (const g of appointmentsByStatus) {
      apptStatusMap[g.status] = g._count.id
      if (g.status === 'COMPLETED') completedAppointments = g._count.id
    }

    const totalRevenue =
      toNumber(completedRevenue._sum.amount) -
      toNumber(completedRevenue._sum.refundedAmount)

    const overview = {
      totalUsers,
      patients: roleCount('PATIENT'),
      practitioners: roleCount('PRACTITIONER'),
      staff: roleCount('STAFF'),
      cabinetAdmins: roleCount('CABINET_ADMIN'),
      admins: roleCount('ADMIN'),
      cabinets,
      totalAppointments,
      completedAppointments,
      totalRevenue,
      currency: 'XOF',
      averageRating: reviewAgg._avg.rating
        ? Math.round(reviewAgg._avg.rating * 10) / 10
        : 0,
      totalReviews: reviewAgg._count.id,
      activeSubscriptions,
    }

    // ----- monthly series (bucketed in JS) -----
    const zero = () =>
      Object.fromEntries(months.map((m) => [m.key, 0])) as Record<
        string,
        number
      >

    const patientsByMonth = zero()
    for (const p of patientDates) {
      const k = monthKey(p.createdAt)
      if (patientsByMonth[k] != null) patientsByMonth[k]++
    }
    const practitionersByMonth = zero()
    for (const p of practitionerDates) {
      const k = monthKey(p.createdAt)
      if (practitionersByMonth[k] != null) practitionersByMonth[k]++
    }

    const apptTotalByMonth = zero()
    const apptCompletedByMonth = zero()
    for (const a of appointmentRows) {
      const k = monthKey(a.appointmentDate)
      if (apptTotalByMonth[k] != null) {
        apptTotalByMonth[k]++
        if (a.status === 'COMPLETED') apptCompletedByMonth[k]++
      }
    }

    const revenueByMonthMap = zero()
    for (const pay of paymentRows) {
      const k = monthKey(pay.createdAt)
      if (revenueByMonthMap[k] != null) {
        revenueByMonthMap[k] += toNumber(pay.amount)
      }
    }

    const usersGrowth = months.map((m) => ({
      label: m.label,
      patients: patientsByMonth[m.key],
      practitioners: practitionersByMonth[m.key],
    }))

    const appointmentsByMonth = months.map((m) => ({
      label: m.label,
      total: apptTotalByMonth[m.key],
      completed: apptCompletedByMonth[m.key],
    }))

    const revenueByMonth = months.map((m) => ({
      label: m.label,
      amount: Math.round(revenueByMonthMap[m.key]),
    }))

    // ----- distributions -----
    const appointmentStatusDistribution = appointmentsByStatus.map((g) => ({
      status: g.status,
      count: g._count.id,
    }))

    const subscriptionPlanDistribution = subscriptionsByPlan.map((g) => ({
      plan: g.plan,
      count: g._count.id,
    }))

    // resolve specialty names and take the top 8
    const specialtyIds = specialtyGroups.map((g) => g.specialtyId)
    const specialties = await prisma.specialty.findMany({
      where: { id: { in: specialtyIds } },
      select: { id: true, name: true },
    })
    const specialtyName = new Map(specialties.map((s) => [s.id, s.name]))
    const topSpecialties = specialtyGroups
      .map((g) => ({
        name: specialtyName.get(g.specialtyId) || 'Inconnu',
        count: g._count.practitionerId,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const topCities = cityGroups
      .map((g) => ({ city: g.city || 'Inconnu', count: g._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return {
      overview,
      usersGrowth,
      appointmentsByMonth,
      revenueByMonth,
      appointmentStatusDistribution,
      subscriptionPlanDistribution,
      topSpecialties,
      topCities,
      generatedAt: now,
    }
  }
}

export const adminStatisticsService = new AdminStatisticsService()
