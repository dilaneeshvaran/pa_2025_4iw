<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">Connexion</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Connectez-vous à votre compte patient
        </p>
      </div>

      <!-- Standard Login Form -->
      <form v-if="!show2FAChallenge" class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <!-- error message -->
        <div
          v-if="errorMessage"
          class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {{ errorMessage }}
        </div>

        <!-- success message -->
        <div
          v-if="successMessage"
          class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {{ successMessage }}
        </div>

        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              autocomplete="current-password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <NuxtLink
              to="/auth/forgot-password"
              class="font-medium text-orange-600 hover:text-orange-500"
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
          <p class="text-sm text-gray-600">
            Vous n'avez pas de compte ?
            <NuxtLink
              :to="`/auth/register${route.query.redirect ? '?redirect=' + encodeURIComponent(route.query.redirect as string) : ''}`"
              class="font-medium text-orange-600 hover:text-orange-500"
            >
              Créer un compte
            </NuxtLink>
          </p>
        </div>
      </form>

      <!-- 2FA Challenge Form -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="handle2FAVerify">
        <!-- error message -->
        <div
          v-if="errorMessage"
          class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {{ errorMessage }}
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 text-center">
            Saisissez le code de 6 chiffres généré par votre application d'authentification ou un code de secours à 10 caractères.
          </p>

          <div>
            <label for="mfa-code" class="block text-sm font-medium text-gray-700">
              Code de validation (2FA ou Secours)
            </label>
            <input
              id="mfa-code"
              v-model="mfaCode"
              type="text"
              required
              autocomplete="one-time-code"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg font-mono font-bold tracking-widest"
              placeholder="000000"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="button"
            class="text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none"
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
import { getDashboardPath } from "~/utils/authNavigation";

definePageMeta({
  middleware: "guest",
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const auth = useAuth();

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
</script>
