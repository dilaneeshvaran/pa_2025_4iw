export default defineNuxtPlugin((nuxtApp) => {
  const { trackPageView, initAnalytics, isAnalyticsLoaded } = useAnalytics()
  const { hasAnalyticsConsent } = useConsent()

  nuxtApp.hook('app:mounted', () => {
    if (hasAnalyticsConsent()) {
      initAnalytics()
    }
  })

  const router = useRouter()
  router.afterEach((to) => {
    if (!isAnalyticsLoaded.value) return
    nextTick(() => {
      trackPageView(to.fullPath)
    })
  })
})
