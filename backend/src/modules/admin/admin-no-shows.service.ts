import prisma from '../../config/database'
import { sendEmail } from '../../utils/email'

const APP_URL = process.env.BACKEND_APP_URL || 'http://localhost:3000'

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Avertissement - Absences répétées</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">MediCôte</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #e65100; margin-top: 0;">⚠️ Avertissement — Absences répétées</h2>
            <p>Bonjour ${patient.firstName} ${patient.lastName},</p>
            <p>Nous avons constaté que vous avez accumulé <strong>${patient.noShowCount} absence(s)</strong> à vos rendez-vous sur MediCôte.</p>
            <p>Les absences non justifiées ont un impact sur l'organisation des praticiens et empêchent d'autres patients de bénéficier de créneaux disponibles.</p>
            <p><strong>Ceci est un avertissement officiel.</strong> En cas de récidive, votre compte pourrait être temporairement suspendu.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, merci de nous contacter.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes rendez-vous</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail(
      patient.user.email,
      'Avertissement — Absences répétées - MediCôte',
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Suspension de compte</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">MediCôte</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #c62828; margin-top: 0;">🚫 Compte suspendu</h2>
            <p>Bonjour ${patient.firstName} ${patient.lastName},</p>
            <p>Suite à des absences répétées à vos rendez-vous, votre compte a été temporairement suspendu.</p>
            <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Motif :</strong> ${reason}</p>
              <p style="margin: 8px 0;"><strong>Durée :</strong> ${durationDays} jour(s)</p>
              <p style="margin: 8px 0;"><strong>Suspension effective jusqu'au :</strong> ${formattedDate}</p>
            </div>
            <p>Pendant cette période, vous ne pourrez pas prendre de nouveaux rendez-vous.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, merci de nous contacter.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
          </div>
        </body>
      </html>
    `

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Levée de suspension</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">MediCôte</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #2e7d32; margin-top: 0;">✅ Suspension levée</h2>
            <p>Bonjour ${patient.firstName} ${patient.lastName},</p>
            <p>Nous vous informons que la suspension de votre compte a été levée.</p>
            <p>Vous pouvez désormais reprendre vos rendez-vous sur MediCôte.</p>
            <p>Nous vous encourageons à honorer vos futurs rendez-vous pour éviter de nouvelles sanctions.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/patient/appointments" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Prendre un rendez-vous</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail(
      patient.user.email,
      'Levée de suspension de votre compte - MediCôte',
      html,
    )

    return updated
  }
}

export const adminNoShowsService = new AdminNoShowsService()
