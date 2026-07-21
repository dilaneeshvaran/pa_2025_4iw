<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-gray-900 p-8 shadow-lg">
      <div>
        <h1 class="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">Connexion</h1>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Connectez-vous à votre compte patient
        </p>
      </div>

      <!-- Standard Login Form -->
      <form v-if="!show2FAChallenge" class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <!-- error message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <!-- success message -->
        <div
          v-if="successMessage"
          role="status"
          class="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-200"
        >
          {{ successMessage }}
        </div>

        <!-- Google login button -->
        <div>
          <button
            type="button"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleGoogleLogin"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </button>
        </div>

        <!-- Google OAuth separator -->
        <div class="relative my-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">ou</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mot de passe
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              autocomplete="current-password"
              class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <NuxtLink
              to="/auth/forgot-password"
              class="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500"
            >
              Mot de passe oublié ?
            </NuxtLink>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-md border border-transparent bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading">Connexion en cours...</span>
            <span v-else>Se connecter</span>
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Vous n'avez pas de compte ?
            <NuxtLink
              :to="`/auth/register${route.query.redirect ? '?redirect=' + encodeURIComponent(route.query.redirect as string) : ''}`"
              class="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500"
            >
              Créer un compte
            </NuxtLink>
          </p>
        </div>

        </div>
      </form>

      <!-- 2FA Challenge Form -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="handle2FAVerify">
        <!-- error message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            Saisissez le code de 6 chiffres généré par votre application d'authentification ou un code de secours à 10 caractères.
          </p>

          <div>
            <label for="mfa-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Code de validation (2FA ou Secours)
            </label>
            <input
              id="mfa-code"
              v-model="mfaCode"
              type="text"
              required
              autocomplete="one-time-code"
              class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg font-mono font-bold tracking-widest"
              placeholder="000000"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="button"
            class="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            @click="show2FAChallenge = false; errorMessage = ''; mfaCode = '';"
          >
            Retour à la connexion
          </button>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !mfaCode"
            class="flex w-full justify-center rounded-md border border-transparent bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading">Vérification en cours...</span>
            <span v-else>Vérifier</span>
          </button>
        </div>
      </form>
    </div>

    <!-- redirection indicator -->
    <UiRedirectingOverlay
      :show="showRedirecting"
      title="Connexion réussie !"
      message="Nous vous redirigeons vers votre espace personnel..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useAuth } from "~/composables/useAuth";
import { useGoogleAuth } from "~/composables/useGoogleAuth";
import { getDashboardPath } from "~/utils/authNavigation";

definePageMeta({
  middleware: "guest",
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const auth = useAuth();
const googleAuth = useGoogleAuth();

const formData = ref({
  email: "",
  password: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showRedirecting = ref(false);

// 2FA login challenge state
const show2FAChallenge = ref(false);
const mfaToken = ref("");
const mfaCode = ref("");

// check for success message from email verification
onMounted(() => {
  if (route.query.verified === "true") {
    successMessage.value =
      "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.";
  }
  // Afficher l'erreur Google OAuth si présente
  if (route.query.error) {
    errorMessage.value = decodeURIComponent(route.query.error as string);
  }
});

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await auth.login(formData.value);

    // If 2FA is required, transition to the challenge view
    if (response.data && response.data.requires2FA) {
      mfaToken.value = response.data.mfaToken || "";
      show2FAChallenge.value = true;
      loading.value = false;
      return;
    }

    // store auth data - access data from the nested response structure
    authStore.setAuth(response.data.user, response.data.tokens);

    // check if email is verified
    if (!response.data.user.emailVerified) {
      // redirect to email verification notice page
      await router.push("/auth/verify-email-notice");
      return;
    }

    // Show redirection popup
    showRedirecting.value = true;

    // redirect to the appropriate dashboard based on user role
    let redirectTo = route.query.redirect as string;
    if (!redirectTo) {
      redirectTo = getDashboardPath(response.data.user.role);
    }
    
    // Smooth micro-interaction transition delay
    setTimeout(async () => {
      await router.push(redirectTo);
    }, 1200);
  } catch (error: unknown) {
    console.error("Login error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
  } finally {
    // Only disable loading state if not redirecting, to prevent double submission
    if (!showRedirecting.value && !show2FAChallenge.value) {
      loading.value = false;
    }
  }
};

const handle2FAVerify = async () => {
  if (!mfaCode.value) return;
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await auth.verify2fa({
      mfaToken: mfaToken.value,
      code: mfaCode.value,
    });

    // store auth data - access data from the nested response structure
    authStore.setAuth(response.data.user, response.data.tokens);

    // check if email is verified
    if (!response.data.user.emailVerified) {
      await router.push("/auth/verify-email-notice");
      return;
    }

    // Show redirection popup
    showRedirecting.value = true;

    // redirect to the appropriate dashboard based on user role
    let redirectTo = route.query.redirect as string;
    if (!redirectTo) {
      redirectTo = getDashboardPath(response.data.user.role);
    }

    // Smooth micro-interaction transition delay
    setTimeout(async () => {
      await router.push(redirectTo);
    }, 1200);
  } catch (error: unknown) {
    console.error("MFA verification error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Code invalide ou expiré. Veuillez réessayer.";
  } finally {
    if (!showRedirecting.value) {
      loading.value = false;
    }
  }
};

const handleGoogleLogin = () => {
  googleAuth.login(route.query.redirect as string);
};
</script>
