import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import prisma from '../config/database'

interface JwtPayload {
  userId: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      role: string
    }
  }
  interface FastifySchema {
    tags?: string[]
    description?: string
  }
}

// authenticate for download endpoints
// bcoz browser go todownload url directly without token
// pass token via ?token= URL param
export async function authenticateAttachmentRequest(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = (request.query ?? {}) as { token?: string }
  const token = query.token

  if (
    !request.headers.authorization &&
    typeof token === 'string' &&
    token.length > 0
  ) {
    ;(
      request.headers as Record<string, string | string[] | undefined>
    ).authorization = `Bearer ${token}`
  }

  return authenticate(request, reply)
}

async function checkUnpaidPractitioner(userId: string): Promise<boolean> {
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

  // Billed after 1 month starting the date of registration approval by admin (licenseVerifiedAt)
  const billingDate = new Date(practitioner.licenseVerifiedAt)
  billingDate.setMonth(billingDate.getMonth() + 1)

  const isPastBillingDate = new Date() > billingDate
  const hasVerifiedPaymentMethod = practitioner.savedPaymentMethods.length > 0

  return isPastBillingDate && !hasVerifiedPaymentMethod
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: "Token d'authentification manquant",
      })
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.BACKEND_JWT_SECRET

    if (!jwtSecret) {
      throw new Error('JWT secret is not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    // verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    if (user.status === 'SUSPENDED') {
      return reply.status(403).send({
        success: false,
        message: 'Votre compte a été suspendu',
      })
    }

    if (user.status === 'PENDING_VERIFICATION') {
      return reply.status(403).send({
        success: false,
        message: 'Veuillez vérifier votre email avant d\'accéder à cette ressource',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    if (user.status !== 'ACTIVE') {
      return reply.status(403).send({
        success: false,
        message: 'Compte utilisateur inactif',
      })
    }

    // check if practitioner is unpaid
    if (user.role === 'PRACTITIONER') {
      const isUnpaid = await checkUnpaidPractitioner(user.id)
      if (isUnpaid) {
        const allowedPaths = [
          '/api/payments/methods',
          '/api/practitioner/dashboard/profile',
          '/api/practitioner/dashboard/subscription',
          '/api/auth/logout',
          '/api/auth/refresh-token',
          '/api/auth/verify-2fa',
        ]
        const urlPath = (request.raw.url || '').split('?')[0]
        const isAllowed = allowedPaths.some(path => urlPath.startsWith(path)) ||
                          /\/api\/payments\/methods\/[^/]+$/.test(urlPath) ||
                          /\/api\/payments\/methods\/[^/]+\/(verify|default)$/.test(urlPath)

        if (!isAllowed) {
          return reply.status(402).send({
            success: false,
            code: 'SUBSCRIPTION_UNPAID',
            message: 'Votre abonnement a expiré. Veuillez ajouter un moyen de paiement pour réactiver votre compte.',
          })
        }
      }
    }

    // attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: 'Token invalide ou expiré',
    })
  }
}
