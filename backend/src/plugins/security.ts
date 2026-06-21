import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

async function securityPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  fastify.addHook('onRequest', async (_request, reply) => {
    reply.headers({
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox;",
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-XSS-Protection': '1; mode=block',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'X-DNS-Prefetch-Control': 'off',
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none',
    })
  })
}

export default fp(securityPlugin)
