<template>
  <Teleport to="body">
    <Transition name="consent-slide">
      <div
        v-if="visible"
        class="fixed inset-x-0 bottom-0 z-[9999] border-t border-gray-200 bg-white shadow-2xl"
      >
        <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900">
                Consentement au traitement des données
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                Conformément au RGPD, nous avons besoin de votre consentement
                pour traiter vos données personnelles. Vos données sont
                utilisées uniquement pour vous fournir nos services médicaux et
                améliorer votre expérience. Consultez notre
                <a href="#" class="text-blue-600 underline hover:text-blue-700"
                  >politique de confidentialité</a
                >
                et nos
                <a href="#" class="text-blue-600 underline hover:text-blue-700"
                  >conditions générales d'utilisation</a
                >.
              </p>
            </div>
            <div class="flex shrink-0 gap-3">
              <button
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                @click="handleDecline"
              >
                Refuser
              </button>
              <button
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                :disabled="submitting"
                @click="handleAccept"
              >
                {{ submitting ? "Enregistrement..." : "Accepter tout" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const visible = ref(false);
const submitting = ref(false);

const CONSENT_KEY = "medicote_consent_given";
const CONSENT_TYPES = [
  "data_processing",
  "terms_of_service",
  "privacy_policy",
] as const;

const checkConsent = () => {
  // only show for authenticated users
  if (!authStore.isAuthenticated || !authStore.accessToken) {
    visible.value = false;
    return;
  }
  // check if already consented in this browser
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "true") {
    visible.value = false;
    return;
  }
  // check via api call to be sure (handles multiple devices, incognito and other cases)
  fetchConsentStatus();
};

const fetchConsentStatus = async () => {
  try {
    const config = useRuntimeConfig();
    const res = await $fetch<{
      success: boolean;
      data: Array<{
        consentType: string;
        accepted: boolean;
        revokedAt: string | null;
      }>;
    }>("/settings/consents", {
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });

    if (res.success) {
      const activeConsents = res.data.filter((c) => c.accepted && !c.revokedAt);
      const hasAll = CONSENT_TYPES.every((type) =>
        activeConsents.some((c) => c.consentType === type),
      );
      if (hasAll) {
        localStorage.setItem(CONSENT_KEY, "true");
        visible.value = false;
      } else {
        visible.value = true;
      }
    }
  } catch {
    // If api fails, show the banner to be safe
    visible.value = true;
  }
};

const handleAccept = async () => {
  submitting.value = true;
  try {
    const config = useRuntimeConfig();

    for (const consentType of CONSENT_TYPES) {
      await $fetch("/settings/consents", {
        method: "POST",
        baseURL: config.public.apiBase,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: {
          consentType,
          version: "1.0",
          accepted: true,
        },
      });
    }

    localStorage.setItem(CONSENT_KEY, "true");
    visible.value = false;
  } catch (e) {
    console.error("Error saving consent:", e);
  } finally {
    submitting.value = false;
  }
};

const handleDecline = () => {
  // still record the refusal
  const config = useRuntimeConfig();

  for (const consentType of CONSENT_TYPES) {
    $fetch("/settings/consents", {
      method: "POST",
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        consentType,
        version: "1.0",
        accepted: false,
      },
    }).catch(() => {});
  }

  // do not store in localstorage bcoz banner will reappear on next visit
  visible.value = false;

  // reshow after 30 seconds if user declined
  setTimeout(() => {
    if (authStore.isAuthenticated) {
      visible.value = true;
    }
  }, 30000);
};

// watch for auth state changes
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      checkConsent();
    } else {
      visible.value = false;
    }
  },
);

onMounted(() => {
  // small delay to let auth state init  on page load
  setTimeout(() => {
    checkConsent();
  }, 1000);
});
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
