<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">
        Tableau de bord du cabinet
      </h1>
      <p class="text-gray-600">
        Bienvenue sur votre espace d'administration du cabinet
      </p>
    </div>

    <!-- kpi  -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100"
          >
            <Users class="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Praticiens</p>
            <p
              v-if="loading"
              class="h-7 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ dashboard?.practitionersCount ?? 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100"
          >
            <UserPlus class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Personnel</p>
            <p
              v-if="loading"
              class="h-7 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ dashboard?.staffCount ?? 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100"
          >
            <Calendar class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">RDV aujourd'hui</p>
            <p
              v-if="loading"
              class="h-7 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ dashboard?.todayAppointmentsCount ?? 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- practitioners list -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Praticiens du cabinet
        </h3>
        <button
          @click="navigateTo('/cabinet/practitioners')"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Voir tout →
        </button>
      </div>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100"></div>
      </div>

      <div
        v-else-if="!dashboard?.practitioners?.length"
        class="py-8 text-center"
      >
        <Users class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucun praticien dans ce cabinet</p>
        <button
          @click="navigateTo('/cabinet/practitioners')"
          class="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Inviter un praticien
        </button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="prac in dashboard.practitioners.slice(0, 5)"
          :key="prac.id"
          class="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100"
            >
              <span class="text-sm font-bold text-indigo-600">
                {{ prac.firstName[0] }}{{ prac.lastName[0] }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900">
                {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
              </p>
              <p class="text-sm text-gray-500">
                {{ prac.specialties?.join(", ") || "-" }}
              </p>
            </div>
          </div>
          <span class="text-xs text-gray-400">
            Rejoint le {{ formatDate(prac.joinedAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, UserPlus, Calendar } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "cabinet",
  middleware: "auth",
});

const authStore = useAuthStore();

const dashboard = ref<any>(null);
const loading = ref(true);

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fetchDashboard = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/cabinet/dashboard");
    if (response.success) {
      dashboard.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching cabinet dashboard:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchDashboard();
  } else {
    loading.value = false;
  }
});
</script>
