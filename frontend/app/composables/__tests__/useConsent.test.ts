import { beforeEach, describe, expect, it } from 'vitest'
import { useConsent } from '../useConsent'

describe('useConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lit l’état initial depuis localStorage', () => {
    expect(useConsent().hasAnalyticsConsent()).toBe(false)

    localStorage.setItem('medicote_analytics_consent', 'true')

    expect(useConsent().hasAnalyticsConsent()).toBe(true)
  })

  it('grantAnalyticsConsent persiste le consentement', () => {
    const consent = useConsent()

    consent.grantAnalyticsConsent()

    expect(localStorage.getItem('medicote_analytics_consent')).toBe('true')
    expect(consent.hasAnalyticsConsent()).toBe(true)
  })

  it('revokeAnalyticsConsent retire le consentement', () => {
    localStorage.setItem('medicote_analytics_consent', 'true')
    const consent = useConsent()

    consent.revokeAnalyticsConsent()

    expect(localStorage.getItem('medicote_analytics_consent')).toBeNull()
    expect(consent.hasAnalyticsConsent()).toBe(false)
  })
})
