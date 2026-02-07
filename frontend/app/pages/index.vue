<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
    <div class="mx-auto max-w-4xl space-y-8 text-center">
      <h1 class="text-5xl font-bold text-gray-900 md:text-6xl">
        Bienvenue sur <span class="text-blue-600">Medicote</span>
      </h1>

      <p class="mx-auto max-w-2xl text-xl text-gray-600">
        Plateforme de mise en relation entre patients et praticiens de santé en
        Côte d'Ivoire
      </p>

      <div
        class="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
      >
        <NuxtLink
          v-if="!authStore.isAuthenticated"
          to="/auth/register"
          class="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg"
        >
          Créer un compte patient
        </NuxtLink>

        <NuxtLink
          v-if="!authStore.isAuthenticated"
          to="/auth/login"
          class="rounded-md border-2 border-blue-600 px-8 py-3 text-lg font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Se connecter
        </NuxtLink>

        <div
          v-else
          class="rounded-md border border-green-300 bg-green-50 px-6 py-3 text-green-800"
        >
          Vous êtes connecté(e) en tant que {{ authStore.user?.email }}
        </div>
      </div>

      <!-- practitioner contact  -->
      <div class="pt-8">
        <NuxtLink
          to="/contact/practitioner"
          class="inline-flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
        >
          <span class="text-xl">⚕️</span>
          <span>Vous êtes soignant ?</span>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
        <div class="rounded-lg bg-white p-6 shadow-sm">
          <div class="mb-3 text-4xl text-blue-600">📅</div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            Prendre rendez-vous
          </h3>
          <p class="text-sm text-gray-600">
            Trouvez et réservez facilement un rendez-vous avec un praticien
          </p>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-sm">
          <div class="mb-3 text-4xl text-blue-600">👨‍⚕️</div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            Praticiens qualifiés
          </h3>
          <p class="text-sm text-gray-600">
            Accédez à un réseau de professionnels de santé vérifiés
          </p>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-sm">
          <div class="mb-3 text-4xl text-blue-600">💬</div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            Suivi personnalisé
          </h3>
          <p class="text-sm text-gray-600">
            Communiquez et suivez votre dossier médical en ligne
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
});
</script>
