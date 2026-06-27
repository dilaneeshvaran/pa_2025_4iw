import { FastifyRequest, FastifyReply } from 'fastify'
import { UserRole, UserStatus } from '@prisma/client'
import { adminUsersService } from './admin-users.service'

const VALID_ROLES: UserRole[] = [
  'PATIENT',
  'PRACTITIONER',
  'STAFF',
  'CABINET_ADMIN',
  'ADMIN',
]
const VALID_STATUSES: UserStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
]

export class AdminUsersController {
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        search?: string
        role?: string
        status?: string
        sortOrder?: string
        page?: string
        limit?: string
      }

      const role =
        query.role && VALID_ROLES.includes(query.role as UserRole)
          ? (query.role as UserRole)
          : undefined
      const status =
        query.status && VALID_STATUSES.includes(query.status as UserStatus)
          ? (query.status as UserStatus)
          : undefined

      const data = await adminUsersService.getUsers({
        search: query.search,
        role,
        status,
        sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 15,
      })

      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des utilisateurs',
      })
    }
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await adminUsersService.getStats()
      return reply.status(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors du chargement des statistiques',
      })
    }
  }

  async getUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string }
      const data = await adminUsersService.getUserById(userId)
      return reply.status(200).send({ success: true, data })
    } catch (error: any) {
      if (error.message === 'User not found') {
        return reply
          .status(404)
          .send({ success: false, message: 'Utilisateur non trouvé' })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: "Erreur lors du chargement de l'utilisateur",
      })
    }
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string }
      const { status } = request.body as { status?: string }

      if (!status || !VALID_STATUSES.includes(status as UserStatus)) {
        return reply
          .status(400)
          .send({ success: false, message: 'Statut invalide' })
      }

      const data = await adminUsersService.updateStatus(
        userId,
        status as UserStatus,
        request.user!.id,
      )

      return reply.status(200).send({
        success: true,
        message: 'Statut mis à jour avec succès',
        data,
      })
    } catch (error: any) {
      if (error.message === 'User not found') {
        return reply
          .status(404)
          .send({ success: false, message: 'Utilisateur non trouvé' })
      }
      if (error.message === 'Cannot change your own status') {
        return reply.status(400).send({
          success: false,
          message: 'Vous ne pouvez pas modifier votre propre statut',
        })
      }
      if (error.message === 'Cannot suspend an administrator account') {
        return reply.status(400).send({
          success: false,
          message: 'Impossible de suspendre un compte administrateur',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
      })
    }
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string }
      await adminUsersService.deleteUser(userId, request.user!.id)
      return reply
        .status(200)
        .send({ success: true, message: 'Utilisateur supprimé avec succès' })
    } catch (error: any) {
      if (error.message === 'User not found') {
        return reply
          .status(404)
          .send({ success: false, message: 'Utilisateur non trouvé' })
      }
      if (error.message === 'Cannot delete your own account') {
        return reply.status(400).send({
          success: false,
          message: 'Vous ne pouvez pas supprimer votre propre compte',
        })
      }
      if (error.message === 'Cannot delete an administrator account') {
        return reply.status(400).send({
          success: false,
          message: 'Impossible de supprimer un compte administrateur',
        })
      }
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la suppression',
      })
    }
  }
}

export const adminUsersController = new AdminUsersController()
