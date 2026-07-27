import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useRuntimeConfig', vi.fn())

describe('useAnalytics', () => {
  let appendSpy: ReturnType<typeof vi.spyOn>
  let appendedScript: HTMLScriptElement | null

  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    appendedScript = null
    appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      appendedScript = node as HTMLScriptElement
      appendedScript.onload?.(new Event('load'))
      return node
    })
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        umamiEnabled: true,
        umamiUrl: 'https://analytics.example.test',
        umamiWebsiteId: 'site-1',
      },
    } as any)
    Object.defineProperty(navigator, 'doNotTrack', {
      value: '0',
      configurable: true,
    })
    Object.defineProperty(window, 'location', {
      value: { href: 'https://medicote.test/search?q=cardio', hostname: 'medicote.test' },
      configurable: true,
    })
    window.umami = { track: vi.fn() }
  })

  afterEach(() => {
    document.head.innerHTML = ''
    vi.restoreAllMocks()
    delete window.umami
  })

  it('initAnalytics injecte un script Umami une seule fois', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    const analytics = useAnalytics()

    analytics.initAnalytics()
    analytics.initAnalytics()

    expect(appendSpy).toHaveBeenCalledTimes(1)
    expect(appendedScript?.getAttribute('data-website-id')).toBe('site-1')
  })

  it('ne charge rien si Do Not Track est actif', async () => {
    Object.defineProperty(navigator, 'doNotTrack', {
      value: '1',
      configurable: true,
    })
    const { useAnalytics } = await import('../useAnalytics')

    useAnalytics().initAnalytics()

    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('trackEvent appelle umami seulement après chargement et pour un événement autorisé', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    const analytics = useAnalytics()
    analytics.initAnalytics()

    analytics.trackEvent('booking_completed', { source: 'test' })
    analytics.trackEvent('diagnosis_updated' as any)

    expect(window.umami?.track).toHaveBeenCalledTimes(1)
    expect(window.umami?.track).toHaveBeenCalledWith('booking_completed', {
      source: 'test',
    })
  })

  it('trackPageView supprime les paramètres de requête', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    const analytics = useAnalytics()
    analytics.initAnalytics()

    analytics.trackPageView('/search?q=cardio')

    expect(window.umami?.track).toHaveBeenCalledWith(expect.any(Function))
    const trackCallback = vi.mocked(window.umami!.track).mock.calls[0]![0] as (
      props: Record<string, any>,
    ) => Record<string, any>
    expect(trackCallback({ website: 'site-1', hostname: 'medicote.test' })).toEqual({
      website: 'site-1',
      hostname: 'medicote.test',
      url: '/search',
    })
  })
})
