import prisma from '../../config/database'
import { AppointmentStatus, AppointmentType } from '@prisma/client'
import type { DashboardData } from './practitioners-dashboard.types'
import { UpdateBillingConfigInput } from './practitioners-dashboard.schema'
import { decrypt } from '../../utils/crypto'

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

    // auto mark NO_SHOW for appointments 3+ hours past their start time
    await this.autoMarkNoShow(practitionerId, now)

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

      // revenue this month (only for appointments where patient was present)
      prisma.payment.aggregate({
        where: {
          practitionerId,
          status: 'COMPLETED',
          paidAt: { gte: monthStart, lte: monthEnd },
          appointment: {
            status: AppointmentStatus.COMPLETED,
          },
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

      // patients waiting for teleconsultation (today only)
      prisma.virtualQueue.count({
        where: {
          practitionerId,
          status: 'WAITING',
          checkInTime: { gte: today, lt: tomorrow },
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
        let messagePreview = lastMsg.content.substring(0, 80)
        try {
          const decrypted = decrypt(lastMsg.content)
          messagePreview = decrypted.substring(0, 80)
        } catch {
          // fallback to raw content if decryption fails
        }
        return {
          conversationId: c.id,
          patientName: c.patient
            ? `${c.patient.firstName} ${c.patient.lastName}`
            : 'Patient Inconnu',
          lastMessage: messagePreview,
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

  // auto- mark appointments as NO_SHOW if 3+ hours have passed
  //since the scheduled start time and the doctor hasnt marked them.

  private async autoMarkNoShow(
    practitionerId: string,
    now: Date,
  ): Promise<void> {
    // find confirmed/pending appointments whose start time is 3+ hours ago
    const overdueAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        appointmentDate: { lte: now },
      },
    })

    const toMarkIds: string[] = []
    for (const apt of overdueAppointments) {
      const aptDate = new Date(apt.appointmentDate)
      const [hours, minutes] = apt.startTime.split(':').map(Number)
      aptDate.setHours(hours, minutes, 0, 0)
      // if 3 hours have elapsed since the appointment start time
      if (now.getTime() - aptDate.getTime() >= 3 * 60 * 60 * 1000) {
        toMarkIds.push(apt.id)
      }
    }

    if (toMarkIds.length > 0) {
      await prisma.appointment.updateMany({
        where: { id: { in: toMarkIds } },
        data: {
          status: AppointmentStatus.NO_SHOW,
          markedAsNoShow: true,
          noShowMarkedAt: now,
        },
      })
    }
  }

  async getBillingConfig(practitionerId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: {
        baseConsultationFee: true,
        teleconsultationFee: true,
        emergencyFee: true,
        acceptedPaymentMethods: true,
        bankInfo: true,
      },
    })

    if (!practitioner) throw new Error('Practitioner not found')

    return {
      baseConsultationFee: Number(practitioner.baseConsultationFee),
      teleconsultationFee: practitioner.teleconsultationFee
        ? Number(practitioner.teleconsultationFee)
        : null,
      emergencyFee: practitioner.emergencyFee
        ? Number(practitioner.emergencyFee)
        : null,
      acceptedPaymentMethods: practitioner.acceptedPaymentMethods,
      bankInfo: practitioner.bankInfo,
    }
  }

  async updateBillingConfig(
    practitionerId: string,
    data: UpdateBillingConfigInput,
  ) {
    const updateData: any = {}

    if (data.baseConsultationFee !== undefined) {
      updateData.baseConsultationFee = data.baseConsultationFee
    }
    if (data.teleconsultationFee !== undefined) {
      updateData.teleconsultationFee = data.teleconsultationFee
    }
    if (data.emergencyFee !== undefined) {
      updateData.emergencyFee = data.emergencyFee
    }
    if (data.acceptedPaymentMethods !== undefined) {
      updateData.acceptedPaymentMethods = data.acceptedPaymentMethods
    }
    if (data.bankInfo !== undefined) {
      updateData.bankInfo = data.bankInfo
    }

    const updated = await prisma.practitioner.update({
      where: { id: practitionerId },
      data: updateData,
      select: {
        baseConsultationFee: true,
        teleconsultationFee: true,
        emergencyFee: true,
        acceptedPaymentMethods: true,
        bankInfo: true,
      },
    })

    return {
      baseConsultationFee: Number(updated.baseConsultationFee),
      teleconsultationFee: updated.teleconsultationFee
        ? Number(updated.teleconsultationFee)
        : null,
      emergencyFee: updated.emergencyFee ? Number(updated.emergencyFee) : null,
      acceptedPaymentMethods: updated.acceptedPaymentMethods,
      bankInfo: updated.bankInfo,
    }
  }

  async getProfile(practitionerId: string) {
    const p = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      include: { qualifications: true },
    })
    if (!p) throw new Error('Not found')
    return {
      id: p.id,
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      phone: p.phone,
      bio: p.bio,
      languages: p.languages,
      photoUrl: p.photoUrl,
      address: p.address,
      city: p.city,
      postalCode: p.postalCode,
      country: p.country,
      isProfilePublic: p.isProfilePublic,
      baseConsultationFee: p.baseConsultationFee
        ? Number(p.baseConsultationFee)
        : null,
      teleconsultationFee: p.teleconsultationFee
        ? Number(p.teleconsultationFee)
        : null,
      emergencyFee: p.emergencyFee ? Number(p.emergencyFee) : null,
      qualifications: p.qualifications,
    }
  }

  async updateProfile(practitionerId: string, data: any) {
    const { qualifications, isProfilePublic, ...rest } = data

    // validate tarifs are defined if trying to make profile public
    if (isProfilePublic === true) {
      const practitioner = await prisma.practitioner.findUnique({
        where: { id: practitionerId },
        select: {
          baseConsultationFee: true,
          teleconsultationFee: true,
          emergencyFee: true,
        },
      })

      if (!practitioner || !practitioner.baseConsultationFee) {
        throw new Error(
          'Vous devez définir au moins le tarif de consultation de base avant de rendre votre profil public',
        )
      }
    }

    if (qualifications) {
      await prisma.qualification.deleteMany({ where: { practitionerId } })
      for (const q of qualifications) {
        await prisma.qualification.create({
          data: {
            practitionerId,
            title: q.title,
            institution: q.institution,
            yearObtained: q.yearObtained,
          },
        })
      }
    }

    const updateData: any = { ...rest }
    if (isProfilePublic !== undefined) {
      updateData.isProfilePublic = isProfilePublic
    }

    const p = await prisma.practitioner.update({
      where: { id: practitionerId },
      data: updateData,
      include: { qualifications: true },
    })
    return {
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      phone: p.phone,
      bio: p.bio,
      languages: p.languages,
      photoUrl: p.photoUrl,
      isProfilePublic: p.isProfilePublic,
      qualifications: p.qualifications,
    }
  }

  async getSubscription(practitionerId: string) {
    let sub = await prisma.subscription.findUnique({
      where: { practitionerId },
    })
    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          practitionerId,
          plan: 'PREMIUM',
          status: 'ACTIVE',
        },
      })
    }
    return sub
  }

  async cancelSubscription(practitionerId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { practitionerId },
    })
    if (!sub) throw new Error('Not found')
    return prisma.subscription.update({
      where: { practitionerId },
      data: { cancelAtPeriodEnd: true },
    })
  }
}

export const practitionerDashboardService = new PractitionerDashboardService()
