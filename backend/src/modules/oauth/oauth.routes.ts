import { FastifyInstance } from 'fastify'
import * as oauthController from './oauth.controller'

export async function oauthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/google',
    {
      schema: {
        tags: ['OAuth'],
        description: 'Initiate Google OAuth authentication flow',
      },
    },
    oauthController.initiateGoogleAuth,
  )

  fastify.get(
    '/google/callback',
    {
      schema: {
        tags: ['OAuth'],
        description: 'Handle Google OAuth callback',
      },
    },
    oauthController.handleGoogleCallback,
  )
}
