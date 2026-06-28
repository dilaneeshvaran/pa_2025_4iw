<template>
  <div
    class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4"
  >
    <div class="mx-auto max-w-4xl space-y-8 text-center">
      <h1
        class="text-5xl font-bold text-gray-900 dark:text-gray-100 md:text-6xl"
      >
        Bienvenue sur
        <span class="text-orange-500 dark:text-orange-400">Medi</span
        ><span class="text-green-600 dark:text-green-400">côte</span>
      </h1>

      <p
        class="mx-auto max-w-2xl text-lg italic text-gray-500 dark:text-gray-400"
      >
        « À côté des patients, nous sommes là à vos côtés »
      </p>

      <p class="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
        Plateforme de mise en relation entre patients et praticiens de santé en
        Côte d'Ivoire
      </p>

      <div
        class="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
      >
        <NuxtLink
          v-if="!authStore.isAuthenticated"
          to="/auth/register"
          class="rounded-md bg-orange-500 px-8 py-3 text-lg font-medium text-white shadow-md transition-colors hover:bg-orange-600 hover:shadow-lg"
        >
          Créer un compte patient
        </NuxtLink>

        <NuxtLink
          v-if="!authStore.isAuthenticated"
          to="/auth/login"
          class="rounded-md border-2 border-green-600 px-8 py-3 text-lg font-medium text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
        >
          Se connecter
        </NuxtLink>

        <div
          v-else
          class="rounded-md border border-green-300 bg-green-50 px-6 py-3 text-green-800 dark:bg-green-950/40 dark:text-green-200"
        >
          Vous êtes connecté(e) en tant que {{ authStore.user?.email }}
        </div>
      </div>

      <Card class="mt-8 p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <Input
            v-model="specialty"
            :icon="Search"
            placeholder="Spécialité, praticien..."
            class-name="w-full"
          />
          <Input
            v-model="location"
            :icon="MapPin"
            placeholder="Ville, quartier..."
            class-name="w-full"
          />
          <Button @click="handleSearch" class="w-full">
            <Search class="mr-2 h-5 w-5" />
            Rechercher
          </Button>
        </div>
      </Card>

      <!-- practitioner contact or dashboard button -->
      <div class="pt-8">
        <!-- Not authenticated: show practitioner contact -->
        <NuxtLink
          v-if="!authStore.isAuthenticated"
          to="/contact/practitioner"
          class="inline-flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-orange-950/40"
        >
          <span class="text-xl">⚕️</span>
          <span>Vous êtes soignant ?</span>
        </NuxtLink>

        <!-- authenticated ? then show dashboard button -->
        <NuxtLink
          v-else
          :to="dashboardPath"
          class="inline-flex items-center gap-2 rounded-md border-2 border-orange-500 bg-orange-500 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-orange-600"
        >
          <span class="text-xl">📊</span>
          <span>Accéder à mon tableau de bord</span>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="mb-3 text-4xl text-orange-500 dark:text-orange-400">
            📅
          </div>
          <h3
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Prendre rendez-vous
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Trouvez et réservez facilement un rendez-vous avec un praticien
          </p>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="mb-3 text-4xl text-green-600 dark:text-green-400">👨‍⚕️</div>
          <h3
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Praticiens qualifiés
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Accédez à un réseau de professionnels de santé vérifiés
          </p>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="mb-3 text-4xl text-orange-500 dark:text-orange-400">
            💬
          </div>
          <h3
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Suivi personnalisé
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Communiquez et suivez votre dossier médical en ligne
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { Search, MapPin } from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Input from "~/components/ui/Input.vue";
import Button from "~/components/ui/Button.vue";

const authStore = useAuthStore();
const specialty = ref("");
const location = ref("");

// compute dashboard path based on user role
const dashboardPath = computed(() => {
  switch (authStore.user?.role) {
    case "PATIENT":
      return "/patient/dashboard";
    case "PRACTITIONER":
      return "/practitioner/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/patient/dashboard";
  }
});

const handleSearch = () => {
  const query: Record<string, string> = {};

  if (specialty.value) {
    query.search = specialty.value;
  }

  if (location.value) {
    query.city = location.value;
  }

  navigateTo({
    path: "/search",
    query,
  });
};

onMounted(() => {
  authStore.initAuth();
});

definePageMeta({
  layout: "default",
});
</script>
