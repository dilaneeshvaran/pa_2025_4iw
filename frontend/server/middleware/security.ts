import { defineEventHandler, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const umamiUrl = config.public?.umamiUrl || ''

  let umamiOrigin = ''
  if (umamiUrl) {
    try {
      const url = new URL(umamiUrl as string)
      umamiOrigin = url.origin
    } catch {
    }
  }

  const csp = [
    "default-src 'self'",
    // script-src: self, inline scripts, stripe scripts, google accounts, and optional umami
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com" + (umamiOrigin ? ` ${umamiOrigin}` : ''),
    // style-src: self, inline styles, google fonts api
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // font-src: self, google fonts gstatic, data: uri
    "font-src 'self' https://fonts.gstatic.com data:",
    // img-src: self, data:, blob:, openstreetmap tile subdomains
    "img-src 'self' data: blob: https://*.openstreetmap.org https://tile.openstreetmap.org",
    // connect-src: self, websocket protocols, backend API local port, stripe API, google accounts, and optional umami
    "connect-src 'self' ws: wss: http://localhost:3001 https://api.stripe.com https://accounts.google.com" + (umamiOrigin ? ` ${umamiOrigin}` : ''),
    // frame-src: self, stripe checkout, google accounts
    "frame-src 'self' https://js.stripe.com https://accounts.google.com",
    // frame-ancestors: self (protect against clickjacking)
    "frame-ancestors 'self'",
    // object-src: none (disallow plugins like flash)
    "object-src 'none'",
    // base-uri: self (restrict document base URL to own domain)
    "base-uri 'self'",
  ].join('; ')

  setResponseHeaders(event, {
    'Content-Security-Policy': csp,
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), payment=(self)',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  })
})
