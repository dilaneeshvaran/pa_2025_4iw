const ANALYTICS_CONSENT_KEY = 'medicote_analytics_consent'

export function useConsent() {
  const hasAnalyticsConsent = (): boolean => {
    if (!import.meta.client) return false
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
  }

  const grantAnalyticsConsent = (): void => {
    if (!import.meta.client) return
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true')
  }

  const revokeAnalyticsConsent = (): void => {
    if (!import.meta.client) return
    localStorage.removeItem(ANALYTICS_CONSENT_KEY)
  }

  return { hasAnalyticsConsent, grantAnalyticsConsent, revokeAnalyticsConsent }
}
