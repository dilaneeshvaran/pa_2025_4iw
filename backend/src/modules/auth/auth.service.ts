import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import { hashPassword, comparePassword } from '../../utils/bcrypt'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import { generateToken } from '../../utils/crypto'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../utils/email'
import { CreateUserData, AuthResponse, AuthTokens } from './auth.types'

const prisma = new PrismaClient()

export class AuthService {
  async signup(data: CreateUserData): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        status: UserStatus.PENDING_VERIFICATION,
      },
    })

    // create profile based on role
    if (data.role === UserRole.PATIENT) {
      await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth || new Date(),
          gender: data.gender || 'PREFER_NOT_TO_SAY',
        },
      })
    } else if (data.role === UserRole.PRACTITIONER) {
      await prisma.practitioner.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          title: 'Dr.',
          licenseNumber: `TEMP-${user.id}`,
          address: '',
          city: '',
          baseConsultationFee: 0,
        },
      })

      // link specialties if provided
      if (data.specialtyIds && data.specialtyIds.length > 0) {
        await prisma.practitionerSpecialty.createMany({
          data: data.specialtyIds.map((specialtyId) => ({
            practitionerId: user.id,
            specialtyId,
          })),
        })
      }
    }

    const verificationToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: verificationToken,
        expiresAt,
      },
    })

    await sendVerificationEmail(user.email, verificationToken)

    const tokens = await this.generateTokens(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
      },
      tokens,
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
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
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 15) // Lock for 15 minutes
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

    const tokens = await this.generateTokens(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
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
    const user = await prisma.user.findUnique({
      where: { email },
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
    const user = await prisma.user.findUnique({
      where: { email },
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
