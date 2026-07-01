import { describe, it, expect, vi, beforeEach } from 'vitest'
import securityMiddleware from '../../server/middleware/security'
import { setResponseHeaders } from 'h3'

vi.mock('h3', () => ({
  defineEventHandler: (handler: any) => handler,
  setResponseHeaders: vi.fn(),
}))

const mockRuntimeConfig = {
  public: {
    umamiUrl: 'https://analytics.example.com',
  },
}
vi.stubGlobal('useRuntimeConfig', () => mockRuntimeConfig)

describe('Nuxt Security Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set dynamic CSP and standard security headers', () => {
    const mockEvent = {} as any

    securityMiddleware(mockEvent)

    expect(setResponseHeaders).toHaveBeenCalled()
    const callArgs = vi.mocked(setResponseHeaders).mock.calls[0]
    const headers = callArgs[1] as Record<string, string>

    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains; preload',
    )
    expect(headers['Content-Security-Policy']).toContain(
      'https://analytics.example.com',
    )
    expect(headers['Content-Security-Policy']).toContain('https://js.stripe.com')
    expect(headers['Content-Security-Policy']).toContain(
      'https://*.openstreetmap.org',
    )
    expect(headers['Content-Security-Policy']).toContain("frame-src 'self' blob:")
  })

  it('should handle empty umamiUrl gracefully in CSP', () => {
    const mockEvent = {} as any
    mockRuntimeConfig.public.umamiUrl = ''

    securityMiddleware(mockEvent)

    expect(setResponseHeaders).toHaveBeenCalled()
    const callArgs = vi.mocked(setResponseHeaders).mock.calls[0]
    const headers = callArgs[1] as Record<string, string>

    // check that it doesnt contain 'undefined' or empty url in script src/connect src
    expect(headers['Content-Security-Policy']).not.toContain('undefined')
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
  })
})
