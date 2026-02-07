import { FastifyRequest, FastifyReply } from 'fastify'
import { UserRole } from '@prisma/client'

export function authorize(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'Authentification requise',
      })
    }

    if (!allowedRoles.includes(request.user.role as UserRole)) {
      return reply.status(403).send({
        success: false,
        message: 'Accès non autorisé',
      })
    }
  }
}
