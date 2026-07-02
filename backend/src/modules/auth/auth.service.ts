import { UserRole, UserStatus } from '@prisma/client'
import { verifySync } from 'otplib'
import prisma from '../../config/database'
import { redis } from '../../config/redis'
import { hashPassword, comparePassword } from '../../utils/bcrypt'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateMfaToken,
  verifyMfaToken,
} from '../../utils/jwt'
import { generateToken, decrypt } from '../../utils/crypto'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../utils/email'
import { normalizeEmail } from '../../utils/normalize-email'
import { CreateUserData, AuthResponse, AuthTokens } from './auth.types'

export class AuthService {
  private async isPractitionerUnpaid(userId: string): Promise<boolean> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: {
        licenseVerifiedAt: true,
        savedPaymentMethods: {
          where: { isVerified: true },
          select: { id: true },
        },
      },
    })

    if (!practitioner || !practitioner.licenseVerifiedAt) {
      return false
    }

    const billingDate = new Date(practitioner.licenseVerifiedAt)
    billingDate.setMonth(billingDate.getMonth() + 1)

    return new Date() > billingDate && practitioner.savedPaymentMethods.length === 0
  }

  async signup(data: CreateUserData): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(data.email)

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    const hashedPassword = await hashPassword(data.password)

    const { user } = await prisma.$transaction(async (tx) => {
      // Force PATIENT role for public signup
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: UserRole.PATIENT, // Always PATIENT for public signup
          status: UserStatus.PENDING_VERIFICATION,
        },
      })

      // Create patient profile
      await tx.patient.create({
        data: {
          userId: createdUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth || new Date(),
          gender: data.gender || 'PREFER_NOT_TO_SAY',
        },
      })

      const verificationToken = generateToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

      await tx.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          email: createdUser.email,
          token: verificationToken,
          expiresAt,
        },
      })

      await sendVerificationEmail(createdUser.email, verificationToken)

      return { user: createdUser }
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      tokens,
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(email)

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (!user || !user.password) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      )
      throw new Error(
        `Compte verrouillé. Réessayez dans ${remainingMinutes} minute(s)`,
      )
    }

    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      // increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      }

      // lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        const lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 15) // lock for 15 minutes
        updateData.lockedUntil = lockedUntil
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      throw new Error('Email ou mot de passe incorrect')
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Votre compte a été suspendu')
    }

    // reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: null, // todo: get ip from request
      },
    })

    let firstName: string | null = null
    let lastName: string | null = null

    if (user.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (patient) {
        firstName = patient.firstName
        lastName = patient.lastName
      }
    } else if (user.role === UserRole.PRACTITIONER) {
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (practitioner) {
        firstName = practitioner.firstName
        lastName = practitioner.lastName
      }
    } else if (user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (staff) {
        firstName = staff.firstName
        lastName = staff.lastName
      }
    }

    if (user.twoFactorEnabled) {
      const mfaToken = generateMfaToken(user.id)
      return {
        requires2FA: true,
        mfaToken,
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role)
    const isUnpaid = user.role === UserRole.PRACTITIONER && (await this.isPractitionerUnpaid(user.id))

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        firstName,
        lastName,
        isUnpaid,
      },
      tokens,
    }
  }

  async verify2fa(mfaToken: string, code: string): Promise<AuthResponse> {
    let payload
    try {
      payload = verifyMfaToken(mfaToken)
    } catch (err) {
      throw new Error('Token MFA invalide ou expiré')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA non activé pour cet utilisateur')
    }

    // Determine if we're dealing with a backup code or a TOTP code
    const isBackupCode = code.length !== 6

    if (isBackupCode) {
      // Find a matching backup code hash
      let matchedIndex = -1
      for (let i = 0; i < user.backupCodes.length; i++) {
        const isMatch = await comparePassword(code, user.backupCodes[i])
        if (isMatch) {
          matchedIndex = i
          break
        }
      }

      if (matchedIndex === -1) {
        throw new Error('Code de secours incorrect')
      }

      // Remove the consumed backup code
      const updatedBackupCodes = [...user.backupCodes]
      updatedBackupCodes.splice(matchedIndex, 1)

      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: updatedBackupCodes },
      })
    } else {
      // TOTP verification
      if (!user.twoFactorSecret) {
        throw new Error('Secret 2FA non configuré')
      }

      const decryptedSecret = decrypt(user.twoFactorSecret)
      const isValid = verifySync({
        token: code,
        secret: decryptedSecret,
      }).valid

      if (!isValid) {
        throw new Error('Code 2FA incorrect')
      }

      // Replay prevention: check if this code was already verified recently for this user
      const replayKey = `mfa:replay:${user.id}:${code}`
      const isNew = await redis.set(replayKey, '1', 'EX', 60, 'NX')
      if (!isNew) {
        throw new Error('Ce code a déjà été utilisé')
      }
    }

    // Successful authentication
    let firstName: string | null = null
    let lastName: string | null = null

    if (user.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (patient) {
        firstName = patient.firstName
        lastName = patient.lastName
      }
    } else if (user.role === UserRole.PRACTITIONER) {
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (practitioner) {
        firstName = practitioner.firstName
        lastName = practitioner.lastName
      }
    } else if (user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { firstName: true, lastName: true },
      })
      if (staff) {
        firstName = staff.firstName
        lastName = staff.lastName
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role)
    const isUnpaid = user.role === UserRole.PRACTITIONER && (await this.isPractitionerUnpaid(user.id))

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        firstName,
        lastName,
        isUnpaid,
      },
      tokens,
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      throw new Error('Token de vérification invalide')
    }

    if (verificationToken.usedAt) {
      throw new Error('Ce token a déjà été utilisé')
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Le token de vérification a expiré')
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    })

    // mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    })

    // send welcome email
    const profile =
      (await prisma.patient.findUnique({
        where: { userId: verificationToken.userId },
      })) ||
      (await prisma.practitioner.findUnique({
        where: { userId: verificationToken.userId },
      }))

    if (profile) {
      await sendWelcomeEmail(verificationToken.email, profile.firstName)
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email)

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    if (user.emailVerified) {
      throw new Error('Email déjà vérifié')
    }

    // delete old verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    })

    // generate new verification token
    const verificationToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: verificationToken,
        expiresAt,
      },
    })

    await sendVerificationEmail(user.email, verificationToken)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email)

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    // dont reveal if user exists or not for security
    if (!user) {
      return
    }

    // delete old password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    })

    // generate reset token
    const resetToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    await sendPasswordResetEmail(user.email, resetToken)
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      throw new Error('Token de réinitialisation invalide')
    }

    if (resetToken.usedAt) {
      throw new Error('Ce token a déjà été utilisé')
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Le token de réinitialisation a expiré')
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    // revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revokedAt: new Date() },
    })
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch (error) {
      throw new Error('Refresh token invalide ou expiré')
    }

    // check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken) {
      throw new Error('Refresh token non trouvé')
    }

    if (storedToken.revokedAt) {
      throw new Error('Refresh token révoqué')
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expiré')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    return this.generateTokens(user.id, user.email, user.role)
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    })
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    const payload = { userId, email, role }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // store refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    })

    return { accessToken, refreshToken }
  }
}
