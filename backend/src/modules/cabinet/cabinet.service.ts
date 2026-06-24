import prisma from '../../config/database'
import { UserRole, UserStatus, AppointmentStatus, AppointmentType } from '@prisma/client'
import { hashPassword } from '../../utils/bcrypt'
import { generateToken } from '../../utils/crypto'
import {
  sendStaffAccountCreatedEmail,
  sendCabinetInvitationEmail,
  sendCabinetLeaveAppointmentCancelledEmail,
} from '../../utils/email'
import { normalizeEmail } from '../../utils/normalize-email'

class CabinetService {
  async getCabinetByAdminUserId(userId: string) {
    const cabinet = await prisma.cabinet.findFirst({
      where: { adminUserId: userId },
    })
    if (!cabinet) {
      throw new Error('Cabinet non trouvé')
    }
    return cabinet
  }

  async getCabinetForStaffOrAdmin(userId: string) {
    const cabinet = await prisma.cabinet.findFirst({
      where: { adminUserId: userId },
    })
    if (cabinet) return cabinet

    const staff = await prisma.staff.findUnique({
      where: { userId },
      include: { cabinet: true },
    })
    if (staff?.cabinet) return staff.cabinet

    throw new Error('Cabinet non trouvé')
  }

  async getDashboard(userId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    const [practitioners, staffMembers, todayAppointments] = await Promise.all([
      prisma.cabinetPractitioner.findMany({
        where: { cabinetId: cabinet.id, leftAt: null },
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
      }),
      prisma.staff.findMany({
        where: { cabinetId: cabinet.id },
        include: {
          user: { select: { email: true, status: true } },
        },
      }),
      this.getTodayAppointmentsForCabinet(cabinet.id),
    ])

    return {
      cabinet: {
        id: cabinet.id,
        name: cabinet.name,
        address: cabinet.address,
        city: cabinet.city,
        phone: cabinet.phone,
      },
      practitionersCount: practitioners.length,
      staffCount: staffMembers.length,
      todayAppointmentsCount: todayAppointments.length,
      practitioners: practitioners.map((cp) => ({
        id: cp.practitioner.id,
        firstName: cp.practitioner.firstName,
        lastName: cp.practitioner.lastName,
        title: cp.practitioner.title,
        phone: cp.practitioner.phone,
        specialties: cp.practitioner.specialties.map((s) => s.specialty.name),
        joinedAt: cp.joinedAt,
      })),
      staffMembers: staffMembers.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        position: s.position,
        email: s.user.email,
        status: s.user.status,
      })),
    }
  }

  async getTodayAppointmentsForCabinet(cabinetId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const cabinetPractitioners = await prisma.cabinetPractitioner.findMany({
      where: { cabinetId, leftAt: null },
      select: { practitionerId: true },
    })

    const practitionerIds = cabinetPractitioners.map((cp) => cp.practitionerId)

    return prisma.appointment.findMany({
      where: {
        practitionerId: { in: practitionerIds },
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
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
  }

  async getCabinetInfo(userId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)
    return {
      id: cabinet.id,
      name: cabinet.name,
      address: cabinet.address,
      city: cabinet.city,
      country: cabinet.country,
      phone: cabinet.phone,
      openHours: cabinet.openHours,
      adminContactName: cabinet.adminContactName,
      adminContactEmail: cabinet.adminContactEmail,
      adminContactPhone: cabinet.adminContactPhone,
    }
  }

  async updateCabinetInfo(
    userId: string,
    data: {
      name?: string
      address?: string
      city?: string
      phone?: string
      openHours?: Record<string, unknown>
    },
  ) {
    const cabinet = await this.getCabinetByAdminUserId(userId)
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.openHours !== undefined)
      updateData.openHours = data.openHours as any
    return prisma.cabinet.update({
      where: { id: cabinet.id },
      data: updateData as any,
    })
  }

  async getPractitioners(userId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    const cabinetPractitioners = await prisma.cabinetPractitioner.findMany({
      where: { cabinetId: cabinet.id, leftAt: null },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            phone: true,
            licenseNumber: true,
            licenseVerified: true,
            user: { select: { email: true, status: true } },
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
      email: cp.practitioner.user.email,
      licenseNumber: cp.practitioner.licenseNumber,
      licenseVerified: cp.practitioner.licenseVerified,
      specialties: cp.practitioner.specialties.map((s) => s.specialty.name),
      joinedAt: cp.joinedAt,
    }))
  }

  async invitePractitioner(userId: string, email: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)
    const normalizedEmail = normalizeEmail(email)

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: {
        practitioner: true,
      },
    })

    if (!user || !user.practitioner) {
      throw new Error('Aucun praticien vérifié trouvé avec cet email')
    }

    if (user.role !== 'PRACTITIONER') {
      throw new Error("Cet utilisateur n'est pas un praticien")
    }

    if (!user.practitioner.licenseVerified) {
      throw new Error("Ce praticien n'est pas encore vérifié")
    }

    const existing = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId: user.practitioner.id,
        leftAt: null,
      },
    })

    if (existing) {
      throw new Error('Ce praticien fait déjà partie de votre cabinet')
    }

    const existingInvitation = await prisma.cabinetInvitation.findUnique({
      where: {
        cabinetId_practitionerId: {
          cabinetId: cabinet.id,
          practitionerId: user.practitioner.id,
        },
      },
    })

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new Error('Une invitation est déjà en attente pour ce praticien')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.cabinetInvitation.upsert({
      where: {
        cabinetId_practitionerId: {
          cabinetId: cabinet.id,
          practitionerId: user.practitioner.id,
        },
      },
      update: {
        status: 'PENDING',
        invitedAt: new Date(),
        expiresAt,
        respondedAt: null,
      },
      create: {
        cabinetId: cabinet.id,
        practitionerId: user.practitioner.id,
        email: normalizedEmail,
        expiresAt,
      },
    })

    await sendCabinetInvitationEmail(normalizedEmail, cabinet.name)

    return invitation
  }

  async removePractitioner(userId: string, practitionerId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
      include: {
        practitioner: {
          select: { title: true, firstName: true, lastName: true },
        },
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    return await prisma.$transaction(async (tx) => {
      await tx.cabinetPractitioner.update({
        where: { id: cp.id },
        data: { leftAt: new Date() },
      })

      await this.cancelFutureCabinetAppointments(
        tx,
        practitionerId,
        cabinet.id,
        cabinet.name,
        cp.practitioner.title,
        cp.practitioner.firstName,
        cp.practitioner.lastName,
      )

      return { success: true }
    })
  }

  async getStaff(userId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    return prisma.staff.findMany({
      where: { cabinetId: cabinet.id },
      include: {
        user: { select: { email: true, status: true } },
      },
    })
  }

  async createStaff(
    userId: string,
    data: {
      email: string
      firstName: string
      lastName: string
      phone: string
      position: string
    },
    assignToCabinet: boolean = true,
    practitionerId?: string,
  ) {
    const normalizedEmail = normalizeEmail(data.email)

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    const generatedPassword = generateToken().substring(0, 12) + 'A1!'

    const hashedPassword = await hashPassword(generatedPassword)

    let cabinetId: string | undefined
    if (assignToCabinet) {
      const cabinet = await this.getCabinetByAdminUserId(userId)
      cabinetId = cabinet.id
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
      },
    })

    let staff
    try {
      staff = await prisma.staff.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          position: data.position,
          practitionerId: practitionerId || null,
          cabinetId: cabinetId || null,
          canManageAppointments: true,
          canViewMedicalRecords: false,
          canManagePayments: false,
        },
      })
    } catch (err) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      throw err
    }

    await sendStaffAccountCreatedEmail(
      normalizedEmail,
      data.firstName,
      generatedPassword,
    )

    return {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      phone: staff.phone,
      position: staff.position,
      email: normalizedEmail,
    }
  }

  async updateStaff(userId: string, staffId: string, position: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, cabinetId: cabinet.id },
    })

    if (!staff) {
      throw new Error('Ce personnel ne fait pas partie de votre cabinet')
    }

    return prisma.staff.update({
      where: { id: staffId },
      data: { position },
      include: {
        user: { select: { email: true, status: true } },
      },
    })
  }

  async removeStaff(userId: string, staffId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, cabinetId: cabinet.id },
    })

    if (!staff) {
      throw new Error('Ce personnel ne fait pas partie de votre cabinet')
    }

    await prisma.staff.delete({ where: { id: staffId } })
    await prisma.user.delete({ where: { id: staff.userId } })
  }

  async getPractitionerAppointments(
    userId: string,
    practitionerId: string,
    date?: string,
  ) {
    const cabinet = await this.getCabinetForStaffOrAdmin(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    const where: Record<string, unknown> = {
      practitionerId,
      cabinetId: cabinet.id,
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      where.appointmentDate = { gte: startDate, lt: endDate }
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

  async getPractitionerSchedule(userId: string, practitionerId: string) {
    const cabinet = await this.getCabinetForStaffOrAdmin(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    const [availabilities, absences, blockedSlots] = await Promise.all([
      prisma.availability.findMany({
        where: { practitionerId, cabinetId: cabinet.id },
        orderBy: { dayOfWeek: 'asc' },
      }),
      prisma.absence.findMany({
        where: {
          practitionerId,
          cabinetId: cabinet.id,
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.blockedSlot.findMany({
        where: {
          practitionerId,
          cabinetId: cabinet.id,
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
      }),
    ])

    return { availabilities, absences, blockedSlots }
  }

  async getPractitionerPatients(
    userId: string,
    practitionerId: string,
    search?: string,
  ) {
    const cabinet = await this.getCabinetForStaffOrAdmin(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        cabinetId: cabinet.id,
      },
      select: {
        patientId: true,
        appointmentDate: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    })

    const patientMap = new Map<
      string,
      {
        id: string
        firstName: string
        lastName: string
        phone: string
        email: string
        lastVisit: Date
        visitCount: number
      }
    >()

    for (const apt of appointments) {
      const existing = patientMap.get(apt.patientId)
      if (existing) {
        existing.visitCount++
      } else {
        patientMap.set(apt.patientId, {
          id: apt.patient.id,
          firstName: apt.patient.firstName,
          lastName: apt.patient.lastName,
          phone: apt.patient.phone,
          email: apt.patient.user?.email || '',
          lastVisit: apt.appointmentDate,
          visitCount: 1,
        })
      }
    }

    let patients = Array.from(patientMap.values())

    if (search) {
      const q = search.toLowerCase()
      patients = patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q),
      )
    }

    return patients
  }

  async searchPatientsForBooking(
    userId: string,
    practitionerId: string,
    query: string,
  ) {
    const cabinet = await this.getCabinetForStaffOrAdmin(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    const cabinetPatientIds = await prisma.appointment.findMany({
      where: {
        cabinetId: cabinet.id,
      },
      select: { patientId: true },
      distinct: ['patientId'],
    })

    const cabinetPatients = await prisma.patient.findMany({
      where: {
        id: { in: cabinetPatientIds.map((a) => a.patientId) },
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
        user: { select: { email: true } },
      },
      take: 10,
    })

    const results: Array<{
      id: string
      firstName: string
      lastName: string
      phone: string
      email: string
      source: 'cabinet' | 'platform'
    }> = cabinetPatients.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.user?.email || '',
      source: 'cabinet',
    }))

    if (query.includes('@')) {
      const normalizedQuery = normalizeEmail(query)
      const user = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedQuery, mode: 'insensitive' },
          role: 'PATIENT',
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      })

      if (user?.patient) {
        const alreadyInResults = results.some((r) => r.id === user.patient!.id)
        if (!alreadyInResults) {
          results.push({
            id: user.patient.id,
            firstName: user.patient.firstName,
            lastName: user.patient.lastName,
            phone: user.patient.phone,
            email: user.email,
            source: 'platform',
          })
        }
      }
    }

    return results
  }

  async bookAppointmentForPractitioner(
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
    const cabinet = await this.getCabinetForStaffOrAdmin(userId)

    const cp = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinet.id,
        practitionerId,
        leftAt: null,
      },
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    })

    if (!patient) {
      throw new Error('Patient non trouvé')
    }

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
        cabinetId: cabinet.id,
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

  async deleteCabinet(userId: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    return await prisma.$transaction(async (tx) => {
      const practitioners = await tx.cabinetPractitioner.findMany({
        where: { cabinetId: cabinet.id, leftAt: null },
        include: {
          practitioner: {
            select: { id: true, title: true, firstName: true, lastName: true },
          },
        },
      })

      for (const cp of practitioners) {
        await this.cancelFutureCabinetAppointments(
          tx,
          cp.practitioner.id,
          cabinet.id,
          cabinet.name,
          cp.practitioner.title,
          cp.practitioner.firstName,
          cp.practitioner.lastName,
        )
      }

      await tx.cabinetPractitioner.updateMany({
        where: { cabinetId: cabinet.id, leftAt: null },
        data: { leftAt: new Date() },
      })

      const staffMembers = await tx.staff.findMany({
        where: { cabinetId: cabinet.id },
        select: { id: true, userId: true },
      })

      for (const s of staffMembers) {
        await tx.staff.delete({ where: { id: s.id } })
        await tx.user.delete({ where: { id: s.userId } })
      }

      await tx.cabinetInvitation.deleteMany({
        where: { cabinetId: cabinet.id },
      })

      await tx.availability.deleteMany({ where: { cabinetId: cabinet.id } })
      await tx.absence.deleteMany({ where: { cabinetId: cabinet.id } })
      await tx.blockedSlot.deleteMany({ where: { cabinetId: cabinet.id } })

      await tx.cabinet.delete({ where: { id: cabinet.id } })

      return { success: true }
    })
  }

  async transferOwnership(userId: string, newAdminEmail: string) {
    const cabinet = await this.getCabinetByAdminUserId(userId)
    const normalizedEmail = normalizeEmail(newAdminEmail)

    const newAdmin = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (!newAdmin) {
      throw new Error('Aucun utilisateur trouvé avec cet email')
    }

    if (newAdmin.id === userId) {
      throw new Error('Vous êtes déjà administrateur de ce cabinet')
    }

    const existingCabinet = await prisma.cabinet.findFirst({
      where: { adminUserId: newAdmin.id },
    })

    if (existingCabinet) {
      throw new Error('Cet utilisateur administre déjà un cabinet')
    }

    await prisma.$transaction(async (tx) => {
      if (newAdmin.role !== 'CABINET_ADMIN') {
        await tx.user.update({
          where: { id: newAdmin.id },
          data: { role: UserRole.CABINET_ADMIN },
        })
      }

      await tx.cabinet.update({
        where: { id: cabinet.id },
        data: {
          adminUserId: newAdmin.id,
          adminContactEmail: normalizedEmail,
        },
      })
    })

    return { success: true, newAdminEmail: normalizedEmail }
  }

  private async cancelFutureCabinetAppointments(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    practitionerId: string,
    cabinetId: string,
    cabinetName: string,
    practitionerTitle: string,
    practitionerFirstName: string,
    practitionerLastName: string,
  ) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const futureAppointments = await tx.appointment.findMany({
      where: {
        practitionerId,
        cabinetId,
        appointmentDate: { gte: today },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    })

    if (futureAppointments.length === 0) return

    await tx.appointment.updateMany({
      where: {
        id: { in: futureAppointments.map((a) => a.id) },
      },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'CABINET',
        cancellationReason: `Praticien retiré du cabinet ${cabinetName}`,
      },
    })

    for (const apt of futureAppointments) {
      if (apt.patient.user?.email) {
        const dateStr = apt.appointmentDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        try {
          await sendCabinetLeaveAppointmentCancelledEmail(
            apt.patient.user.email,
            {
              patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
              practitionerTitle,
              practitionerFirstName,
              practitionerLastName,
              cabinetName,
              appointmentDate: dateStr,
              appointmentTime: apt.startTime,
            },
          )
        } catch (emailError) {
          console.error(
            `Failed to send cancellation email for appointment ${apt.id}:`,
            emailError,
          )
        }
      }
    }
  }
}

export const cabinetService = new CabinetService()
