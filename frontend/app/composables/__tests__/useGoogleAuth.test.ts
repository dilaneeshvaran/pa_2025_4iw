import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGoogleAuth } from '../useGoogleAuth'

// Mock de Nuxt runtime config
const mockConfig = {
  public: {
    apiBase: 'http://localhost:3001/api'
  }
}

vi.mock('#app', () => ({
  useRuntimeConfig: () => mockConfig
}))

describe('useGoogleAuth', () => {
  let originalWindowLocation: Location

  beforeEach(() => {
    // Mock window.location
    originalWindowLocation = window.location
    delete (window as any).location
    window.location = { ...originalWindowLocation, href: '' } as any
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.location = originalWindowLocation
  })

  describe('login', () => {
    it('devrait rediriger vers l\'URL backend d\'initiation OAuth sans paramètre', () => {
      const { login } = useGoogleAuth()
      login()

      expect(window.location.href).toBe('http://localhost:3001/api/oauth/google')
    })

    it('devrait rediriger avec le paramètre redirectUrl', () => {
      const { login } = useGoogleAuth()
      login('/patient/dashboard')

      expect(window.location.href).toBe('http://localhost:3001/api/oauth/google?redirect=%2Fpatient%2Fdashboard')
    })
  })

  describe('handleCallback', () => {
    it('devrait parser correctement les tokens et l\'utilisateur', () => {
      const { handleCallback } = useGoogleAuth()
      const mockUser = { id: '123', email: 'test@gmail.com', role: 'PATIENT' }

      const result = handleCallback({
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        user: JSON.stringify(mockUser),
        redirect: '/patient/dashboard'
      })

      expect(result.tokens.accessToken).toBe('access-123')
      expect(result.tokens.refreshToken).toBe('refresh-123')
      expect(result.user).toEqual(mockUser)
      expect(result.redirect).toBe('/patient/dashboard')
    })

    it('devrait lancer une erreur si query.error est présent', () => {
      const { handleCallback } = useGoogleAuth()

      expect(() => {
        handleCallback({ error: 'Accès refusé' })
      }).toThrow('Accès refusé')
    })

    it('devrait lancer une erreur si les tokens sont manquants', () => {
      const { handleCallback } = useGoogleAuth()

      expect(() => {
        handleCallback({ accessToken: 'test' })
      }).toThrow('Données d\'authentification Google manquantes')
    })
  })
})
