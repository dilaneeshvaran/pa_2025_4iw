<template>
  <Teleport to="body">
    <Transition name="consent-slide">
      <div
        v-if="visible"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
        class="fixed inset-x-0 bottom-0 z-[9999] border-t border-gray-200 bg-white shadow-2xl"
      >
        <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="flex-1">
              <h3 id="consent-title" class="text-base font-semibold text-gray-900">
                Consentement au traitement des données
              </h3>
              <p id="consent-desc" class="mt-1 text-sm text-gray-600">
                Conformément au RGPD, nous avons besoin de votre consentement
                pour traiter vos données personnelles. Vos données sont
                utilisées uniquement pour vous fournir nos services médicaux et
                améliorer votre expérience. Consultez notre
                <NuxtLink
                  to="/legal/privacy"
                  class="text-orange-600 underline hover:text-orange-600"
                  >politique de confidentialité</NuxtLink
                >
                et nos
                <NuxtLink
                  to="/legal/terms"
                  class="text-orange-600 underline hover:text-orange-600"
                  >conditions générales d'utilisation</NuxtLink
                >.
              </p>

              <div class="mt-3">
                <label class="flex cursor-pointer items-start gap-3">
                  <input
                    id="analytics-consent-checkbox"
                    v-model="analyticsAccepted"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    aria-describedby="analytics-consent-desc"
                  />
                  <span class="text-sm text-gray-700">
                    <span class="font-medium">Analytics anonymes (optionnel)</span>
                    <span id="analytics-consent-desc" class="ml-1 text-gray-500">
                      - Aide à améliorer MediCôte. Aucune donnée médicale ni personnelle n'est
                      collectée.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div class="flex shrink-0 gap-3">
              <button
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                @click="handleDecline"
              >
                Refuser
              </button>
              <button
                class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                :disabled="submitting"
                @click="handleAccept"
              >
                {{ submitting ? 'Enregistrement...' : 'Accepter' }}
              </button>
            </div>
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ liveMessage }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import {
  PUBLIC_CONSENT_STORAGE_KEY,
  shouldShowConsentBannerForLayout,
  shouldShowPublicConsentBanner,
} from '~/utils/consentVisibility'

const authStore = useAuthStore()
const route = useRoute()
const { initAnalytics, trackEvent, trackPageView } = useAnalytics()
const { grantAnalyticsConsent, revokeAnalyticsConsent } = useConsent()

const visible = ref(false)
const submitting = ref(false)
const analyticsAccepted = ref(false)
const liveMessage = ref('')
const isPublicConsent = ref(false)

const CONSENT_KEY = computed(() => {
  return authStore.user?.id ? `medicote_consent_given_${authStore.user.id}` : 'medicote_consent_given'
})
const ESSENTIAL_CONSENT_TYPES = ['data_processing', 'terms_of_service', 'privacy_policy'] as const

const applyAnalyticsChoice = () => {
  if (analyticsAccepted.value) {
    grantAnalyticsConsent()
    initAnalytics()
    trackPageView(route.fullPath)
  } else {
    revokeAnalyticsConsent()
  }
}

const checkPublicConsent = () => {
  if (!import.meta.client) {
    return
  }

  if (!shouldShowPublicConsentBanner(route.path, route.meta.layout)) {
    visible.value = false
    isPublicConsent.value = false
    return
  }

  if (localStorage.getItem(PUBLIC_CONSENT_STORAGE_KEY) === 'true') {
    visible.value = false
    isPublicConsent.value = false
    return
  }

  isPublicConsent.value = true
  visible.value = true
}

const checkConsent = () => {
  if (!import.meta.client) {
    return
  }

  if (!authStore.isAuthenticated || !authStore.accessToken) {
    checkPublicConsent()
    return
  }

  isPublicConsent.value = false

  if (!shouldShowConsentBannerForLayout(route.meta.layout)) {
    visible.value = false
    return
  }

  const stored = localStorage.getItem(CONSENT_KEY.value)
  if (stored === 'true') {
    visible.value = false
    return
  }
  fetchConsentStatus()
}

const fetchConsentStatus = async () => {
  try {
    const config = useRuntimeConfig()
    const res = await $fetch<{
      success: boolean
      data: Array<{
        consentType: string
        accepted: boolean
        revokedAt: string | null
      }>
    }>('/settings/consents', {
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    if (res.success) {
      const activeConsents = res.data.filter((c) => !c.revokedAt)
      const hasAll = ESSENTIAL_CONSENT_TYPES.every((type) =>
        activeConsents.some((c) => c.consentType === type),
      )
      if (hasAll) {
        localStorage.setItem(CONSENT_KEY.value, 'true')
        visible.value = false
      } else {
        visible.value = true
      }
    } else {
      visible.value = true
    }
  } catch {
    visible.value = true
  }
}

const saveConsents = async (types: string[], accepted: boolean) => {
  const config = useRuntimeConfig()
  for (const consentType of types) {
    await $fetch('/settings/consents', {
      method: 'POST',
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        consentType,
        version: '1.0',
        accepted,
      },
    })
  }
}

const handleAccept = async () => {
  submitting.value = true
  try {
    if (isPublicConsent.value) {
      applyAnalyticsChoice()
      localStorage.setItem(PUBLIC_CONSENT_STORAGE_KEY, 'true')
      liveMessage.value = 'Préférences enregistrées.'
      visible.value = false
      return
    }

    await saveConsents([...ESSENTIAL_CONSENT_TYPES], true)

    if (analyticsAccepted.value) {
      await saveConsents(['analytics'], true).catch(() => {})
      applyAnalyticsChoice()
      trackEvent('registration_completed')
    } else {
      revokeAnalyticsConsent()
    }

    localStorage.setItem(CONSENT_KEY.value, 'true')
    liveMessage.value = 'Consentement enregistré.'
    visible.value = false
  } catch (e) {
    console.error('Erreur lors de la sauvegarde du consentement :', e)
    liveMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    submitting.value = false
  }
}

const handleDecline = () => {
  if (isPublicConsent.value) {
    revokeAnalyticsConsent()
    localStorage.setItem(PUBLIC_CONSENT_STORAGE_KEY, 'true')
    liveMessage.value = 'Préférences enregistrées.'
    visible.value = false
    return
  }

  const config = useRuntimeConfig()
  for (const consentType of ESSENTIAL_CONSENT_TYPES) {
    $fetch('/settings/consents', {
      method: 'POST',
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        consentType,
        version: '1.0',
        accepted: false,
      },
    }).catch(() => {})
  }

  revokeAnalyticsConsent()
  localStorage.setItem(CONSENT_KEY.value, 'true')
  liveMessage.value = 'Consentement refusé.'
  visible.value = false
}

watch(
  () => authStore.isAuthenticated,
  () => {
    checkConsent()
  },
  { immediate: true },
)

const router = useRouter()
router.afterEach(() => {
  nextTick(() => {
    checkConsent()
  })
})
</script>

<style scoped>
.consent-slide-enter-active,
.consent-slide-leave-active {
  transition: transform 0.3s ease;
}
.consent-slide-enter-from,
.consent-slide-leave-to {
  transform: translateY(100%);
}
</style>
