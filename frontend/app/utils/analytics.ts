export function stripQueryParams(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin + parsed.pathname
  } catch {
    return url.split('?')[0]
  }
}

export function isDntActive(nav: Navigator | null, win: Window | null): boolean {
  if (!nav || !win) return false
  return (
    nav.doNotTrack === '1' ||
    (win as unknown as Record<string, string>)['doNotTrack'] === '1' ||
    (nav as unknown as Record<string, string>)['msDoNotTrack'] === '1'
  )
}

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
] as const

export type AllowedEvent = (typeof ALLOWED_EVENTS)[number]

export function isAllowedEvent(eventName: string): eventName is AllowedEvent {
  return (ALLOWED_EVENTS as readonly string[]).includes(eventName)
}

export function buildScriptElement(umamiUrl: string, websiteId: string, hostname: string): HTMLScriptElement {
  const script = document.createElement('script')
  script.defer = true
  script.src = `${umamiUrl}/script.js`
  script.setAttribute('data-website-id', websiteId)
  script.setAttribute('data-auto-track', 'false')
  script.setAttribute('data-exclude-search', 'true')
  script.setAttribute('data-domains', hostname)
  return script
}
