import prisma from '../../config/database'
import { hashPassword, comparePassword } from '../../utils/bcrypt'
import { generateToken } from '../../utils/crypto'
import { sendVerificationEmail } from '../../utils/email'
import { normalizeEmail } from '../../utils/normalize-email'
import {
  UpdateProfileData,
  UpdateEmailData,
  UpdatePasswordData,
  NotificationPreferences,
  ConsentInput,
} from './patient-settings.types'

export class PatientSettingsService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        twoFactorEnabled: true,
        role: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            postalCode: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('Utilisateur introuvable')
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: !!user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      role: user.role,
      patient: user.patient
        ? {
            ...user.patient,
            dateOfBirth: user.patient.dateOfBirth.toISOString().split('T')[0],
          }
        : null,
    }
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true },
    })

    if (!user || !user.patient) {
      throw new Error('Profil patient introuvable')
    }

    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.country !== undefined) updateData.country = data.country
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(data.dateOfBirth)
    }

    await prisma.patient.update({
      where: { userId },
      data: updateData,
    })

    return this.getProfile(userId)
  }

  async updateEmail(userId: string, data: UpdateEmailData) {
    const normalizedEmail = normalizeEmail(data.newEmail)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new Error('Utilisateur introuvable')
    }

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

    // create verification token for new email
    const verificationToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        email: normalizedEmail,
        token: verificationToken,
        expiresAt,
      },
    })

    // update email immediately but mark as unverified
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        emailVerified: null,
      },
    })

    await sendVerificationEmail(normalizedEmail, verificationToken)

    return {
      message: 'Un email de vérification a été envoyé à votre nouvelle adresse',
    }
  }

  async updatePassword(userId: string, data: UpdatePasswordData) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new Error('Utilisateur introuvable')
    }

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

  // 2fa toggle

  async toggle2FA(userId: string, enabled: boolean) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    })

    return {
      twoFactorEnabled: enabled,
      message: enabled
        ? 'Authentification à deux facteurs activée'
        : 'Authentification à deux facteurs désactivée',
    }
  }

  async getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      })
    }

    return {
      emailNotifications: prefs.emailNotifications,
      smsNotifications: prefs.smsNotifications,
      appointmentReminders: prefs.appointmentReminders,
      newMessages: prefs.newMessages,
      healthTipsAndNews: prefs.healthTipsAndNews,
    }
  }

  async updateNotificationPreferences(
    userId: string,
    data: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })

    return {
      emailNotifications: prefs.emailNotifications,
      smsNotifications: prefs.smsNotifications,
      appointmentReminders: prefs.appointmentReminders,
      newMessages: prefs.newMessages,
      healthTipsAndNews: prefs.healthTipsAndNews,
    }
  }

  // consents

  async getConsents(userId: string) {
    const consents = await prisma.consent.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    })

    return consents.map((c) => ({
      id: c.id,
      consentType: c.consentType,
      version: c.version,
      accepted: c.accepted,
      acceptedAt: c.acceptedAt.toISOString(),
      revokedAt: c.revokedAt?.toISOString() || null,
    }))
  }

  async upsertConsent(
    userId: string,
    data: ConsentInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // find  active consent of this type
    const existing = await prisma.consent.findFirst({
      where: {
        userId,
        consentType: data.consentType,
        revokedAt: null,
      },
      orderBy: { acceptedAt: 'desc' },
    })

    if (existing) {
      // revoke old one
      await prisma.consent.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      })
    }

    // create new consent record
    const consent = await prisma.consent.create({
      data: {
        userId,
        consentType: data.consentType,
        version: data.version,
        accepted: data.accepted,
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
      },
    })

    return {
      id: consent.id,
      consentType: consent.consentType,
      version: consent.version,
      accepted: consent.accepted,
      acceptedAt: consent.acceptedAt.toISOString(),
      revokedAt: null,
    }
  }

  // rdpd data export

  async requestDataExport(userId: string, ipAddress?: string) {
    // check for pending or processing request
    const pending = await prisma.dataExportRequest.findFirst({
      where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
    })
    if (pending) {
      throw new Error("Une demande d'export est déjà en cours")
    }

    const request = await prisma.dataExportRequest.create({
      data: {
        userId,
        ipAddress,
      },
    })

    return {
      id: request.id,
      status: request.status,
      requestedAt: request.requestedAt.toISOString(),
      message:
        "Votre demande d'export a été enregistrée. Vous recevrez un email quand vos données seront prêtes.",
    }
  }

  // rdpd account deletion

  async requestAccountDeletion(
    userId: string,
    reason?: string,
    ipAddress?: string,
  ) {
    // check for pending request
    const pending = await prisma.dataDeletionRequest.findFirst({
      where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
    })
    if (pending) {
      throw new Error('Une demande de suppression est déjà en cours')
    }

    const confirmationToken = generateToken()
    const scheduledDeletion = new Date()
    scheduledDeletion.setDate(scheduledDeletion.getDate() + 30) // 30 day  period

    const request = await prisma.dataDeletionRequest.create({
      data: {
        userId,
        reason,
        confirmationToken,
        scheduledDeletionAt: scheduledDeletion,
        ipAddress,
      },
    })

    return {
      id: request.id,
      status: request.status,
      scheduledDeletionAt: request.scheduledDeletionAt?.toISOString(),
      message:
        'Votre demande de suppression a été enregistrée. Votre compte sera supprimé dans 30 jours. Vous pouvez annuler cette demande pendant ce délai.',
    }
  }
}

export const patientSettingsService = new PatientSettingsService()
