import prisma from '../../config/database'
import { AppointmentStatus, AppointmentType } from '@prisma/client'
import type { DashboardData } from './practitioners-dashboard.types'

export class PractitionerDashboardService {
  //get all dashboard data in one go for efficiency
  async getDashboardData(practitionerId: string): Promise<DashboardData> {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    )

    const [
      monthlyAppointments,
      monthlyRevenue,
      noShowCount,
      newPatientsCount,
      nextAppointment,
      todayAppointments,
      waitingTeleconsultations,
      recentMessages,
      todos,
    ] = await Promise.all([
      // consultations this month (completed + confirmed + pending)
      prisma.appointment.count({
        where: {
          practitionerId,
          appointmentDate: { gte: monthStart, lte: monthEnd },
          status: {
            in: [
              AppointmentStatus.COMPLETED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.PENDING,
            ],
          },
        },
      }),

      // revenue this month
      prisma.payment.aggregate({
        where: {
          practitionerId,
          status: 'COMPLETED',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // no show count this month (for presence rate)
      prisma.appointment.count({
        where: {
          practitionerId,
          appointmentDate: { gte: monthStart, lte: monthEnd },
          status: AppointmentStatus.NO_SHOW,
        },
      }),

      // new patients this month (first appointment with this practitioner)
      this.getNewPatientsCount(practitionerId, monthStart, monthEnd),

      // next upcoming appointment
      prisma.appointment.findFirst({
        where: {
          practitionerId,
          appointmentDate: { gte: today },
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
        },
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),

      // today appointments
      prisma.appointment.findMany({
        where: {
          practitionerId,
          appointmentDate: { gte: today, lt: tomorrow },
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        orderBy: { startTime: 'asc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),

      // patients waiting for teleconsultation
      prisma.virtualQueue.count({
        where: {
          practitionerId,
          status: 'WAITING',
        },
      }),

      // recent messages (last 5 unread conversations)
      this.getRecentMessages(practitionerId),

      // uncompleted todos
      prisma.practitionerTodo.findMany({
        where: {
          practitionerId,
          completed: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // calculate attendance rate
    const totalRelevant = monthlyAppointments + noShowCount
    const attendanceRate =
      totalRelevant > 0
        ? Math.round(((totalRelevant - noShowCount) / totalRelevant) * 100)
        : 100

    return {
      consultationsThisMonth: monthlyAppointments,
      revenue: Number(monthlyRevenue._sum.amount || 0),
      attendanceRate,
      newPatients: newPatientsCount,
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            appointmentDate: nextAppointment.appointmentDate,
            startTime: nextAppointment.startTime,
            endTime: nextAppointment.endTime,
            type: nextAppointment.type,
            status: nextAppointment.status,
            reason: nextAppointment.reason,
            patient: nextAppointment.patient,
          }
        : null,
      todayAppointments: todayAppointments.map((apt) => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        reason: apt.reason,
        patient: apt.patient,
      })),
      waitingTeleconsultations: waitingTeleconsultations,
      recentMessages,
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
      })),
    }
  }

  private async getNewPatientsCount(
    practitionerId: string,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<number> {
    // patients whose first ever appointment with this practitioner is within this month
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT a."patientId") as count
      FROM appointments a
      WHERE a."practitionerId" = ${practitionerId}
        AND a."appointmentDate" >= ${monthStart}
        AND a."appointmentDate" <= ${monthEnd}
        AND a.status != 'CANCELLED'
        AND NOT EXISTS (
          SELECT 1 FROM appointments a2
          WHERE a2."patientId" = a."patientId"
            AND a2."practitionerId" = ${practitionerId}
            AND a2."appointmentDate" < ${monthStart}
            AND a2.status != 'CANCELLED'
        )
    `
    return Number(result[0]?.count || 0)
  }

  private async getRecentMessages(practitionerId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { userId: true },
    })

    if (!practitioner) return []

    const conversations = await prisma.conversation.findMany({
      where: { practitionerId },
      orderBy: { lastMessageAt: 'desc' },
      take: 5,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderUserId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    return conversations
      .filter((c) => c.messages.length > 0)
      .map((c) => {
        const lastMsg = c.messages[0]!
        return {
          conversationId: c.id,
          patientName: `${c.patient.firstName} ${c.patient.lastName}`,
          lastMessage: lastMsg.content.substring(0, 80),
          isFromPatient: lastMsg.senderUserId !== practitioner.userId,
          unread:
            lastMsg.senderUserId !== practitioner.userId &&
            lastMsg.status !== 'READ',
          createdAt: lastMsg.createdAt,
        }
      })
  }

  // todo crud

  async createTodo(practitionerId: string, title: string) {
    return prisma.practitionerTodo.create({
      data: { practitionerId, title },
    })
  }

  async toggleTodo(practitionerId: string, todoId: string) {
    const todo = await prisma.practitionerTodo.findFirst({
      where: { id: todoId, practitionerId },
    })
    if (!todo) throw new Error('Todo not found')

    return prisma.practitionerTodo.update({
      where: { id: todoId },
      data: {
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date() : null,
      },
    })
  }

  async deleteTodo(practitionerId: string, todoId: string) {
    const todo = await prisma.practitionerTodo.findFirst({
      where: { id: todoId, practitionerId },
    })
    if (!todo) throw new Error('Todo not found')

    return prisma.practitionerTodo.delete({ where: { id: todoId } })
  }
}

export const practitionerDashboardService = new PractitionerDashboardService()
