import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'

export async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/api/auth' })

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
