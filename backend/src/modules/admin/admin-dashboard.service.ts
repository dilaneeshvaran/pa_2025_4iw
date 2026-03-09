import prisma from '../../config/database'

export class AdminDashboardService {
  async getDashboardData() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    )

    // last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      unpaidSubscriptions,
      noShowPatients,
      newPatientsThisMonth,
      newPractitionersThisMonth,
      patientsLast6Months,
      practitionersLast6Months,
      appointmentsThisMonth,
    ] = await Promise.all([
      // unpaid subscriptions
      prisma.subscription.findMany({
        where: {
          OR: [
            { status: { not: 'ACTIVE' } },
            { currentPeriodEnd: { lt: now } },
          ],
        },
        include: {
          practitioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      // patients with noshows
      prisma.patient.findMany({
        where: { noShowCount: { gt: 0 } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          noShowCount: true,
          penaltyUntil: true,
          user: { select: { email: true } },
        },
        orderBy: { noShowCount: 'desc' },
        take: 5,
      }),

      // new patient this month
      prisma.patient.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // new practitioner this month
      prisma.practitioner.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // new patients per month for last 6 months
      this.getMonthlyCountsForLast6Months('patient', sixMonthsAgo, now),

      // new practitioners per month for last 6 months
      this.getMonthlyCountsForLast6Months('practitioner', sixMonthsAgo, now),

      // appointments this month with status
      prisma.appointment.groupBy({
        by: ['status'],
        where: {
          appointmentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _count: { id: true },
      }),
    ])

    const appointmentStats = {
      total: 0,
      confirmed: 0,
      cancelled: 0,
      noShows: 0,
    }
    for (const group of appointmentsThisMonth) {
      const count = group._count.id
      appointmentStats.total += count
      if (group.status === 'CONFIRMED' || group.status === 'COMPLETED') {
        appointmentStats.confirmed += count
      } else if (group.status === 'CANCELLED') {
        appointmentStats.cancelled += count
      } else if (group.status === 'NO_SHOW') {
        appointmentStats.noShows += count
      }
    }

    return {
      unpaidSubscriptions: unpaidSubscriptions.map((sub) => ({
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        practitioner: {
          id: sub.practitioner.id,
          firstName: sub.practitioner.firstName,
          lastName: sub.practitioner.lastName,
          phone: sub.practitioner.phone,
          email: sub.practitioner.user.email,
        },
      })),
      noShowPatients: noShowPatients.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.user.email,
        noShowCount: p.noShowCount,
        penaltyUntil: p.penaltyUntil,
      })),
      newPatientsThisMonth,
      newPractitionersThisMonth,
      patientsLast6Months,
      practitionersLast6Months,
      appointmentStats,
    }
  }

  private async getMonthlyCountsForLast6Months(
    model: 'patient' | 'practitioner',
    from: Date,
    to: Date,
  ) {
    const months: { month: string; count: number }[] = []
    const current = new Date(from)

    while (current <= to) {
      const start = new Date(current.getFullYear(), current.getMonth(), 1)
      const end = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      )

      const count =
        model === 'patient'
          ? await prisma.patient.count({
              where: { createdAt: { gte: start, lte: end } },
            })
          : await prisma.practitioner.count({
              where: { createdAt: { gte: start, lte: end } },
            })

      const label = start.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      })
      months.push({ month: label, count })

      current.setMonth(current.getMonth() + 1)
    }

    return months
  }
}

export const adminDashboardService = new AdminDashboardService()
