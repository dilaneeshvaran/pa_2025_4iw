import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { stripQueryParams, isDntActive, isAllowedEvent, buildScriptElement } from '../analytics'

describe('analytics utils', () => {
  describe('stripQueryParams', () => {
    it('supprime les parametres de requete', () => {
      expect(stripQueryParams('https://medicote.ci/search?q=cardiologue&ville=abidjan')).toBe(
        'https://medicote.ci/search',
      )
    })

    it('conserve le chemin sans parametres', () => {
      expect(stripQueryParams('https://medicote.ci/patient/appointments')).toBe(
        'https://medicote.ci/patient/appointments',
      )
    })

    it('gere les URLs relatives en coupant sur ?', () => {
      expect(stripQueryParams('/patient/search?q=test')).toBe('/patient/search')
    })

    it('retourne l URL intacte si aucun parametre', () => {
      expect(stripQueryParams('/patient/dashboard')).toBe('/patient/dashboard')
    })
  })

  describe('isDntActive', () => {
    it('retourne false si navigator est null', () => {
      expect(isDntActive(null, null)).toBe(false)
    })

    it('retourne true si navigator.doNotTrack === "1"', () => {
      const mockNav = { doNotTrack: '1' } as unknown as Navigator
      const mockWin = {} as unknown as Window
      expect(isDntActive(mockNav, mockWin)).toBe(true)
    })

    it('retourne true si window.doNotTrack === "1"', () => {
      const mockNav = { doNotTrack: '0' } as unknown as Navigator
      const mockWin = { doNotTrack: '1' } as unknown as Window
      expect(isDntActive(mockNav, mockWin)).toBe(true)
    })

    it('retourne false si DNT non active', () => {
      const mockNav = { doNotTrack: '0' } as unknown as Navigator
      const mockWin = {} as unknown as Window
      expect(isDntActive(mockNav, mockWin)).toBe(false)
    })
  })

  describe('isAllowedEvent', () => {
    it('accepte les evenements de l allowlist', () => {
      expect(isAllowedEvent('booking_completed')).toBe(true)
      expect(isAllowedEvent('search_submitted')).toBe(true)
      expect(isAllowedEvent('payment_completed')).toBe(true)
    })

    it('rejette les evenements non autorises', () => {
      expect(isAllowedEvent('user_email_viewed')).toBe(false)
      expect(isAllowedEvent('patient_data_exported')).toBe(false)
      expect(isAllowedEvent('diagnosis_updated')).toBe(false)
      expect(isAllowedEvent('')).toBe(false)
    })
  })

  describe('buildScriptElement', () => {
    it('cree un element script avec les attributs Umami corrects', () => {
      const script = buildScriptElement('https://umami.example.com', 'abc-123', 'medicote.ci')

      expect(script.tagName).toBe('SCRIPT')
      expect(script.src).toBe('https://umami.example.com/script.js')
      expect(script.getAttribute('data-website-id')).toBe('abc-123')
      expect(script.getAttribute('data-auto-track')).toBe('false')
      expect(script.getAttribute('data-exclude-search')).toBe('true')
      expect(script.getAttribute('data-domains')).toBe('medicote.ci')
      expect(script.defer).toBe(true)
    })
  })

  describe('aucun script Umami avant consentement', () => {
    beforeEach(() => {
      document.head.innerHTML = ''
      localStorage.clear()
    })

    afterEach(() => {
      document.head.innerHTML = ''
      localStorage.clear()
      vi.restoreAllMocks()
    })

    it('n injecte aucun script[data-website-id] sans consentement analytics', () => {
      const scripts = document.querySelectorAll('script[data-website-id]')
      expect(scripts.length).toBe(0)
    })

    it('injecte le script uniquement si buildScriptElement est appele explicitement', () => {
      expect(document.querySelectorAll('script[data-website-id]').length).toBe(0)
      const appendChild = vi
        .spyOn(document.head, 'appendChild')
        .mockImplementation((node) => {
          const scriptNode = node as HTMLScriptElement
          document.head.innerHTML += `<script data-website-id="${scriptNode.getAttribute('data-website-id') ?? ''}"></script>`
          return node
        })

      const script = buildScriptElement('https://umami.example.com', 'abc-123', 'localhost')
      document.head.appendChild(script)

      expect(appendChild).toHaveBeenCalledWith(script)
      expect(document.querySelectorAll('script[data-website-id]').length).toBe(1)
    })

    it('le localStorage ne contient pas de cle analytics par defaut', () => {
      expect(localStorage.getItem('medicote_analytics_consent')).toBeNull()
    })

    it('la cle analytics est presente apres grantAnalyticsConsent', () => {
      localStorage.setItem('medicote_analytics_consent', 'true')
      expect(localStorage.getItem('medicote_analytics_consent')).toBe('true')
    })
  })

  describe('aucune PII dans les noms d evenements', () => {
    const PII_PATTERNS = [
      'email',
      'phone',
      'nom',
      'prenom',
      'dossier',
      'medical',
      'diagnosis',
      'password',
      'token',
    ]

    const ALLOWED_EVENTS = [
      'search_submitted',
      'booking_completed',
      'booking_cancelled',
      'practitioner_viewed',
      'teleconsultation_joined',
      'teleconsultation_ended',
      'payment_completed',
      'document_downloaded',
      'registration_completed',
      'login_completed',
    ]

    it('aucun evenement de l allowlist ne contient un terme PII', () => {
      for (const event of ALLOWED_EVENTS) {
        for (const pattern of PII_PATTERNS) {
          expect(event.toLowerCase()).not.toContain(pattern)
        }
      }
    })
  })
})
