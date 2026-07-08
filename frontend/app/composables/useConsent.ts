const ANALYTICS_CONSENT_KEY = 'medicote_analytics_consent'

const isClient = () => import.meta.client || typeof window !== 'undefined'

export function useConsent() {
  const hasAnalyticsConsent = (): boolean => {
    if (!isClient()) return false
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
  }

  const grantAnalyticsConsent = (): void => {
    if (!isClient()) return
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true')
  }

  const revokeAnalyticsConsent = (): void => {
    if (!isClient()) return
    localStorage.removeItem(ANALYTICS_CONSENT_KEY)
  }

  return { hasAnalyticsConsent, grantAnalyticsConsent, revokeAnalyticsConsent }
}
