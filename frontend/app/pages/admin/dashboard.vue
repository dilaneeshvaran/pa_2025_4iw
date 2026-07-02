<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-xl font-bold tracking-tight text-gray-900">
        Tableau de bord administrateur
      </h1>
      <p class="mt-1 text-sm text-gray-500">Vue d'ensemble de la plateforme MediCôte</p>
    </div>

    <!-- kpis -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(kpi, i) in kpiCards"
        :key="i"
        :class="[
          'rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300',
          kpi.borderColor,
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-400">
              {{ kpi.label }}
            </p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-16 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900">
              {{ kpi.value }}
            </p>
          </div>
          <component :is="kpi.icon" class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100"></div>

    <!-- RDV stats -->
    <UiCard>
      <div class="mb-4 flex items-center gap-2">
        <Calendar class="h-4 w-4 text-[#D96F00]" :stroke-width="1.75" />
        <h3 class="font-display text-base font-semibold text-gray-900">
          Rendez-vous ce mois
        </h3>
      </div>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div class="h-4 w-3/4 rounded bg-gray-200" />
        <div class="h-4 w-1/2 rounded bg-gray-200" />
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-4">
        <div class="rounded-lg border border-black/[0.05] bg-gray-50/50 p-4 text-center">
          <p class="font-display text-2xl font-bold tabular-nums text-gray-900">
            {{ dashboard?.appointmentStats.total ?? 0 }}
          </p>
          <p class="mt-1 text-xs font-medium text-gray-500">Total</p>
        </div>
        <div class="rounded-lg border border-[#00804A]/10 bg-[#00804A]/5 p-4 text-center">
          <p class="font-display text-2xl font-bold tabular-nums text-[#00804A]">
            {{ dashboard?.appointmentStats.confirmed ?? 0 }}
          </p>
          <p class="mt-1 text-xs font-medium text-[#00804A]">Confirmés</p>
        </div>
        <div class="rounded-lg border-red-500/10 bg-red-500/5 p-4 text-center">
          <p class="font-display text-2xl font-bold tabular-nums text-red-600">
            {{ dashboard?.appointmentStats.cancelled ?? 0 }}
          </p>
          <p class="mt-1 text-xs font-medium text-red-500">Annulés</p>
        </div>
        <div class="rounded-lg border-[#D96F00]/10 bg-[#D96F00]/5 p-4 text-center">
          <p class="font-display text-2xl font-bold tabular-nums text-[#D96F00]">
            {{ dashboard?.appointmentStats.noShows ?? 0 }}
          </p>
          <p class="mt-1 text-xs font-medium text-[#D96F00]">No-shows</p>
        </div>
      </div>
    </UiCard>

    <!-- growth grid -->
    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <!-- new patients -->
      <UiCard>
        <div class="mb-4 flex items-center gap-2">
          <Users class="h-4 w-4 text-[#D96F00]" :stroke-width="1.75" />
          <h3 class="font-display text-base font-semibold text-gray-900">
            Nouveaux patients (6 derniers mois)
          </h3>
        </div>
        <div v-if="loading" class="animate-pulse space-y-2">
          <div v-for="i in 6" :key="i" class="h-8 rounded bg-gray-200" />
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="item in dashboard?.patientsLast6Months"
            :key="item.month"
            class="flex items-center justify-between rounded-lg border border-transparent px-4 py-2 hover:border-black/[0.05] hover:bg-gray-50"
          >
            <span class="text-sm font-medium capitalize text-gray-700">
              {{ item.month }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gray-600"
            >
              {{ item.count }}
            </span>
          </div>
        </div>
      </UiCard>

      <!-- new practitioners -->
      <UiCard>
        <div class="mb-4 flex items-center gap-2">
          <Stethoscope class="h-4 w-4 text-[#00804A]" :stroke-width="1.75" />
          <h3 class="font-display text-base font-semibold text-gray-900">
            Nouveaux praticiens (6 derniers mois)
          </h3>
        </div>
        <div v-if="loading" class="animate-pulse space-y-2">
          <div v-for="i in 6" :key="i" class="h-8 rounded bg-gray-200" />
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="item in dashboard?.practitionersLast6Months"
            :key="item.month"
            class="flex items-center justify-between rounded-lg border border-transparent px-4 py-2 hover:border-black/[0.05] hover:bg-gray-50"
          >
            <span class="text-sm font-medium capitalize text-gray-700">
              {{ item.month }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gray-600"
            >
              {{ item.count }}
            </span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- lists grid -->
    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <!-- unpaid subscriptions -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CreditCard class="h-4 w-4 text-red-500" :stroke-width="1.75" />
            <h3 class="font-display text-base font-semibold text-gray-900">
              Abonnements impayés
            </h3>
          </div>
          <UiButton variant="ghost" size="sm" :disabled="true">
            Voir tout
          </UiButton>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 rounded bg-gray-200" />
        </div>

        <div
          v-else-if="!dashboard?.unpaidSubscriptions?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <CreditCard class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Tout est à jour</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">Aucun abonnement impayé pour le moment.</p>
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="sub in dashboard.unpaidSubscriptions"
            :key="sub.id"
            class="flex items-center justify-between rounded-lg border border-transparent px-4 py-3 hover:border-black/[0.05] hover:bg-gray-50"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">
                Dr. {{ sub.practitioner.firstName }}
                {{ sub.practitioner.lastName }}
              </p>
              <p class="text-xs text-gray-500">{{ sub.practitioner.email }}</p>
            </div>
            <div class="text-right">
              <UiBadge variant="danger">
                {{ sub.status === "ACTIVE" ? "Expiré" : sub.status }}
              </UiBadge>
              <p
                v-if="sub.currentPeriodEnd"
                class="mt-1 text-[11px] tabular-nums text-gray-400"
              >
                Fin : {{ formatShortDate(sub.currentPeriodEnd) }}
              </p>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- no-show patients -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-[#D96F00]" :stroke-width="1.75" />
            <h3 class="font-display text-base font-semibold text-gray-900">
              Patients avec no-shows
            </h3>
          </div>
          <UiButton variant="ghost" size="sm" :disabled="true">
            Voir tout
          </UiButton>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 rounded bg-gray-200" />
        </div>

        <div
          v-else-if="!dashboard?.noShowPatients?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <AlertTriangle class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Aucun no-show</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">Aucun no-show enregistré.</p>
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="patient in dashboard.noShowPatients"
            :key="patient.id"
            class="flex items-center justify-between rounded-lg border border-transparent px-4 py-3 hover:border-black/[0.05] hover:bg-gray-50"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ patient.firstName }} {{ patient.lastName }}
              </p>
              <p class="text-xs text-gray-500">{{ patient.email }}</p>
            </div>
            <div class="text-right">
              <UiBadge variant="warning">
                {{ patient.noShowCount }} no-show{{
                  patient.noShowCount > 1 ? "s" : ""
                }}
              </UiBadge>
              <p
                v-if="
                  patient.penaltyUntil &&
                  new Date(patient.penaltyUntil) > new Date()
                "
                class="mt-1 text-[11px] tabular-nums text-red-500"
              >
                Sanction jusqu'au {{ formatShortDate(patient.penaltyUntil) }}
              </p>
            </div>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Users,
  Stethoscope,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

const authStore = useAuthStore();


interface MonthlyCount {
  month: string;
  count: number;
}

interface UnpaidSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

interface NoShowPatient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  noShowCount: number;
  penaltyUntil: string | null;
}

interface AppointmentStats {
  total: number;
  confirmed: number;
  cancelled: number;
  noShows: number;
}

interface AdminDashboardData {
  unpaidSubscriptions: UnpaidSubscription[];
  noShowPatients: NoShowPatient[];
  newPatientsThisMonth: number;
  newPractitionersThisMonth: number;
  patientsLast6Months: MonthlyCount[];
  practitionersLast6Months: MonthlyCount[];
  appointmentStats: AppointmentStats;
}

const dashboard = ref<AdminDashboardData | null>(null);
const loading = ref(true);

const kpiCards = computed(() => [
  {
    label: "Nouveaux patients ce mois",
    value: dashboard.value?.newPatientsThisMonth ?? "-",
    icon: Users,
    borderColor: "border-t-2 border-t-[#D96F00]/30",
  },
  {
    label: "Nouveaux praticiens ce mois",
    value: dashboard.value?.newPractitionersThisMonth ?? "-",
    icon: Stethoscope,
    borderColor: "border-t-2 border-t-[#00804A]/30",
  },
  {
    label: "RDV ce mois",
    value: dashboard.value?.appointmentStats.total ?? "-",
    icon: Calendar,
    borderColor: "border-t-2 border-t-[#00804A]/30",
  },
  {
    label: "Abonnements impayés",
    value: dashboard.value?.unpaidSubscriptions.length ?? "-",
    icon: TrendingUp,
    borderColor: "border-t-2 border-t-[#D96F00]/30",
  },
]);

const formatShortDate = (dateStr: string) => {
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
      data: AdminDashboardData;
    }>("/admin/dashboard");
    if (response.success) {
      dashboard.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
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
