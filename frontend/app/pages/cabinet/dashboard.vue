<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-xl font-bold tracking-tight text-gray-900">
        Tableau de bord du cabinet
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        Bienvenue sur votre espace d'administration du cabinet
      </p>
    </div>

    <!-- kpi  -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- kpi 1 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#00804A]/30 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500">Praticiens</p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900">
              {{ dashboard?.practitionersCount ?? 0 }}
            </p>
          </div>
          <Users class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>

      <!-- kpi 2 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#D96F00]/30 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500">Personnel</p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900">
              {{ dashboard?.staffCount ?? 0 }}
            </p>
          </div>
          <UserPlus class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>

      <!-- kpi 3 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#00804A]/30 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500">RDV aujourd'hui</p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900">
              {{ dashboard?.todayAppointmentsCount ?? 0 }}
            </p>
          </div>
          <Calendar class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100"></div>

    <!-- practitioners list -->
    <UiCard>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-display text-base font-semibold text-gray-900">
          Praticiens du cabinet
        </h3>
        <UiButton
          variant="ghost"
          size="sm"
          @click="navigateTo('/cabinet/practitioners')"
        >
          Voir tout →
        </UiButton>
      </div>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100"></div>
      </div>

      <div
        v-else-if="!dashboard?.practitioners?.length"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <Users class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
        <h3 class="font-display text-base font-semibold text-gray-800">Aucun praticien</h3>
        <p class="mt-1 max-w-[280px] text-sm text-gray-500">Aucun praticien dans ce cabinet.</p>
        <UiButton
          variant="outline"
          size="sm"
          class-name="mt-4"
          @click="navigateTo('/cabinet/practitioners')"
        >
          Inviter un praticien
        </UiButton>
      </div>

      <div v-else class="space-y-1">
        <div
          v-for="prac in dashboard.practitioners.slice(0, 5)"
          :key="prac.id"
          class="flex items-center justify-between rounded-lg border border-transparent p-3 hover:border-black/[0.05] hover:bg-gray-50 transition-all duration-150"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 shadow-inner"
            >
              <span>
                {{ prac.firstName[0] }}{{ prac.lastName[0] }}
              </span>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">
                {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
              </p>
              <p class="text-xs text-gray-500">
                {{ prac.specialties?.join(", ") || "-" }}
              </p>
            </div>
          </div>
          <span class="text-xs text-gray-500 tabular-nums">
            Rejoint le {{ formatDate(prac.joinedAt) }}
          </span>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { Users, UserPlus, Calendar } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "cabinet",
  middleware: "cabinet-admin-only",
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
