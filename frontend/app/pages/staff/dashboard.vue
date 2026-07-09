<template>
  <div>
    <div class="mb-8">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Tableau de bord personnel
            </h1>
            <span
              v-if="dashboard?.assignedTo"
              :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                dashboard.assignedTo.type === 'cabinet'
                  ? 'bg-purple-100/10 text-purple-700 dark:text-purple-300 border-purple-200/20'
                  : 'bg-[#D96F00]/10 text-[#D96F00] dark:text-orange-300 border-[#D96F00]/20',
              ]"
            >
              <component
                :is="dashboard.assignedTo.type === 'cabinet' ? Building : User"
                class="mr-1 h-3 w-3"
              />
              {{
                dashboard.assignedTo.type === "cabinet"
                  ? "Personnel Cabinet"
                  : "Personnel Praticien"
              }}
            </span>
          </div>

          <div
            v-if="dashboard?.assignedTo"
            class="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              Affecté à :
              <strong class="font-semibold text-gray-900 dark:text-gray-100">{{
                dashboard.assignedTo.name
              }}</strong>
            </p>
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div
                v-if="dashboard.assignedTo.address"
                class="flex items-center gap-1.5"
              >
                <MapPin class="h-3.5 w-3.5 shrink-0" :stroke-width="1.75" />
                <span>
                  {{ dashboard.assignedTo.address }}
                  <template v-if="dashboard.assignedTo.city"
                    >, {{ dashboard.assignedTo.city }}</template
                  >
                </span>
              </div>
              <div
                v-if="dashboard.assignedTo.phone"
                class="flex items-center gap-1.5"
              >
                <Phone class="h-3.5 w-3.5 shrink-0" :stroke-width="1.75" />
                <span>{{ dashboard.assignedTo.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    <!-- kpis -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- kpi 1 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#00804A]/30 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Praticiens gérés
            </p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {{ dashboard?.practitioners?.length ?? 0 }}
            </p>
          </div>
          <Users class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>

      <!-- kpi 2 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#D96F00]/30 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
              RDV aujourd'hui
            </p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {{ dashboard?.todayAppointmentsCount ?? 0 }}
            </p>
          </div>
          <Calendar class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>

      <!-- kpi 3 -->
      <div class="rounded-2xl border border-[#E5E3DC] border-t-2 border-t-[#00804A]/30 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Votre rôle
            </p>
            <p class="mt-1 font-display text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ dashboard?.staff?.position || "Personnel" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100 dark:border-gray-800"></div>

    <!-- content split -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- practitioners list -->
      <UiCard>
        <div class="mb-4 flex items-center gap-2">
          <Users class="h-4 w-4 text-[#00804A] dark:text-green-300" :stroke-width="1.75" />
          <h3 class="font-display text-base font-semibold text-gray-900 dark:text-gray-100">
            Praticiens que vous gérez
          </h3>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
        </div>

        <div
          v-else-if="!dashboard?.practitioners?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <Users class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800 dark:text-gray-200">Aucun praticien</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-500 dark:text-gray-400">Aucun praticien ne vous est assigné.</p>
        </div>

        <div v-else class="space-y-1">
          <NuxtLink
            v-for="prac in dashboard.practitioners"
            :key="prac.id"
            :to="`/staff/agenda/${prac.id}`"
            class="flex items-center justify-between rounded-lg border border-transparent p-3 transition-all duration-150 hover:border-black/[0.05] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400"
              >
                {{ prac.firstName[0] }}{{ prac.lastName[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ prac.specialties?.join(", ") || "-" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-semibold text-[#00804A] dark:text-green-300">
              <Calendar class="h-3.5 w-3.5" :stroke-width="1.75" />
              Voir agenda
            </div>
          </NuxtLink>
        </div>
      </UiCard>

      <!-- today's appointments -->
      <UiCard>
        <div class="mb-4 flex items-center gap-2">
          <Calendar class="h-4 w-4 text-[#D96F00] dark:text-orange-300" :stroke-width="1.75" />
          <h3 class="font-display text-base font-semibold text-gray-900 dark:text-gray-100">
            Rendez-vous d'aujourd'hui
          </h3>
        </div>

        <div
          v-if="!loading && !dashboard?.todayAppointments?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <Calendar class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800 dark:text-gray-200">Aucun rendez-vous</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-500 dark:text-gray-400">Aucun rendez-vous programmé aujourd'hui.</p>
        </div>

        <div v-else-if="!loading" class="space-y-1">
          <div
            v-for="apt in dashboard?.todayAppointments"
            :key="apt.id"
            class="flex items-center justify-between rounded-lg border border-transparent p-3 hover:border-black/[0.05] hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ apt.patientName }}</p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                <span class="tabular-nums font-medium">{{ apt.startTime }} - {{ apt.endTime }}</span> ·
                {{ apt.practitionerName }}
              </p>
            </div>
            <UiBadge
              :variant="
                apt.status === 'CONFIRMED'
                  ? 'success'
                  : apt.status === 'CANCELLED'
                    ? 'danger'
                    : 'warning'
              "
            >
              {{
                apt.status === "CONFIRMED"
                  ? "Confirmé"
                  : apt.status === "CANCELLED"
                    ? "Annulé"
                    : apt.status
              }}
            </UiBadge>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Users,
  Calendar,
  ClipboardList,
  Building,
  User,
  MapPin,
  Phone,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "staff",
  middleware: "staff-only",
});

const authStore = useAuthStore();
const dashboard = ref<any>(null);
const loading = ref(true);

const fetchDashboard = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/dashboard");
    if (response.success) {
      dashboard.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching staff dashboard:", error);
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
