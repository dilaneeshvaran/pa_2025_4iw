import prisma from '../../config/database'
import {
  TeleconsultationStatus,
  QueueStatus,
  AuditAction,
} from '@prisma/client'
import { randomUUID } from 'crypto'

export class TeleconsultationsService {
  private formatSessionItem(session: any) {
    return {
      id: session.id,
      appointmentId: session.appointmentId,
      patientId: session.patientId,
      patientName: `${session.patient.firstName} ${session.patient.lastName}`,
      startTime: session.appointment.startTime,
      endTime: session.appointment.endTime,
      scheduledAt: session.scheduledAt.toISOString(),
      status: session.status,
      reason: session.appointment.reason,
      duration: session.duration,
      connectionQuality: session.connectionQuality,
      joinedAt: session.patientJoinedAt?.toISOString() || null,
      roomId: session.roomId,
      roomName: session.roomName,
    }
  }

  async createSession(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        teleconsultationSession: true,
      },
    })

    if (!appointment) throw new Error('Rendez-vous non trouvé')
    if (appointment.type !== 'TELECONSULTATION')
      throw new Error("Ce rendez-vous n'est pas une téléconsultation")
    if (appointment.teleconsultationSession)
      return appointment.teleconsultationSession

    const roomId = randomUUID()
    const roomName = `telecons-${appointment.id.slice(0, 8)}-${Date.now()}`

    const scheduledAt = new Date(appointment.appointmentDate)
    const [h, m] = appointment.startTime.split(':').map(Number)
    scheduledAt.setHours(h, m, 0, 0)

    return prisma.teleconsultationSession.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        practitionerId: appointment.practitionerId,
        roomId,
        roomName,
        status: 'SCHEDULED',
        scheduledAt,
      },
    })
  }

  async getSessionByAppointment(appointmentId: string) {
    return prisma.teleconsultationSession.findUnique({
      where: { appointmentId },
      include: {
        appointment: true,
        patient: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            title: true,
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
              take: 1,
            },
          },
        },
      },
    })
  }

  async getSessionByRoomId(roomId: string) {
    return prisma.teleconsultationSession.findUnique({
      where: { roomId },
      include: {
        appointment: true,
        patient: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    })
  }

  async joinSession(
    sessionId: string,
    userId: string,
    role: 'patient' | 'practitioner',
  ) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        practitioner: { include: { user: { select: { id: true } } } },
      },
    })

    if (!session) throw new Error('Session non trouvée')

    // verify authorization
    if (role === 'patient' && session.patient.user.id !== userId) {
      throw new Error('Non autorisé')
    }
    if (role === 'practitioner' && session.practitioner.user.id !== userId) {
      throw new Error('Non autorisé')
    }

    // check time : 15 min before to 30 min after scheduled end
    const now = new Date()
    const scheduledAt = new Date(session.scheduledAt)
    const appointmentRecord = await prisma.appointment.findUnique({
      where: { id: session.appointmentId },
      select: { duration: true },
    })
    const appointmentDuration = appointmentRecord?.duration || 30

    const earlyJoinLimit = new Date(scheduledAt.getTime() - 15 * 60 * 1000)
    const lateJoinLimit = new Date(
      scheduledAt.getTime() + (appointmentDuration + 30) * 60 * 1000,
    )

    if (now < earlyJoinLimit) {
      throw new Error("La téléconsultation n'est pas encore accessible")
    }
    if (now > lateJoinLimit) {
      throw new Error('La période de la téléconsultation est expirée')
    }

    const updateData: any = {}

    if (role === 'patient') {
      updateData.patientJoinedAt = now
    } else {
      updateData.practitionerJoinedAt = now
    }

    // if first person to join, set status to waiting
    // if both join, set status to in_progres
    if (session.status === 'SCHEDULED') {
      updateData.status = 'WAITING'
    }

    const updated = await prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: updateData,
    })

    // check if both are now in the session
    const bothJoined =
      (role === 'patient' && session.practitionerJoinedAt) ||
      (role === 'practitioner' && session.patientJoinedAt) ||
      (updated.patientJoinedAt && updated.practitionerJoinedAt)

    if (bothJoined && updated.status !== 'IN_PROGRESS') {
      const waitingTime = updated.patientJoinedAt
        ? Math.floor(
            (now.getTime() - new Date(updated.patientJoinedAt).getTime()) /
              1000,
          )
        : 0

      await prisma.teleconsultationSession.update({
        where: { id: sessionId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: now,
          waitingRoomTime: waitingTime,
        },
      })
    }

    // audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'READ' as AuditAction,
        resource: 'TeleconsultationSession',
        resourceId: sessionId,
        metadata: { event: 'joined', role },
      },
    })

    return updated
  }

  async endSession(sessionId: string, userId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) throw new Error('Session non trouvée')

    const now = new Date()
    const duration = session.startedAt
      ? Math.floor(
          (now.getTime() - new Date(session.startedAt).getTime()) / (1000 * 60),
        )
      : 0

    const updated = await prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: now,
        duration,
      },
    })

    // mark  appointment as completed
    await prisma.appointment.update({
      where: { id: session.appointmentId },
      data: { status: 'COMPLETED' },
    })

    // audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE' as AuditAction,
        resource: 'TeleconsultationSession',
        resourceId: sessionId,
        metadata: { event: 'ended', duration },
      },
    })

    return updated
  }

  async markNoShow(sessionId: string, practitionerUserId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: { include: { user: { select: { id: true } } } },
      },
    })

    if (!session) throw new Error('Session non trouvée')
    if (session.practitioner.user.id !== practitionerUserId) {
      throw new Error('Non autorisé')
    }

    const updated = await prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        errorMessage: 'Patient absent (no-show)',
      },
    })

    // mark appointment as no show
    await prisma.appointment.update({
      where: { id: session.appointmentId },
      data: {
        status: 'NO_SHOW',
        markedAsNoShow: true,
        noShowMarkedAt: new Date(),
      },
    })

    // log
    await prisma.auditLog.create({
      data: {
        userId: practitionerUserId,
        action: 'UPDATE' as AuditAction,
        resource: 'TeleconsultationSession',
        resourceId: sessionId,
        metadata: { event: 'no_show' },
      },
    })

    return updated
  }

  async updateConnectionQuality(
    sessionId: string,
    quality: 'good' | 'medium' | 'poor',
  ) {
    return prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: { connectionQuality: quality },
    })
  }

  //  todays teleconsultation for practitioner
  async getTodaySessions(practitionerId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sessions = await prisma.teleconsultationSession.findMany({
      where: {
        practitionerId,
        scheduledAt: { gte: today, lt: tomorrow },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            reason: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
          },
        },
      },
    })

    return sessions.map((s) => this.formatSessionItem(s))
  }

  //  waiting patients for  practitioner today
  async getWaitingPatients(practitionerId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sessions = await prisma.teleconsultationSession.findMany({
      where: {
        practitionerId,
        scheduledAt: { gte: today, lt: tomorrow },
        status: 'WAITING',
        patientJoinedAt: { not: null },
      },
      orderBy: { patientJoinedAt: 'asc' },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            reason: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    return sessions.map((s) => this.formatSessionItem(s))
  }

  //  past teleconsultation sessions for  practitioner
  async getPastSessions(
    practitionerId: string,
    period: 'week' | 'month' = 'week',
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
  ) {
    const now = new Date()
    const startDate = new Date()

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }

    const where: any = {
      practitionerId,
      scheduledAt: { gte: startDate, lte: now },
      status: {
        in: ['COMPLETED', 'FAILED', 'CANCELLED'] as TeleconsultationStatus[],
      },
    }

    if (status && status !== 'all') {
      where.status = status as TeleconsultationStatus
    }

    if (search) {
      where.patient = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const skip = (page - 1) * limit

    const [sessions, total] = await Promise.all([
      prisma.teleconsultationSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              reason: true,
              status: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.teleconsultationSession.count({ where }),
    ])

    return {
      data: sessions.map((s) => this.formatSessionItem(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // get all teleconsultation history /with filters
  async getHistory(
    practitionerId: string,
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = {
      practitionerId,
    }

    if (status && status !== 'all') {
      where.status = status as TeleconsultationStatus
    }

    if (dateFrom || dateTo) {
      where.scheduledAt = {}
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        where.scheduledAt.lte = to
      }
    }

    if (search) {
      where.patient = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const skip = (page - 1) * limit

    const [sessions, total] = await Promise.all([
      prisma.teleconsultationSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              reason: true,
              status: true,
              consultationFee: true,
            },
          },
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
      prisma.teleconsultationSession.count({ where }),
    ])

    return {
      data: sessions.map((s) => this.formatSessionItem(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  //  session summary (post call)
  async getSessionSummary(sessionId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            reason: true,
            status: true,
            consultationFee: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
              take: 1,
            },
          },
        },
      },
    })

    if (!session) throw new Error('Session non trouvée')

    return {
      id: session.id,
      roomId: session.roomId,
      status: session.status,
      scheduledAt: session.scheduledAt,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      waitingRoomTime: session.waitingRoomTime,
      connectionQuality: session.connectionQuality,
      errorMessage: session.errorMessage,
      appointment: session.appointment,
      patient: session.patient,
      practitioner: {
        ...session.practitioner,
        specialty: session.practitioner.specialties[0]?.specialty.name || null,
      },
    }
  }

  // log for a session
  async getSessionAuditLog(sessionId: string) {
    return prisma.auditLog.findMany({
      where: {
        resource: 'TeleconsultationSession',
        resourceId: sessionId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { email: true, role: true },
        },
      },
    })
  }

  // auto create sessions for upcoming teleconsultation appointments
  // called periodically or at appointment creation
  async ensureSessionsForUpcomingAppointments(practitionerId?: string) {
    const now = new Date()
    const lookAhead = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour ahead

    const where: any = {
      type: 'TELECONSULTATION',
      status: { in: ['PENDING', 'CONFIRMED'] },
      appointmentDate: {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
      teleconsultationSession: null,
    }

    if (practitionerId) {
      where.practitionerId = practitionerId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      take: 50,
    })

    const created = []
    for (const apt of appointments) {
      try {
        const session = await this.createSession(apt.id)
        created.push(session)
      } catch {
        // skip if session already exists or error
      }
    }

    return created
  }

  // cleanup expired sessions grace
  async cleanupExpiredSessions() {
    const now = new Date()

    // find sessions that are still scheduled or waitingg past grace period
    const expiredSessions = await prisma.teleconsultationSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'WAITING'] },
        scheduledAt: {
          lt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min grace
        },
      },
      include: {
        appointment: { select: { duration: true } },
      },
    })

    for (const session of expiredSessions) {
      const scheduledEnd = new Date(
        session.scheduledAt.getTime() +
          ((session.appointment?.duration || 30) + 30) * 60 * 1000, // duration + 30 min grace
      )

      if (now > scheduledEnd) {
        await prisma.teleconsultationSession.update({
          where: { id: session.id },
          data: {
            status: 'FAILED',
            endedAt: now,
            errorMessage: 'Session expirée - aucun participant',
          },
        })
      }
    }
  }

  // get patients teleconsultation appointments
  async getPatientTeleconsultations(
    patientId: string,
    status: 'upcoming' | 'past' = 'upcoming',
    limit = 10,
    page = 1,
  ) {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const skip = (page - 1) * limit

    const where: any = {
      patientId,
      type: 'TELECONSULTATION',
    }

    if (status === 'upcoming') {
      where.appointmentDate = { gte: today }
      where.status = { in: ['PENDING', 'CONFIRMED'] }
    } else {
      where.OR = [
        { status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED'] } },
        { appointmentDate: { lt: today } },
      ]
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appointmentDate: status === 'upcoming' ? 'asc' : 'desc',
        },
        include: {
          practitioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              specialties: {
                where: { isPrimary: true },
                include: { specialty: true },
                take: 1,
              },
            },
          },
          teleconsultationSession: {
            select: {
              id: true,
              roomId: true,
              status: true,
              scheduledAt: true,
              startedAt: true,
              endedAt: true,
              duration: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ])

    return {
      data: appointments.map((apt) => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        reason: apt.reason,
        consultationFee: Number(apt.consultationFee),
        practitioner: {
          id: apt.practitioner.id,
          firstName: apt.practitioner.firstName,
          lastName: apt.practitioner.lastName,
          title: apt.practitioner.title,
          specialty: apt.practitioner.specialties[0]?.specialty.name || null,
        },
        teleconsultationSession: apt.teleconsultationSession,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

export const teleconsultationsService = new TeleconsultationsService()
