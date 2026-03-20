<template>
  <header class="bg-white shadow-sm">
    <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- logo -->
        <div class="flex-shrink-0">
          <NuxtLink to="/" class="text-2xl font-bold">
            <span class="text-orange-500">Medi</span
            ><span class="text-green-600">côte</span>
          </NuxtLink>
        </div>

        <div class="flex items-center space-x-4">
          <template v-if="!authStore.isAuthenticated">
            <NuxtLink
              to="/auth/login"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-orange-600"
            >
              Connexion
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              S'inscrire
            </NuxtLink>
          </template>

          <template v-else>
            <div class="flex items-center space-x-4">
              <NuxtLink
                :to="
                  authStore.user?.role === 'PATIENT'
                    ? '/patient/dashboard'
                    : '/practitioner/dashboard'
                "
                class="text-sm font-medium text-gray-700 transition-colors hover:text-orange-600"
              >
                Tableau de bord
              </NuxtLink>
              <span class="text-sm text-gray-700">
                Bonjour, {{ authStore.user?.email }}
              </span>
              <button
                class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-red-600"
                @click="handleLogout"
              >
                Déconnexion
              </button>
            </div>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// initialize auth state on mount
onMounted(() => {
  authStore.initAuth();
});

const handleLogout = () => {
  authStore.logout();
  router.push("/auth/login");
};
</script>
