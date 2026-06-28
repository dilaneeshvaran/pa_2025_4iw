<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div
      class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900"
    >
      <div>
        <h2
          class="text-center text-3xl font-bold text-gray-900 dark:text-gray-100"
        >
          Mot de passe oublié
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <!-- error message -->
        <div
          v-if="errorMessage"
          class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <!-- success message -->
        <div
          v-if="successMessage"
          class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200"
        >
          {{ successMessage }}
        </div>

        <div v-if="!emailSent">
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:placeholder-gray-500"
              placeholder="votre@email.com"
            />
          </div>

          <div class="mt-6">
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-md border border-transparent bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="loading">Envoi en cours...</span>
              <span v-else>Envoyer le lien de réinitialisation</span>
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
          <p class="text-gray-700 dark:text-gray-300">
            Un email avec les instructions de réinitialisation a été envoyé à
            <strong>{{ formData.email }}</strong>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Vérifiez votre boîte de réception et suivez les instructions.
          </p>
          <button
            type="button"
            class="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400"
            @click="resetForm"
          >
            Envoyer à une autre adresse
          </button>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/auth/login"
            class="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400"
          >
            ← Retour à la connexion
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  middleware: "guest",
  layout: "default",
});

const auth = useAuth();

const formData = ref({
  email: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const emailSent = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await auth.requestPasswordReset(formData.value);

    emailSent.value = true;
    successMessage.value = "Email envoyé avec succès.";
  } catch (error: unknown) {
    console.error("Password reset request error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  emailSent.value = false;
  formData.value.email = "";
  errorMessage.value = "";
  successMessage.value = "";
};
</script>
