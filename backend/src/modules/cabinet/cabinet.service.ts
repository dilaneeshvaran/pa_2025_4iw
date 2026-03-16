import prisma from '../../config/database'
import { UserRole, UserStatus } from '@prisma/client'
import { hashPassword } from '../../utils/bcrypt'
import { generateToken } from '../../utils/crypto'
import {
  sendStaffAccountCreatedEmail,
  sendCabinetInvitationEmail,
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

    // Find verified practitioner by email
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

    //check if already in cabinet
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

    // check existing pending invitation
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
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

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
    })

    if (!cp) {
      throw new Error('Ce praticien ne fait pas partie de votre cabinet')
    }

    return prisma.cabinetPractitioner.update({
      where: { id: cp.id },
      data: { leftAt: new Date() },
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

    // ceck if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // generate a random password
    const generatedPassword = generateToken().substring(0, 12) + 'A1!' //ensure password requirement

    const hashedPassword = await hashPassword(generatedPassword)

    let cabinetId: string | undefined
    if (assignToCabinet) {
      const cabinet = await this.getCabinetByAdminUserId(userId)
      cabinetId = cabinet.id
    }

    // create user then staff record (sequential, with cleanup on failure)
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
      // clean up the user if staff creation fails
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      throw err
    }

    // send email with generated password
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

    // delete staff first (fk constraint), then user
    await prisma.staff.delete({ where: { id: staffId } })
    await prisma.user.delete({ where: { id: staff.userId } })
  }

  async getPractitionerAppointments(
    userId: string,
    practitionerId: string,
    date?: string,
  ) {
    const cabinet = await this.getCabinetByAdminUserId(userId)

    // verify practitioner belongs to cabinet
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
}

export const cabinetService = new CabinetService()
