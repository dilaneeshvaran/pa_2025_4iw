import Fastify from 'fastify'
import securityPlugin from '../security'

describe('Security Plugin', () => {
  it('should set security headers on all responses', async () => {
    const app = Fastify()
    await app.register(securityPlugin)

    app.get('/test', async () => {
      return { ok: true }
    })

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-security-policy']).toBe(
      "default-src 'none'; frame-ancestors 'none'; sandbox;",
    )
    expect(response.headers['strict-transport-security']).toBe(
      'max-age=63072000; includeSubDomains; preload',
    )
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
    expect(response.headers['x-xss-protection']).toBe('1; mode=block')
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(response.headers['cross-origin-resource-policy']).toBe('same-origin')
    expect(response.headers['x-dns-prefetch-control']).toBe('off')
    expect(response.headers['x-download-options']).toBe('noopen')
    expect(response.headers['x-permitted-cross-domain-policies']).toBe('none')
  })
})
