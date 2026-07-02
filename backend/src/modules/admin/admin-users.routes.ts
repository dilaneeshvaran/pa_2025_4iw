import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { adminUsersController } from './admin-users.controller'

export async function adminUsersRoutes(fastify: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorize(['ADMIN'])] }

  // create a new platform administrator account
  fastify.post(
    '/',
    adminOnly,
    adminUsersController.createAdmin.bind(adminUsersController),
  )

  // list users (search / role / status / pagination)
  fastify.get(
    '/',
    adminOnly,
    adminUsersController.getUsers.bind(adminUsersController),
  )

  // status counts for the header cards
  fastify.get(
    '/stats',
    adminOnly,
    adminUsersController.getStats.bind(adminUsersController),
  )

  // single user detail
  fastify.get(
    '/:userId',
    adminOnly,
    adminUsersController.getUser.bind(adminUsersController),
  )

  // change account status (activate / suspend / deactivate)
  fastify.patch(
    '/:userId/status',
    adminOnly,
    adminUsersController.updateStatus.bind(adminUsersController),
  )

  // soft-delete an account
  fastify.delete(
    '/:userId',
    adminOnly,
    adminUsersController.deleteUser.bind(adminUsersController),
  )
}
