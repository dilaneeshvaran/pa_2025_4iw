<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">
        Tableau de bord administrateur
      </h1>
      <p class="text-gray-600">Vue d'ensemble de la plateforme MediCote</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard v-for="(kpi, i) in kpiCards" :key="i">
        <div class="flex items-center gap-4">
          <div
            :class="[
              'flex h-12 w-12 items-center justify-center rounded-lg',
              kpi.bgColor,
            ]"
          >
            <component :is="kpi.icon" :class="['h-6 w-6', kpi.iconColor]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500">{{ kpi.label }}</p>
            <p class="text-2xl font-bold text-gray-900">
              <span
                v-if="loading"
                class="inline-block h-7 w-16 animate-pulse rounded bg-gray-200"
              />
              <span v-else>{{ kpi.value }}</span>
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <UiCard>
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        <Calendar class="mr-2 inline h-5 w-5 text-orange-600" />
        RDV ce mois
      </h3>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div class="h-4 w-3/4 rounded bg-gray-200" />
        <div class="h-4 w-1/2 rounded bg-gray-200" />
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-4">
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-3xl font-bold text-gray-900">
            {{ dashboard?.appointmentStats.total ?? 0 }}
          </p>
          <p class="mt-1 text-sm text-gray-500">Total</p>
        </div>
        <div class="rounded-lg bg-green-50 p-4 text-center">
          <p class="text-3xl font-bold text-green-700">
            {{ dashboard?.appointmentStats.confirmed ?? 0 }}
          </p>
          <p class="mt-1 text-sm text-green-600">Confirmés</p>
        </div>
        <div class="rounded-lg bg-red-50 p-4 text-center">
          <p class="text-3xl font-bold text-red-700">
            {{ dashboard?.appointmentStats.cancelled ?? 0 }}
          </p>
          <p class="mt-1 text-sm text-red-600">Annulés</p>
        </div>
        <div class="rounded-lg bg-orange-50 p-4 text-center">
          <p class="text-3xl font-bold text-orange-700">
            {{ dashboard?.appointmentStats.noShows ?? 0 }}
          </p>
          <p class="mt-1 text-sm text-orange-600">No-shows</p>
        </div>
      </div>
    </UiCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <Users class="mr-2 inline h-5 w-5 text-orange-600" />
          Nouveaux patients (6 derniers mois)
        </h3>
        <div v-if="loading" class="animate-pulse space-y-2">
          <div v-for="i in 6" :key="i" class="h-8 rounded bg-gray-200" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in dashboard?.patientsLast6Months"
            :key="item.month"
            class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
          >
            <span class="text-sm font-medium capitalize text-gray-700">{{
              item.month
            }}</span>
            <span
              class="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-semibold text-orange-700"
            >
              {{ item.count }}
            </span>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <Stethoscope class="mr-2 inline h-5 w-5 text-green-600" />
          Nouveaux praticiens (6 derniers mois)
        </h3>
        <div v-if="loading" class="animate-pulse space-y-2">
          <div v-for="i in 6" :key="i" class="h-8 rounded bg-gray-200" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in dashboard?.practitionersLast6Months"
            :key="item.month"
            class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
          >
            <span class="text-sm font-medium capitalize text-gray-700">{{
              item.month
            }}</span>
            <span
              class="rounded-full bg-green-100 px-3 py-0.5 text-sm font-semibold text-green-700"
            >
              {{ item.count }}
            </span>
          </div>
        </div>
      </UiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            <CreditCard class="mr-2 inline h-5 w-5 text-red-500" />
            Abonnements impayés
          </h3>
          <UiButton variant="ghost" size="sm" :disabled="true">
            Voir tout
          </UiButton>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 rounded bg-gray-200" />
        </div>

        <div
          v-else-if="!dashboard?.unpaidSubscriptions?.length"
          class="py-6 text-center"
        >
          <CreditCard class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun abonnement impayé</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="sub in dashboard.unpaidSubscriptions"
            :key="sub.id"
            class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">
                Dr. {{ sub.practitioner.firstName }}
                {{ sub.practitioner.lastName }}
              </p>
              <p class="text-xs text-gray-500">{{ sub.practitioner.email }}</p>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                  sub.status === 'ACTIVE'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700',
                ]"
              >
                {{ sub.status === "ACTIVE" ? "Expiré" : sub.status }}
              </span>
              <p
                v-if="sub.currentPeriodEnd"
                class="mt-0.5 text-xs text-gray-400"
              >
                Fin : {{ formatShortDate(sub.currentPeriodEnd) }}
              </p>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            <AlertTriangle class="mr-2 inline h-5 w-5 text-orange-500" />
            Patients avec no-shows
          </h3>
          <UiButton variant="ghost" size="sm" :disabled="true">
            Voir tout
          </UiButton>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 rounded bg-gray-200" />
        </div>

        <div
          v-else-if="!dashboard?.noShowPatients?.length"
          class="py-6 text-center"
        >
          <AlertTriangle class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun no-show enregistré</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="patient in dashboard.noShowPatients"
            :key="patient.id"
            class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">
                {{ patient.firstName }} {{ patient.lastName }}
              </p>
              <p class="text-xs text-gray-500">{{ patient.email }}</p>
            </div>
            <div class="text-right">
              <span
                class="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700"
              >
                {{ patient.noShowCount }} no-show{{
                  patient.noShowCount > 1 ? "s" : ""
                }}
              </span>
              <p
                v-if="
                  patient.penaltyUntil &&
                  new Date(patient.penaltyUntil) > new Date()
                "
                class="mt-0.5 text-xs text-red-500"
              >
                Sanction jusqu'au {{ formatShortDate(patient.penaltyUntil) }}
              </p>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <UiCard>
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        <Zap class="mr-2 inline h-5 w-5 text-yellow-500" />
        Actions rapides
      </h3>
      <div class="flex flex-wrap gap-3">
        <UiButton variant="primary" :disabled="true">
          <UserPlus class="mr-2 h-4 w-4" />
          Créer admin
        </UiButton>
        <UiButton variant="outline" :disabled="true">
          <Send class="mr-2 h-4 w-4" />
          Message groupé
        </UiButton>
        <UiButton variant="outline" :disabled="true">
          <BadgeCheck class="mr-2 h-4 w-4" />
          Valider pros
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import {
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  AlertTriangle,
  UserPlus,
  Send,
  BadgeCheck,
  Zap,
  TrendingUp,
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
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    label: "Nouveaux praticiens ce mois",
    value: dashboard.value?.newPractitionersThisMonth ?? "-",
    icon: Stethoscope,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "RDV ce mois",
    value: dashboard.value?.appointmentStats.total ?? "-",
    icon: Calendar,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    label: "Abonnements impayés",
    value: dashboard.value?.unpaidSubscriptions.length ?? "-",
    icon: TrendingUp,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
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
