import prisma from '../../config/database'
import {
  TeleconsultationStatus,
  QueueStatus,
  AuditAction,
} from '@prisma/client'
import { randomUUID } from 'crypto'
import {
  sendNoShowEmail,
  sendAutoNoShowPractitionerNotification,
  sendPractitionerAbsentNotification,
} from '../../utils/email'

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
    scheduledAt.setUTCHours(h, m, 0, 0)

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

  async joinSession(sessionId: string, userId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        practitioner: { include: { user: { select: { id: true } } } },
      },
    })

    if (!session) throw new Error('Session non trouvée')

    // verify authorization by ownership (do not rely on caller's role label)
    const isPatientOwner = session.patient?.user?.id === userId
    const isPractitionerOwner = session.practitioner?.user?.id === userId
    if (!isPatientOwner && !isPractitionerOwner) {
      throw new Error('Non autorisé')
    }
    const determinedRole: 'patient' | 'practitioner' = isPatientOwner
      ? 'patient'
      : 'practitioner'

    // check time: allow joining up to 24 hours before/after to handle client-server timezone shifts and scheduling delays
    const now = new Date()
    const scheduledAt = new Date(session.scheduledAt)
    const appointmentRecord = await prisma.appointment.findUnique({
      where: { id: session.appointmentId },
      select: { duration: true },
    })
    const appointmentDuration = appointmentRecord?.duration || 30

    const earlyJoinLimit = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000)
    const lateJoinLimit = new Date(
      scheduledAt.getTime() + (appointmentDuration + 24 * 60) * 60 * 1000,
    )

    if (now < earlyJoinLimit) {
      throw new Error("La téléconsultation n'est pas encore accessible")
    }
    if (now > lateJoinLimit) {
      throw new Error('La période de la téléconsultation est expirée')
    }

    const updateData: any = {}

    if (determinedRole === 'patient') {
      updateData.patientJoinedAt = now
    } else {
      updateData.practitionerJoinedAt = now
    }

    // if session was COMPLETED or FAILED, allow rejoin by resetting status
    if (session.status === 'COMPLETED' || session.status === 'FAILED') {
      updateData.status = 'WAITING'
      updateData.endedAt = null
      // reset the appointment status back so it can be used again
      await prisma.appointment.update({
        where: { id: session.appointmentId },
        data: {
          status: 'CONFIRMED',
          markedAsNoShow: false,
          noShowMarkedAt: null,
        },
      })
    } else if (session.status === 'SCHEDULED') {
      // first person to join, set status to waiting
      updateData.status = 'WAITING'
    }

    const updated = await prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: updateData,
    })

    // check if both are now in the session
    const bothJoined =
      (determinedRole === 'patient' && session.practitionerJoinedAt) ||
      (determinedRole === 'practitioner' && session.patientJoinedAt) ||
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
        metadata: { event: 'joined', role: determinedRole },
      },
    })

    return updated
  }

  async endSession(sessionId: string, userId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        practitioner: { include: { user: { select: { id: true } } } },
      },
    })

    if (!session) throw new Error('Session non trouvée')

    const isPatientOwner = session.patient?.user?.id === userId
    const isPractitionerOwner = session.practitioner?.user?.id === userId
    if (!isPatientOwner && !isPractitionerOwner) {
      throw new Error('Non autorisé')
    }

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

    // do not mark the appointment as completed here.
    // appointment stays confirmed so both parties can rejoin
    // within the time iof appoiontùent.  appointment will be marked completed
    // when the time of appointment expires (via cleanupExpiredSessions).

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

  async markNoShow(sessionId: string, userId: string) {
    const session = await prisma.teleconsultationSession.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: { include: { user: { select: { id: true } } } },
        patient: { include: { user: { select: { id: true } } } },
      },
    })

    if (!session) throw new Error('Session non trouvée')
    // both patient and practitioner can mark no-show
    const isPractitioner = session.practitioner.user.id === userId
    const isPatient = session.patient.user.id === userId
    if (!isPractitioner && !isPatient) {
      throw new Error('Non autorisé')
    }

    const noShowMessage = isPractitioner
      ? 'Patient absent (no-show)'
      : 'Praticien absent (no-show)'

    // noshow status if patient is absent and failed status if practitioner absent
    const sessionStatus = isPractitioner ? 'NO_SHOW' : 'FAILED'

    const updated = await prisma.teleconsultationSession.update({
      where: { id: sessionId },
      data: {
        status: sessionStatus as TeleconsultationStatus,
        endedAt: new Date(),
        errorMessage: noShowMessage,
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
        userId,
        action: 'UPDATE' as AuditAction,
        resource: 'TeleconsultationSession',
        resourceId: sessionId,
        metadata: {
          event: 'no_show',
          markedBy: isPractitioner ? 'practitioner' : 'patient',
        },
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
        in: [
          'COMPLETED',
          'FAILED',
          'NO_SHOW',
          'CANCELLED',
        ] as TeleconsultationStatus[],
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

    // find sessions that are still scheduled or waiting past the appointment end time
    const expiredSessions = await prisma.teleconsultationSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'WAITING'] },
      },
      include: {
        appointment: {
          select: {
            id: true,
            duration: true,
            startTime: true,
            endTime: true,
            appointmentDate: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            noShowCount: true,
            user: { select: { id: true, email: true } },
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    })

    for (const session of expiredSessions) {
      // calculate appointment end time
      const aptDate = new Date(
        session.appointment?.appointmentDate || session.scheduledAt,
      )
      const endTimeParts = (session.appointment?.endTime || '')
        .split(':')
        .map(Number)
      const endH = endTimeParts[0] || 0
      const endM = endTimeParts[1] || 0
      aptDate.setHours(endH, endM, 0, 0)

      // only process if appointment end time has passed
      if (now <= aptDate) continue

      const patientJoined = !!session.patientJoinedAt
      const practitionerJoined = !!session.practitionerJoinedAt

      let errorMessage = ''
      let sessionStatus: TeleconsultationStatus = 'FAILED'
      let appointmentStatus: 'NO_SHOW' | 'CANCELLED' = 'NO_SHOW'
      let isPatientNoShow = false

      if (!patientJoined && practitionerJoined) {
        // patient didnt join but practitioner did so patient noshow
        errorMessage =
          'Patient absent - absence détectée automatiquement par le système'
        sessionStatus = 'NO_SHOW'
        appointmentStatus = 'NO_SHOW'
        isPatientNoShow = true
      } else if (patientJoined && !practitionerJoined) {
        // practitioner didnt join so practitioner's fault, no patient noshow
        errorMessage =
          "Praticien absent - le praticien ne s'est pas connecté à la téléconsultation"
        sessionStatus = 'FAILED'
        appointmentStatus = 'CANCELLED'
      } else if (!patientJoined && !practitionerJoined) {
        // both didnt join so cancel
        errorMessage =
          "Aucun participant ne s'est connecté - consultation annulée automatiquement"
        sessionStatus = 'FAILED'
        appointmentStatus = 'CANCELLED'
      }

      if (!errorMessage) continue

      await prisma.teleconsultationSession.update({
        where: { id: session.id },
        data: {
          status: sessionStatus,
          endedAt: now,
          errorMessage,
        },
      })

      // mark appointment status
      await prisma.appointment.update({
        where: { id: session.appointmentId },
        data: {
          status: appointmentStatus,
          markedAsNoShow: isPatientNoShow,
          noShowMarkedAt: isPatientNoShow ? now : null,
        },
      })

      //  increment patient noshow count when patient is responsible
      if (isPatientNoShow) {
        const newNoShowCount = ((session.patient as any).noShowCount || 0) + 1
        await prisma.patient.update({
          where: { id: session.patient.id },
          data: { noShowCount: { increment: 1 } },
        })

        // send noshow email
        const patientEmail = (session.patient as any).user?.email
        if (patientEmail) {
          const practitioner = session.practitioner as any
          try {
            await sendNoShowEmail(patientEmail, {
              patientName: `${(session.patient as any).firstName} ${(session.patient as any).lastName}`,
              practitionerTitle: practitioner.title || 'Dr.',
              practitionerFirstName: practitioner.firstName,
              practitionerLastName: practitioner.lastName,
              appointmentDate: new Date(session.scheduledAt).toLocaleDateString(
                'fr-FR',
              ),
              appointmentTime: session.appointment?.startTime || '',
              noShowCount: newNoShowCount,
            })
          } catch (e) {
            console.error('Failed to send no-show email:', e)
          }
        }

        //  notify practitioner about autodetected noshow
        const practitionerEmail = (session.practitioner as any).user?.email
        if (practitionerEmail) {
          const practitioner = session.practitioner as any
          try {
            await sendAutoNoShowPractitionerNotification(practitionerEmail, {
              practitionerName: `${practitioner.title || 'Dr.'} ${practitioner.firstName} ${practitioner.lastName}`,
              patientFirstName: (session.patient as any).firstName,
              patientLastName: (session.patient as any).lastName,
              appointmentDate: new Date(session.scheduledAt).toLocaleDateString(
                'fr-FR',
              ),
              appointmentTime: session.appointment?.startTime || '',
              noShowCount: newNoShowCount,
            })
          } catch (e) {
            console.error(
              'Failed to send practitioner no-show notification:',
              e,
            )
          }
        }
      }

      // notify patient when practitioner didnt show up
      if (!isPatientNoShow && appointmentStatus === 'CANCELLED') {
        const patientEmail = (session.patient as any).user?.email
        if (patientEmail) {
          const practitioner = session.practitioner as any
          try {
            await sendPractitionerAbsentNotification(patientEmail, {
              patientName: `${(session.patient as any).firstName} ${(session.patient as any).lastName}`,
              practitionerTitle: practitioner.title || 'Dr.',
              practitionerFirstName: practitioner.firstName,
              practitionerLastName: practitioner.lastName,
              appointmentDate: new Date(session.scheduledAt).toLocaleDateString(
                'fr-FR',
              ),
              appointmentTime: session.appointment?.startTime || '',
            })
          } catch (e) {
            console.error('Failed to send practitioner-absent notification:', e)
          }
        }
      }
    }

    // finalize completed sessions of which the appointment end time has passed
    // these are sessions where endSession was called but appointment was kept CONFIRMED
    // so users could rejoin. now check if patient actually joined.
    const completedSessions = await prisma.teleconsultationSession.findMany({
      where: {
        status: 'COMPLETED',
        endedAt: { not: null },
      },
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
            duration: true,
            startTime: true,
            endTime: true,
            appointmentDate: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            noShowCount: true,
            user: { select: { id: true, email: true } },
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    })

    for (const session of completedSessions) {
      // Only process if appointment is still CONFIRMED (not yet finalized)
      if (
        session.appointment?.status !== 'CONFIRMED' &&
        session.appointment?.status !== 'PENDING'
      )
        continue

      //  appointment end time
      const aptDate = new Date(
        session.appointment?.appointmentDate || session.scheduledAt,
      )
      const endTimeParts = (session.appointment?.endTime || '')
        .split(':')
        .map(Number)
      const endH = endTimeParts[0] || 0
      const endM = endTimeParts[1] || 0
      aptDate.setHours(endH, endM, 0, 0)

      // if past the appointment end time, finalize
      if (now > aptDate) {
        // if patient never joined but practitioner did and ended session > patient noshow
        if (!session.patientJoinedAt && session.practitionerJoinedAt) {
          await prisma.teleconsultationSession.update({
            where: { id: session.id },
            data: {
              status: 'NO_SHOW',
              errorMessage:
                'Patient absent - absence détectée automatiquement par le système',
            },
          })

          const newNoShowCount = ((session.patient as any).noShowCount || 0) + 1
          await prisma.appointment.update({
            where: { id: session.appointmentId },
            data: {
              status: 'NO_SHOW',
              markedAsNoShow: true,
              noShowMarkedAt: now,
            },
          })

          await prisma.patient.update({
            where: { id: session.patient.id },
            data: { noShowCount: { increment: 1 } },
          })

          // send noshow email to patient
          const patientEmail = (session.patient as any).user?.email
          if (patientEmail) {
            try {
              await sendNoShowEmail(patientEmail, {
                patientName: `${(session.patient as any).firstName} ${(session.patient as any).lastName}`,
                practitionerTitle: (session.practitioner as any).title || 'Dr.',
                practitionerFirstName: (session.practitioner as any).firstName,
                practitionerLastName: (session.practitioner as any).lastName,
                appointmentDate: new Date(
                  session.scheduledAt,
                ).toLocaleDateString('fr-FR'),
                appointmentTime: session.appointment?.startTime || '',
                noShowCount: newNoShowCount,
              })
            } catch (e) {
              console.error('Failed to send no-show email:', e)
            }
          }

          // also notify practitioner
          const practitionerEmail = (session.practitioner as any).user?.email
          if (practitionerEmail) {
            try {
              await sendAutoNoShowPractitionerNotification(practitionerEmail, {
                practitionerName: `${(session.practitioner as any).title || 'Dr.'} ${(session.practitioner as any).firstName} ${(session.practitioner as any).lastName}`,
                patientFirstName: (session.patient as any).firstName,
                patientLastName: (session.patient as any).lastName,
                appointmentDate: new Date(
                  session.scheduledAt,
                ).toLocaleDateString('fr-FR'),
                appointmentTime: session.appointment?.startTime || '',
                noShowCount: newNoShowCount,
              })
            } catch (e) {
              console.error(
                'Failed to send practitioner no-show notification:',
                e,
              )
            }
          }
        } else {
          // both joined and session was completed normally > mark completed
          await prisma.appointment.update({
            where: { id: session.appointmentId },
            data: { status: 'COMPLETED' },
          })
        }
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

    const allAppointments = await prisma.appointment.findMany({
      where,
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
            roomName: true,
            status: true,
            scheduledAt: true,
            startedAt: true,
            endedAt: true,
            duration: true,
          },
        },
      },
    })

    // for upcoming rdv exclude todays appointments whose time has already passed
    //  appointment is considered past if current time is more than 30 min after end time
    const filtered =
      status === 'upcoming'
        ? allAppointments.filter((apt) => {
            const aptDate = new Date(apt.appointmentDate)
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const aptStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`

            if (aptStr === todayStr) {
              // for todays appointments, use endTime + 30 min grace period
              const [eh, em] = apt.endTime.split(':').map(Number)
              const appointmentEnd = new Date(aptDate)
              appointmentEnd.setHours(eh, em, 0, 0)
              // keep if still within the rejoin window (endTime + 30 min)
              return now.getTime() <= appointmentEnd.getTime() + 30 * 60 * 1000
            }
            return true // future dates always included
          })
        : allAppointments

    const total = filtered.length
    const skip = (page - 1) * limit
    const paginated = filtered.slice(skip, skip + limit)

    return {
      data: paginated.map((apt) => ({
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
