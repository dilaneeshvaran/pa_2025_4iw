import prisma from '../../config/database'
import { ContactRequestStatus, UserRole, UserStatus } from '@prisma/client'
import { hashPassword } from '../../utils/bcrypt'
import { generateToken } from '../../utils/crypto'
import { sendEmail, sendPasswordResetEmail, buildEmailHtml } from '../../utils/email'
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

  async approveRequest(id: string, processedBy: string, plan?: string) {
    const request = await prisma.contactRequest.findUnique({
      where: { id },
    })

    if (!request) {
      throw new Error('Demande introuvable')
    }

    if (request.status !== 'PENDING' && request.status !== 'CONTACTED') {
      throw new Error('Cette demande a déjà été traitée')
    }

    if (request.requestType === 'PRACTITIONER') {
      if (!plan) {
        throw new Error("Le plan d'abonnement est requis pour les praticiens")
      }
      const upperPlan = plan.toUpperCase()
      const validPlans = ['FREE', 'PREMIUM', 'PRO']
      if (!validPlans.includes(upperPlan)) {
        throw new Error("Le plan d'abonnement sélectionné est invalide")
      }
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

      const practitioner = await prisma.practitioner.create({
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

      // Create subscription
      await prisma.subscription.create({
        data: {
          practitionerId: practitioner.id,
          plan: plan!.toUpperCase(),
          status: 'ACTIVE',
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
    const APP_URL =
      process.env.BACKEND_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000'
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

    const html = buildEmailHtml({
      title: 'Votre compte MediCôte a été approuvé',
      preheader: 'Votre inscription professionnelle sur MediCôte est validée.',
      contentHtml: `
        <h2 style="color: #009a44; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Demande approuvée ✓</h2>
        <p style="margin: 0 0 16px 0;">Bonjour ${firstName},</p>
        <p style="margin: 0 0 20px 0;">Votre demande d'inscription professionnelle sur MediCôte a été <strong>approuvée</strong>. Votre compte a été créé avec les identifiants temporaires suivants :</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; font-family: 'Inter', sans-serif; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 45%; vertical-align: top;">Email :</td>
              <td style="padding: 6px 0; color: #334155;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b; vertical-align: top;">Mot de passe temporaire :</td>
              <td style="padding: 6px 0; color: #334155; font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">${tempPassword}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #991b1b;">
          <p style="margin: 0;"><strong>Important :</strong> Pour des raisons de sécurité, veuillez réinitialiser votre mot de passe dès votre première connexion en cliquant sur le bouton ci-dessous.</p>
        </div>

        <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748b;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
        <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #ff8200; text-decoration: none;">${resetUrl}</a></p>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Ce lien de réinitialisation expirera dans 48 heures.</p>
      `,
      actionUrl: resetUrl,
      actionText: 'Réinitialiser mon mot de passe',
      accentColor: '#009a44',
    })

    await sendEmail(to, 'Votre compte MediCôte a été approuvé', html)
  }

  private async sendRejectionEmail(
    to: string,
    firstName: string,
    reason: string,
  ) {
    const html = buildEmailHtml({
      title: "Demande d'inscription refusée - MediCôte",
      preheader: "Mise à jour concernant votre inscription professionnelle.",
      contentHtml: `
        <h2 style="color: #dc2626; font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Demande refusée</h2>
        <p style="margin: 0 0 16px 0;">Bonjour ${firstName},</p>
        <p style="margin: 0 0 20px 0;">Nous avons examiné votre demande d'inscription professionnelle sur MediCôte. Malheureusement, votre demande a été <strong>refusée</strong> pour la raison suivante :</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #991b1b;">
          <p style="margin: 0;">${reason}</p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">
          Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre une nouvelle demande avec des documents complémentaires, n'hésitez pas à nous contacter à l'adresse <a href="mailto:support@medicote.ci" style="color: #ff8200; text-decoration: none; font-weight: 500;">support@medicote.ci</a>.
        </p>
      `,
      accentColor: '#dc2626',
    })

    await sendEmail(to, "Demande d'inscription refusée - MediCôte", html)
  }
}
