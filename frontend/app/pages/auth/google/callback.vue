<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white dark:bg-gray-900 p-8 shadow-lg text-center">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-4">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Connexion en cours...
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Nous finalisons votre connexion avec Google.
        </p>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="space-y-4">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Erreur de connexion
        </h2>
        <div
          role="alert"
          class="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
        <NuxtLink
          to="/auth/login"
          class="inline-block rounded-md bg-orange-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Retour à la connexion
        </NuxtLink>
      </div>
    </div>

    <!-- Redirection overlay -->
    <UiRedirectingOverlay
      :show="showRedirecting"
      title="Connexion Google réussie !"
      message="Nous vous redirigeons vers votre espace personnel..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useGoogleAuth } from "~/composables/useGoogleAuth";
import { getDashboardPath } from "~/utils/authNavigation";

definePageMeta({
  middleware: "guest",
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const googleAuth = useGoogleAuth();

const loading = ref(true);
const errorMessage = ref("");
const showRedirecting = ref(false);

onMounted(async () => {
  try {
    const query = route.query as {
      accessToken?: string;
      refreshToken?: string;
      user?: string;
      redirect?: string;
      error?: string;
    };

    // Traiter le callback
    const { user, tokens, redirect } = googleAuth.handleCallback(query);

    // Hydrater le store Pinia
    authStore.setAuth(user, tokens);

    // Afficher l'overlay de redirection
    loading.value = false;
    showRedirecting.value = true;

    // Déterminer la destination
    let redirectTo = redirect;
    if (!redirectTo) {
      redirectTo = getDashboardPath(user.role);
    }

    // Redirection avec micro-animation
    setTimeout(async () => {
      await router.push(redirectTo);
    }, 1200);
  } catch (error: unknown) {
    loading.value = false;
    const err = error as { message?: string };
    errorMessage.value =
      err?.message ||
      "Une erreur est survenue lors de la connexion Google. Veuillez réessayer.";
  }
});
</script>
