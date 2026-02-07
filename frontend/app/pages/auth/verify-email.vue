<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div class="text-center">
        <!-- loading state -->
        <div v-if="loading" class="space-y-4">
          <div class="flex justify-center">
            <svg
              class="h-16 w-16 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            Vérification de votre email...
          </h2>
          <p class="text-sm text-gray-600">Veuillez patienter</p>
        </div>

        <!-- success state -->
        <div v-else-if="verified" class="animate-scale-in space-y-4">
          <div class="flex justify-center">
            <svg
              class="h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            Email vérifié avec succès !
          </h2>
          <p class="text-gray-600">
            Votre adresse email a été vérifiée. Vous pouvez maintenant vous
            connecter à votre compte.
          </p>
          <div class="pt-4">
            <NuxtLink
              to="/auth/login?verified=true"
              class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Se connecter
            </NuxtLink>
          </div>
        </div>

        <!-- error state -->
        <div v-else class="space-y-4">
          <div class="flex justify-center">
            <svg
              class="h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            Échec de la vérification
          </h2>
          <div
            class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {{ errorMessage }}
          </div>

          <!-- resend verification option -->
          <div class="space-y-4 pt-4">
            <p class="text-sm text-gray-600">
              Le lien a peut-être expiré ou est invalide.
            </p>

            <div v-if="!resendEmailSent">
              <form
                class="space-y-3"
                @submit.prevent="handleResendVerification"
              >
                <input
                  v-model="resendEmail"
                  type="email"
                  required
                  placeholder="Entrez votre email"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  :disabled="resendLoading"
                  class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span v-if="resendLoading">Envoi en cours...</span>
                  <span v-else>Renvoyer l'email de vérification</span>
                </button>
              </form>
            </div>

            <div
              v-else
              class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              Email de vérification renvoyé avec succès ! Vérifiez votre boîte
              de réception.
            </div>

            <NuxtLink
              to="/auth/login"
              class="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Retour à la connexion
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";

const route = useRoute();
const auth = useAuth();

const loading = ref(true);
const verified = ref(false);
const errorMessage = ref("");
const resendEmail = ref("");
const resendLoading = ref(false);
const resendEmailSent = ref(false);

onMounted(async () => {
  // get token from url query parameter
  const token = (route.query.token as string) || "";

  if (!token) {
    errorMessage.value =
      "Token de vérification manquant. Veuillez utiliser le lien envoyé dans votre email.";
    loading.value = false;
    return;
  }

  try {
    await auth.verifyEmail({ token });
    verified.value = true;
  } catch (error: unknown) {
    console.error("Email verification error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de la vérification de votre email. Le lien a peut-être expiré.";
  } finally {
    loading.value = false;
  }
});

const handleResendVerification = async () => {
  resendLoading.value = true;

  try {
    await auth.resendVerification({ email: resendEmail.value });
    resendEmailSent.value = true;
  } catch (error: unknown) {
    console.error("Resend verification error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.";
  } finally {
    resendLoading.value = false;
  }
};
</script>
