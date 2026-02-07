<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Réinitialiser le mot de passe
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Entrez votre nouveau mot de passe
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
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

        <div v-if="!passwordReset" class="space-y-4">
          <div>
            <label
              for="newPassword"
              class="block text-sm font-medium text-gray-700"
            >
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p class="mt-1 text-xs text-gray-500">
              Le mot de passe doit contenir au moins 8 caractères, une
              majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700"
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="loading">Réinitialisation en cours...</span>
              <span v-else>Réinitialiser le mot de passe</span>
            </button>
          </div>
        </div>

        <div v-else class="space-y-4 text-center">
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
          <p class="text-gray-700">
            Votre mot de passe a été réinitialisé avec succès !
          </p>
          <p class="text-sm text-gray-500">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de
            passe.
          </p>
          <NuxtLink
            to="/auth/login"
            class="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Se connecter →
          </NuxtLink>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/auth/login"
            class="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Retour à la connexion
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  middleware: "guest",
});

const route = useRoute();
const auth = useAuth();

const formData = ref({
  newPassword: "",
  confirmPassword: "",
});

const token = ref("");
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const passwordReset = ref(false);

onMounted(() => {
  // get token from url query parameter
  token.value = (route.query.token as string) || "";

  if (!token.value) {
    errorMessage.value =
      "Token de réinitialisation manquant ou invalide. Veuillez demander un nouveau lien de réinitialisation.";
  }
});

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  // validate password confirmation
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    errorMessage.value = "Les mots de passe ne correspondent pas.";
    loading.value = false;
    return;
  }

  try {
    await auth.resetPassword({
      token: token.value,
      newPassword: formData.value.newPassword,
    });

    passwordReset.value = true;
    successMessage.value = "Mot de passe réinitialisé avec succès.";
  } catch (error: unknown) {
    console.error("Password reset error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de la réinitialisation du mot de passe. Le lien a peut-être expiré. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
};
</script>
