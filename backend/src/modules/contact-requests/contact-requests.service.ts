import prisma from '../../config/database'
import { ContactRequestStatus, UserRole, UserStatus } from '@prisma/client'
import { hashPassword } from '../../utils/bcrypt'
import { generateToken } from '../../utils/crypto'
import { sendEmail, sendPasswordResetEmail } from '../../utils/email'
import { normalizeEmail } from '../../utils/normalize-email'
import crypto from 'crypto'

export class ContactRequestsService {
  async createContactRequest(data: Record<string, any>) {
    const normalizedEmail = normalizeEmail(data.email)
    const normalizedAdminContactEmail = data.adminContactEmail
      ? normalizeEmail(data.adminContactEmail)
      : null

    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        email: normalizedEmail,
        status: {
          in: ['PENDING', 'CONTACTED'],
        },
      },
    })

    if (existingRequest) {
      throw new Error(
        'Une demande de contact est déjà en cours de traitement pour cet email',
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (existingUser) {
      throw new Error(
        'Cet email est déjà associé à un compte existant. Veuillez vous connecter.',
      )
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        requestType: data.requestType,
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        phone: data.phone,
        postalCode: data.postalCode || null,
        specialty: data.specialty || null,
        orderNumber: data.orderNumber || null,
        clinicAddress: data.clinicAddress || null,
        identityDocumentPath: data.identityDocumentPath || null,
        diplomaPath: data.diplomaPath || null,
        orderAttestationPath: data.orderAttestationPath || null,
        cabinetName: data.cabinetName || null,
        cabinetAddress: data.cabinetAddress || null,
        cabinetRccm: data.cabinetRccm || null,
        adminContactName: data.adminContactName || null,
        adminContactEmail: normalizedAdminContactEmail,
        adminContactPhone: data.adminContactPhone || null,
        cabinetRegDocPath: data.cabinetRegDocPath || null,
        status: 'PENDING',
      },
    })

    return contactRequest
  }

  async getAllContactRequests(filters?: {
    status?: string
    requestType?: string
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.requestType) {
      where.requestType = filters.requestType
    }

    const contactRequests = await prisma.contactRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return contactRequests
  }

  async getContactRequestById(id: string) {
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
    })

    return contactRequest
  }

  async updateContactRequestStatus(
    id: string,
    status: ContactRequestStatus,
    adminNotes?: string,
    processedBy?: string,
  ) {
    const contactRequest = await prisma.contactRequest.update({
      where: { id },
      data: {
        status,
        adminNotes,
        processedBy,
        processedAt: new Date(),
      },
    })

    return contactRequest
  }

  async approveRequest(id: string, processedBy: string) {
    const request = await prisma.contactRequest.findUnique({
      where: { id },
    })

    if (!request) {
      throw new Error('Demande introuvable')
    }

    if (request.status !== 'PENDING' && request.status !== 'CONTACTED') {
      throw new Error('Cette demande a déjà été traitée')
    }

    const normalizedRequestEmail = normalizeEmail(request.email)
    const normalizedAdminContactEmail = request.adminContactEmail
      ? normalizeEmail(request.adminContactEmail)
      : normalizedRequestEmail

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedRequestEmail, mode: 'insensitive' } },
    })
    if (existingUser) {
      throw new Error('Un compte existe déjà avec cet email')
    }

    // generate temp password
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const hashedPassword = await hashPassword(tempPassword)

    if (request.requestType === 'PRACTITIONER') {
      // create user + practitioner profile
      const user = await prisma.user.create({
        data: {
          email: normalizedRequestEmail,
          password: hashedPassword,
          role: UserRole.PRACTITIONER,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
        },
      })

      await prisma.practitioner.create({
        data: {
          userId: user.id,
          firstName: request.firstName,
          lastName: request.lastName,
          title: 'Dr.',
          phone: request.phone,
          licenseNumber: request.orderNumber || `TEMP-${crypto.randomUUID()}`,
          licenseVerified: true,
          licenseVerifiedAt: new Date(),
          address: request.clinicAddress || '',
          city: '',
          baseConsultationFee: 0,
        },
      })

      // password reset token for 48 hours
      const resetToken = generateToken()
      const resetExpiry = new Date()
      resetExpiry.setHours(resetExpiry.getHours() + 48)

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetExpiry,
        },
      })

      // update request
      await prisma.contactRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          processedBy,
          processedAt: new Date(),
          createdUserId: user.id,
        },
      })

      // send mail
      await this.sendApprovalEmail(
        request.email,
        request.firstName,
        tempPassword,
        resetToken,
      )

      return { success: true, userId: user.id }
    } else if (request.requestType === 'CABINET') {
      // create admin user for cabinet
      const user = await prisma.user.create({
        data: {
          email: normalizedAdminContactEmail,
          password: hashedPassword,
          role: UserRole.CABINET_ADMIN,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
        },
      })

      // create cabinet entry for cabinet
      const cabinet = await prisma.cabinet.create({
        data: {
          name: request.cabinetName || '',
          address: request.cabinetAddress || '',
          rccm: request.cabinetRccm || null,
          adminContactName:
            request.adminContactName ||
            request.firstName + ' ' + request.lastName,
          adminContactEmail: normalizedAdminContactEmail,
          adminContactPhone: request.adminContactPhone || request.phone,
          registrationDocPath: request.cabinetRegDocPath || null,
          isVerified: true,
          verifiedAt: new Date(),
          contactRequestId: id,
          adminUser: {
            connect: { id: user.id },
          },
        },
      })

      const resetToken = generateToken()
      const resetExpiry = new Date()
      resetExpiry.setHours(resetExpiry.getHours() + 48)

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetExpiry,
        },
      })

      await prisma.contactRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          processedBy,
          processedAt: new Date(),
          createdUserId: user.id,
        },
      })

      await this.sendApprovalEmail(
        normalizedAdminContactEmail,
        request.adminContactName || request.firstName,
        tempPassword,
        resetToken,
      )

      return { success: true, cabinetId: cabinet.id, userId: user.id }
    }

    // mark as approved
    await prisma.contactRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        processedBy,
        processedAt: new Date(),
      },
    })
    return { success: true }
  }

  async rejectRequest(
    id: string,
    rejectionReason: string,
    processedBy: string,
  ) {
    const request = await prisma.contactRequest.findUnique({
      where: { id },
    })

    if (!request) {
      throw new Error('Demande introuvable')
    }

    if (request.status !== 'PENDING' && request.status !== 'CONTACTED') {
      throw new Error('Cette demande a déjà été traitée')
    }

    await prisma.contactRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        processedBy,
        processedAt: new Date(),
      },
    })

    await this.sendRejectionEmail(
      request.email,
      request.firstName,
      rejectionReason,
    )

    return { success: true }
  }

  async deleteContactRequest(id: string): Promise<void> {
    await prisma.contactRequest.delete({
      where: { id },
    })
  }

  private async sendApprovalEmail(
    to: string,
    firstName: string,
    tempPassword: string,
    resetToken: string,
  ) {
    const APP_URL = process.env.BACKEND_FRONTEND_URL || 'http://localhost:3000'
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Votre compte MediCôte a été approuvé</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FF8200; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">MediCôte</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #009A44; margin-top: 0;">Demande approuvée ✓</h2>
            <p>Bonjour ${firstName},</p>
            <p>Votre demande d'inscription professionnelle sur MediCôte a été <strong>approuvée</strong>. Votre compte a été créé avec les identifiants suivants :</p>
            
            <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Email :</strong> ${to}</p>
              <p style="margin: 8px 0;"><strong>Mot de passe temporaire :</strong> ${tempPassword}</p>
            </div>

            <p style="color: #dc2626; font-weight: bold;">Pour des raisons de sécurité, veuillez réinitialiser votre mot de passe dès votre première connexion :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FF8200; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Réinitialiser mon mot de passe</a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #FF8200;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien de réinitialisation expirera dans 48 heures.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail(to, 'Votre compte MediCôte a été approuvé', html)
  }

  private async sendRejectionEmail(
    to: string,
    firstName: string,
    reason: string,
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demande d'inscription refusée</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FF8200; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">MediCôte</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #dc2626; margin-top: 0;">Demande refusée</h2>
            <p>Bonjour ${firstName},</p>
            <p>Nous avons examiné votre demande d'inscription professionnelle sur MediCôte. Malheureusement, votre demande a été <strong>refusée</strong> pour la raison suivante :</p>
            
            <div style="background-color: white; border-left: 4px solid #dc2626; padding: 15px 20px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">${reason}</p>
            </div>

            <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre une nouvelle demande avec des documents complémentaires, n'hésitez pas à nous contacter à <a href="mailto:support@medicote.ci" style="color: #FF8200;">support@medicote.ci</a>.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail(to, "Demande d'inscription refusée - MediCôte", html)
  }
}
