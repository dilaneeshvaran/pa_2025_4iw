import { FastifyRequest, FastifyReply } from 'fastify'
import { redis } from '../config/redis'

interface RateLimitConfig {
  windowMs: number // time window milliseconds
  maxRequests: number // max requests per window
  keyPrefix: string // redis key prefix
}

const defaultConfigs = {
  // strict limit for booking creation (5 per hour per user)
  booking: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyPrefix: 'ratelimit:booking',
  },
  // moderate limit for messages (30 per minute per user)
  message: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'ratelimit:message',
  },
  // general api limit (100 per minute per user)
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'ratelimit:general',
  },
}

async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  // remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // count requests in current window
  const requestCount = await redis.zcard(key)

  if (requestCount >= config.maxRequests) {
    // get oldest entry to calculate reset time
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetTime =
      oldestEntry.length >= 2
        ? parseInt(oldestEntry[1]) + config.windowMs
        : now + config.windowMs

    return {
      allowed: false,
      remaining: 0,
      resetTime,
    }
  }

  //  current request
  await redis.zadd(key, now.toString(), `${now}-${Math.random()}`)
  // set expiry on key
  await redis.expire(key, Math.ceil(config.windowMs / 1000))

  return {
    allowed: true,
    remaining: config.maxRequests - requestCount - 1,
    resetTime: now + config.windowMs,
  }
}

export function createRateLimitMiddleware(
  type: 'booking' | 'message' | 'general',
) {
  const config = defaultConfigs[type]

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string } | undefined
    const identifier = user?.id || request.ip || 'anonymous'

    const result = await checkRateLimit(identifier, config)

    // set rate limit headers
    reply.header('X-RateLimit-Limit', config.maxRequests.toString())
    reply.header('X-RateLimit-Remaining', result.remaining.toString())
    reply.header(
      'X-RateLimit-Reset',
      Math.ceil(result.resetTime / 1000).toString(),
    )

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      reply.header('Retry-After', retryAfter.toString())

      return reply.status(429).send({
        success: false,
        message:
          type === 'booking'
            ? 'Vous avez atteint la limite de réservations. Veuillez réessayer plus tard.'
            : type === 'message'
              ? 'Vous envoyez trop de messages. Veuillez patienter quelques instants.'
              : 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter,
      })
    }
  }
}

export const bookingRateLimit = createRateLimitMiddleware('booking')
export const messageRateLimit = createRateLimitMiddleware('message')
export const generalRateLimit = createRateLimitMiddleware('general')
