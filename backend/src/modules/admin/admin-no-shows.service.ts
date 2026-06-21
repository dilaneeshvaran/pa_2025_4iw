import prisma from '../../config/database'
import { sendEmail, buildEmailHtml } from '../../utils/email'

const APP_URL = process.env.BACKEND_FRONTEND_URL || 'http://localhost:3000'

interface NoShowFilters {
  search?: string
  minNoShows?: number
  status?: 'banned' | 'warned' | 'normal'
  dateFrom?: string
  dateTo?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export class AdminNoShowsService {
  async getNoShowPatients(filters: NoShowFilters) {
    const {
      search,
      minNoShows = 0,
      status,
      dateFrom,
      dateTo,
      sortOrder = 'desc',
      page = 1,
      limit = 15,
    } = filters

    const now = new Date()

    const where: any = {
      noShowCount: { gt: 0 },
    }

    if (minNoShows > 0) {
      where.noShowCount = { gte: minNoShows }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status === 'banned') {
      where.penaltyUntil = { gt: now }
    } else if (status === 'warned') {
      where.warningCount = { gt: 0 }
      where.OR = [
        ...(where.OR || []),
        { penaltyUntil: null },
        { penaltyUntil: { lte: now } },
      ]
      // combine search with status to filter
      if (search) {
        const searchOr = where.OR
        delete where.OR
        where.AND = [
          { OR: searchOr },
          {
            warningCount: { gt: 0 },
            OR: [{ penaltyUntil: null }, { penaltyUntil: { lte: now } }],
          },
        ]
      }
    } else if (status === 'normal') {
      where.warningCount = 0
      where.OR = [
        ...(where.OR || []),
        { penaltyUntil: null },
        { penaltyUntil: { lte: now } },
      ]
      if (search) {
        const searchOr = where.OR
        delete where.OR
        delete where.warningCount
        where.AND = [
          { OR: searchOr },
          {
            warningCount: 0,
            OR: [{ penaltyUntil: null }, { penaltyUntil: { lte: now } }],
          },
        ]
      }
    }

    // total appointments and noshow appointments with date filter
    const dateFilter: any = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo)
    }

    const skip = (page - 1) * limit

    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          noShowCount: true,
          penaltyUntil: true,
          penaltyReason: true,
          warningCount: true,
          lastWarningAt: true,
          bannedAt: true,
          user: { select: { email: true } },
          _count: {
            select: {
              appointments: {
                where:
                  dateFrom || dateTo
                    ? { appointmentDate: dateFilter }
                    : undefined,
              },
            },
          },
        },
        orderBy: { noShowCount: sortOrder },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ])

    // get the noshow appointments for each patient abd count with date filter
    const patientsWithStats = await Promise.all(
      patients.map(async (patient) => {
        const noShowAppointmentsWhere: any = {
          patientId: patient.id,
          status: 'NO_SHOW',
        }
        if (dateFrom || dateTo) {
          noShowAppointmentsWhere.appointmentDate = dateFilter
        }

        const noShowInPeriod = await prisma.appointment.count({
          where: noShowAppointmentsWhere,
        })

        const totalAppointments = patient._count.appointments
        const attendanceRate =
          totalAppointments > 0
            ? Math.round(
                ((totalAppointments - noShowInPeriod) / totalAppointments) *
                  100,
              )
            : 100

        let patientStatus: 'banned' | 'warned' | 'normal' = 'normal'
        if (patient.penaltyUntil && patient.penaltyUntil > now) {
          patientStatus = 'banned'
        } else if (patient.warningCount > 0) {
          patientStatus = 'warned'
        }

        return {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.user.email,
          totalAppointments,
          noShows: patient.noShowCount,
          noShowsInPeriod: noShowInPeriod,
          attendanceRate,
          status: patientStatus,
          penaltyUntil: patient.penaltyUntil,
          penaltyReason: patient.penaltyReason,
          warningCount: patient.warningCount,
          lastWarningAt: patient.lastWarningAt,
          bannedAt: patient.bannedAt,
        }
      }),
    )

    return {
      patients: patientsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  }

  async getPatientNoShowHistory(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        noShowCount: true,
        penaltyUntil: true,
        penaltyReason: true,
        warningCount: true,
        lastWarningAt: true,
        bannedAt: true,
        user: { select: { email: true } },
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED'] },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        type: true,
        reason: true,
        markedAsNoShow: true,
        noShowMarkedAt: true,
        practitioner: {
          select: {
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      take: 50,
    })

    const now = new Date()
    let status: 'banned' | 'warned' | 'normal' = 'normal'
    if (patient.penaltyUntil && patient.penaltyUntil > now) {
      status = 'banned'
    } else if (patient.warningCount > 0) {
      status = 'warned'
    }

    return {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.user.email,
        noShowCount: patient.noShowCount,
        warningCount: patient.warningCount,
        lastWarningAt: patient.lastWarningAt,
        penaltyUntil: patient.penaltyUntil,
        penaltyReason: patient.penaltyReason,
        bannedAt: patient.bannedAt,
        status,
      },
      appointments,
    }
  }

  async sendWarning(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        noShowCount: true,
        user: { select: { email: true } },
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        warningCount: { increment: 1 },
        lastWarningAt: new Date(),
      },
    })

    const html = buildEmailHtml({
      title: 'Avertissement - Absences répétées - MediCôte',
      preheader: 'Avertissement officiel concernant vos absences répétées.',
      contentHtml: `
        <div style="background-color: #fff9db; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
          <strong style="color: #8f6b00; font-size: 14px;">⚠️ Avertissement officiel</strong>
        </div>
        <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Avertissement - Absences répétées</h2>
        <p style="margin: 0 0 16px 0;">Bonjour ${patient.firstName} ${patient.lastName},</p>
        <p style="margin: 0 0 16px 0;">Nous avons constaté que vous avez accumulé <strong>${patient.noShowCount} absence(s)</strong> à vos rendez-vous programmés sur MediCôte.</p>
        <p style="margin: 0 0 16px 0;">Les absences non justifiées ont un impact sur l'organisation des praticiens et empêchent d'autres patients de bénéficier de créneaux disponibles.</p>
        <p style="margin: 0 0 24px 0; font-weight: bold; color: #b35900;">En cas de nouvelle absence non justifiée, l'accès à votre compte pourra faire l'objet d'une suspension temporaire.</p>
        
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Si vous pensez qu'il s'agit d'une erreur, merci de nous contacter.
        </p>
      `,
      actionUrl: `${APP_URL}/patient/appointments`,
      actionText: 'Voir mes rendez-vous',
      accentColor: '#ff8200',
    })

    await sendEmail(
      patient.user.email,
      'Avertissement - Absences répétées - MediCôte',
      html,
    )

    return updated
  }

  async banPatient(patientId: string, durationDays: number, reason: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    const penaltyUntil = new Date()
    penaltyUntil.setDate(penaltyUntil.getDate() + durationDays)

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        penaltyUntil,
        penaltyReason: reason,
        bannedAt: new Date(),
      },
    })

    const formattedDate = penaltyUntil.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = buildEmailHtml({
      title: 'Suspension de votre compte - MediCôte',
      preheader: 'Notification temporaire de suspension de compte.',
      contentHtml: `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
          <strong style="color: #991b1b; font-size: 14px;">🚫 Compte temporairement suspendu</strong>
        </div>
        <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Suspension de compte</h2>
        <p style="margin: 0 0 16px 0;">Bonjour ${patient.firstName} ${patient.lastName},</p>
        <p style="margin: 0 0 20px 0;">En raison d'absences répétées non justifiées à vos rendez-vous, l'accès à la prise de rendez-vous sur votre compte a été suspendu temporairement :</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 45%; vertical-align: top;">Motif :</td>
              <td style="padding: 6px 0; color: #334155;">${reason}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Durée de suspension :</td>
              <td style="padding: 6px 0; color: #334155;">${durationDays} jour(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Date de fin :</td>
              <td style="padding: 6px 0; color: #dc2626; font-weight: bold;">Le ${formattedDate}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 16px 0; color: #dc2626; font-weight: 500;">Pendant toute cette période, il vous sera impossible de réserver de nouveaux rendez-vous sur la plateforme.</p>
        
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Si vous souhaitez contester cette décision ou si vous pensez qu'il s'agit d'une erreur, vous pouvez contacter notre service d'assistance.
        </p>
      `,
      accentColor: '#dc2626',
    })

    await sendEmail(
      patient.user.email,
      'Suspension de votre compte - MediCôte',
      html,
    )

    return updated
  }

  async liftSanction(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        penaltyUntil: null,
        penaltyReason: null,
        bannedAt: null,
      },
    })

    const html = buildEmailHtml({
      title: 'Levée de suspension de votre compte - MediCôte',
      preheader: 'L\'accès complet à votre compte MediCôte a été rétabli.',
      contentHtml: `
        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
          <strong style="color: #065f46; font-size: 14px;">✅ Suspension levée</strong>
        </div>
        <h2 style="color: #1e293b; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Accès rétabli</h2>
        <p style="margin: 0 0 16px 0;">Bonjour ${patient.firstName} ${patient.lastName},</p>
        <p style="margin: 0 0 16px 0;">Nous vous informons que la suspension temporaire de votre compte a été levée.</p>
        <p style="margin: 0 0 20px 0;">Vous pouvez désormais de nouveau planifier et prendre des rendez-vous en ligne avec vos praticiens sur MediCôte.</p>
        
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Nous vous encourageons à honorer vos futurs rendez-vous ou à les annuler à l'avance en cas d'imprévu afin d'éviter d'autres sanctions.
        </p>
      `,
      actionUrl: `${APP_URL}/patient/appointments`,
      actionText: 'Prendre un rendez-vous',
      accentColor: '#009a44',
    })

    await sendEmail(
      patient.user.email,
      'Levée de suspension de votre compte - MediCôte',
      html,
    )

    return updated
  }
}

export const adminNoShowsService = new AdminNoShowsService()
