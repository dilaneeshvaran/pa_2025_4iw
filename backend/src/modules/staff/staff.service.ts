import prisma from '../../config/database'
import { AppointmentType, AppointmentStatus } from '@prisma/client'
import { normalizeEmail } from '../../utils/normalize-email'
import {
  cancelAppointmentReminders,
  scheduleAppointmentReminders,
} from '../../utils/reminder-scheduler'

class StaffService {
  async getStaffByUserId(userId: string) {
    const staff = await prisma.staff.findUnique({
      where: { userId },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        cabinet: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
      },
    })
    if (!staff) {
      throw new Error('Profil personnel non trouvé')
    }
    return staff
  }

  async getDashboard(userId: string) {
    const staff = await this.getStaffByUserId(userId)

    // Get practitioners this staff can manage
    const practitioners = await this.getAssignedPractitioners(staff)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const practitionerIds = practitioners.map((p) => p.id)

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        practitionerId: { in: practitionerIds },
        appointmentDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
        practitioner: {
          select: { firstName: true, lastName: true, title: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return {
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        position: staff.position,
        canManageAppointments: staff.canManageAppointments,
      },
      assignedTo: staff.cabinet
        ? {
            type: 'cabinet' as const,
            name: staff.cabinet.name,
            address: staff.cabinet.address,
            city: staff.cabinet.city,
            phone: staff.cabinet.phone,
          }
        : staff.practitioner
          ? {
              type: 'practitioner' as const,
              name: `${staff.practitioner.title} ${staff.practitioner.firstName} ${staff.practitioner.lastName}`,
              address: staff.practitioner.address,
              city: staff.practitioner.city,
              phone: staff.practitioner.phone,
            }
          : null,
      practitioners,
      todayAppointmentsCount: todayAppointments.length,
      todayAppointments: todayAppointments.map((apt) => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        practitionerName: `${apt.practitioner.title} ${apt.practitioner.firstName} ${apt.practitioner.lastName}`,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      })),
    }
  }

  async getAssignedPractitioners(
    staff: Awaited<ReturnType<typeof this.getStaffByUserId>>,
  ) {
    // If staff is assigned to a cabinet, they can manage all practitioners in that cabinet
    if (staff.cabinetId) {
      const cabinetPractitioners = await prisma.cabinetPractitioner.findMany({
        where: { cabinetId: staff.cabinetId, leftAt: null },
        include: {
          practitioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              phone: true,
              specialties: {
                include: { specialty: true },
              },
            },
          },
        },
      })

      return cabinetPractitioners.map((cp) => ({
        id: cp.practitioner.id,
        firstName: cp.practitioner.firstName,
        lastName: cp.practitioner.lastName,
        title: cp.practitioner.title,
        phone: cp.practitioner.phone,
        specialties: cp.practitioner.specialties.map((s) => s.specialty.name),
      }))
    }

    // If staff is assigned to a single practitioner
    if (staff.practitionerId && staff.practitioner) {
      return [
        {
          id: staff.practitioner.id,
          firstName: staff.practitioner.firstName,
          lastName: staff.practitioner.lastName,
          title: staff.practitioner.title,
          phone: '',
          specialties: [] as string[],
        },
      ]
    }

    return []
  }

  async getPractitioners(userId: string) {
    const staff = await this.getStaffByUserId(userId)
    return this.getAssignedPractitioners(staff)
  }

  async getPractitionerAppointments(
    userId: string,
    practitionerId: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const staff = await this.getStaffByUserId(userId)

    // Verify access
    const practitioners = await this.getAssignedPractitioners(staff)
    const hasAccess = practitioners.some((p) => p.id === practitionerId)
    if (!hasAccess) {
      throw new Error("Vous n'avez pas accès aux rendez-vous de ce praticien")
    }

    const where: Record<string, unknown> = { practitionerId }

    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.appointmentDate = { gte: start, lte: end }
    } else if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.appointmentDate = { gte: start, lt: end }
    }

    return prisma.appointment.findMany({
      where,
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
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    })
  }

  async bookAppointment(
    userId: string,
    practitionerId: string,
    data: {
      patientId: string
      appointmentDate: string
      startTime: string
      endTime: string
      type: string
      reason?: string
    },
  ) {
    const staff = await this.getStaffByUserId(userId)

    if (!staff.canManageAppointments) {
      throw new Error("Vous n'avez pas la permission de gérer les rendez-vous")
    }

    // Verify access to this practitioner
    const practitioners = await this.getAssignedPractitioners(staff)
    const hasAccess = practitioners.some((p) => p.id === practitionerId)
    if (!hasAccess) {
      throw new Error("Vous n'avez pas accès à ce praticien")
    }

    // Get practitioner for consultation fee
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
    })

    if (!practitioner) {
      throw new Error('Praticien non trouvé')
    }

    const startParts = data.startTime.split(':').map(Number)
    const endParts = data.endTime.split(':').map(Number)
    const duration =
      (endParts[0] - startParts[0]) * 60 + (endParts[1] - startParts[1])

    return prisma.appointment.create({
      data: {
        patientId: data.patientId,
        practitionerId,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        type: data.type as AppointmentType,
        status: AppointmentStatus.CONFIRMED,
        reason: data.reason || null,
        consultationFee: practitioner.baseConsultationFee,
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
    })
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const staff = await this.getStaffByUserId(userId)

    if (!staff.canManageAppointments) {
      throw new Error("Vous n'avez pas la permission de gérer les rendez-vous")
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé')
    }

    // Verify access
    const practitioners = await this.getAssignedPractitioners(staff)
    const hasAccess = practitioners.some(
      (p) => p.id === appointment.practitionerId,
    )
    if (!hasAccess) {
      throw new Error("Vous n'avez pas accès à ce rendez-vous")
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'STAFF',
        cancellationReason: 'Annulé par le personnel',
      },
    })

    await cancelAppointmentReminders(appointmentId)

    return updated
  }

  async moveAppointment(
    userId: string,
    appointmentId: string,
    data: {
      newDate: string
      newStartTime: string
      newEndTime: string
    },
  ) {
    const staff = await this.getStaffByUserId(userId)

    if (!staff.canManageAppointments) {
      throw new Error("Vous n'avez pas la permission de gérer les rendez-vous")
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé')
    }

    // Verify access
    const practitioners = await this.getAssignedPractitioners(staff)
    const hasAccess = practitioners.some(
      (p) => p.id === appointment.practitionerId,
    )
    if (!hasAccess) {
      throw new Error("Vous n'avez pas accès à ce rendez-vous")
    }

    const startParts = data.newStartTime.split(':').map(Number)
    const endParts = data.newEndTime.split(':').map(Number)
    const duration =
      (endParts[0] - startParts[0]) * 60 + (endParts[1] - startParts[1])

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: new Date(data.newDate),
        startTime: data.newStartTime,
        endTime: data.newEndTime,
        duration,
        status: AppointmentStatus.RESCHEDULED,
      },
    })

    try {
      await cancelAppointmentReminders(appointmentId)
      await scheduleAppointmentReminders(
        appointmentId,
        new Date(data.newDate),
        data.newStartTime,
      )
    } catch (remError) {
      console.error('Failed to reschedule reminders:', remError)
    }

    return updated
  }

  async searchPatients(userId: string, practitionerId: string, query: string) {
    const staff = await this.getStaffByUserId(userId)

    const practitioners = await this.getAssignedPractitioners(staff)
    const hasAccess = practitioners.some((p) => p.id === practitionerId)
    if (!hasAccess) {
      throw new Error("Vous n'avez pas accès à ce praticien")
    }

    return prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
      take: 10,
    })
  }

  async getStaffProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    if (!user || !user.staff) {
      throw new Error('Profil personnel introuvable')
    }

    return {
      email: user.email,
      firstName: user.staff.firstName,
      lastName: user.staff.lastName,
      phone: user.staff.phone,
    }
  }

  async updateStaffProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staff: true },
    })

    if (!user || !user.staff) {
      throw new Error('Profil personnel introuvable')
    }

    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone

    await prisma.staff.update({
      where: { userId },
      data: updateData,
    })

    return this.getStaffProfile(userId)
  }

  async updateStaffEmail(
    userId: string,
    data: { newEmail: string; password: string },
  ) {
    const normalizedEmail = normalizeEmail(data.newEmail)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new Error('Utilisateur introuvable')
    }

    const { comparePassword } = await import('../../utils/bcrypt')
    const valid = await comparePassword(data.password, user.password)
    if (!valid) {
      throw new Error('Mot de passe incorrect')
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })
    if (existing && existing.id !== userId) {
      throw new Error('Cet email est déjà utilisé')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail, emailVerified: null },
    })

    return { message: 'Email mis à jour avec succès' }
  }

  async updateStaffPassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new Error('Utilisateur introuvable')
    }

    const { comparePassword, hashPassword } = await import('../../utils/bcrypt')
    const valid = await comparePassword(data.currentPassword, user.password)
    if (!valid) {
      throw new Error('Mot de passe actuel incorrect')
    }

    const hashed = await hashPassword(data.newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    return { message: 'Mot de passe mis à jour avec succès' }
  }
}

export const staffService = new StaffService()
