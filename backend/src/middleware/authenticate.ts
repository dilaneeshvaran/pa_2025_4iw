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
      },
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    if (user.status !== 'ACTIVE') {
      return reply.status(401).send({
        success: false,
        message: 'Compte utilisateur inactif',
      })
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
