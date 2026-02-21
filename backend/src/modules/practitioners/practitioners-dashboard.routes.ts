import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { practitionerDashboardController } from './practitioners-dashboard.controller'
import {
  createTodoSchema,
  updateBillingConfigSchema,
} from './practitioners-dashboard.schema'

export async function practitionerDashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-dashboard'],
        description: 'Get practitioner dashboard data',
      },
    },
    practitionerDashboardController.getDashboard.bind(
      practitionerDashboardController,
    ),
  )

  fastify.post(
    '/todos',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        body: createTodoSchema,
        tags: ['practitioner-dashboard'],
        description: 'Create a new todo',
      },
    },
    practitionerDashboardController.createTodo.bind(
      practitionerDashboardController,
    ),
  )

  fastify.patch(
    '/todos/:id/toggle',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-dashboard'],
        description: 'Toggle todo completion status',
      },
    },
    practitionerDashboardController.toggleTodo.bind(
      practitionerDashboardController,
    ),
  )

  fastify.delete(
    '/todos/:id',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-dashboard'],
        description: 'Delete a todo',
      },
    },
    practitionerDashboardController.deleteTodo.bind(
      practitionerDashboardController,
    ),
  )

  fastify.get(
    '/billing-config',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        tags: ['practitioner-dashboard'],
        description: 'Get practitioner billing configuration',
      },
    },
    practitionerDashboardController.getBillingConfig.bind(
      practitionerDashboardController,
    ),
  )

  fastify.patch(
    '/billing-config',
    {
      preHandler: [authenticate, authorize(['PRACTITIONER'])],
      schema: {
        body: updateBillingConfigSchema,
        tags: ['practitioner-dashboard'],
        description: 'Update practitioner billing configuration',
      },
    },
    practitionerDashboardController.updateBillingConfig.bind(
      practitionerDashboardController,
    ),
  )
}
