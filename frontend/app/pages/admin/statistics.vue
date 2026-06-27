<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-2xl font-bold text-gray-900">
          Statistiques globales
        </h1>
        <p class="text-gray-600">Vue d'ensemble de l'activité de la plateforme.</p>
      </div>
      <button
        class="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
        :disabled="loading"
        @click="fetchStatistics"
      >
        Actualiser
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 p-4 text-red-800">
      {{ fetchError }}
    </div>

    <div v-else-if="data" class="space-y-8">
      <!-- KPI cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-xl border border-gray-200 bg-white p-4"
        >
          <p class="text-sm text-gray-500">{{ kpi.label }}</p>
          <p class="mt-1 text-2xl font-bold" :class="kpi.color">
            {{ kpi.value }}
          </p>
          <p v-if="kpi.sub" class="text-xs text-gray-400">{{ kpi.sub }}</p>
        </div>
      </div>

      <!-- users growth -->
      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Croissance des inscriptions (12 mois)
          </h2>
          <div class="flex items-center gap-4 text-xs text-gray-600">
            <span class="flex items-center gap-1">
              <span class="h-3 w-3 rounded-sm bg-blue-500" /> Patients
            </span>
            <span class="flex items-center gap-1">
              <span class="h-3 w-3 rounded-sm bg-orange-500" /> Praticiens
            </span>
          </div>
        </div>
        <div class="flex h-48 items-end gap-2">
          <div
            v-for="(m, i) in data.usersGrowth"
            :key="i"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div class="flex h-40 w-full items-end justify-center gap-0.5">
              <div
                class="w-1/2 rounded-t bg-blue-500 transition-all"
                :style="{ height: barHeight(m.patients, maxGrowth) }"
                :title="`${m.patients} patients`"
              />
              <div
                class="w-1/2 rounded-t bg-orange-500 transition-all"
                :style="{ height: barHeight(m.practitioners, maxGrowth) }"
                :title="`${m.practitioners} praticiens`"
              />
            </div>
            <span class="text-[10px] text-gray-400">{{ m.label }}</span>
          </div>
        </div>
      </section>

      <!-- appointments + revenue per month -->
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Rendez-vous par mois
          </h2>
          <div class="flex h-40 items-end gap-1.5">
            <div
              v-for="(m, i) in data.appointmentsByMonth"
              :key="i"
              class="flex flex-1 flex-col items-center gap-1"
            >
              <div class="flex h-32 w-full items-end justify-center">
                <div
                  class="w-3/4 rounded-t bg-teal-500 transition-all"
                  :style="{ height: barHeight(m.total, maxAppts) }"
                  :title="`${m.total} RDV (${m.completed} terminés)`"
                />
              </div>
              <span class="text-[10px] text-gray-400">{{ m.label }}</span>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Revenus par mois ({{ data.overview.currency }})
          </h2>
          <div class="flex h-40 items-end gap-1.5">
            <div
              v-for="(m, i) in data.revenueByMonth"
              :key="i"
              class="flex flex-1 flex-col items-center gap-1"
            >
              <div class="flex h-32 w-full items-end justify-center">
                <div
                  class="w-3/4 rounded-t bg-green-500 transition-all"
                  :style="{ height: barHeight(m.amount, maxRevenue) }"
                  :title="`${formatNumber(m.amount)} ${data.overview.currency}`"
                />
              </div>
              <span class="text-[10px] text-gray-400">{{ m.label }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- distributions -->
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Rendez-vous par statut
          </h2>
          <div class="space-y-3">
            <div
              v-for="row in data.appointmentStatusDistribution"
              :key="row.status"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-gray-700">{{
                  apptStatusLabel(row.status)
                }}</span>
                <span class="font-medium text-gray-900">{{ row.count }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-100">
                <div
                  class="h-2 rounded-full bg-teal-500"
                  :style="{
                    width: barWidth(row.count, data.overview.totalAppointments),
                  }"
                />
              </div>
            </div>
            <p
              v-if="data.appointmentStatusDistribution.length === 0"
              class="text-sm text-gray-500"
            >
              Aucune donnée
            </p>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Abonnements par plan
          </h2>
          <div class="space-y-3">
            <div
              v-for="row in data.subscriptionPlanDistribution"
              :key="row.plan"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-gray-700">{{ row.plan }}</span>
                <span class="font-medium text-gray-900">{{ row.count }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-100">
                <div
                  class="h-2 rounded-full bg-orange-500"
                  :style="{ width: barWidth(row.count, totalSubs) }"
                />
              </div>
            </div>
            <p
              v-if="data.subscriptionPlanDistribution.length === 0"
              class="text-sm text-gray-500"
            >
              Aucune donnée
            </p>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            Top spécialités
          </h2>
          <div class="space-y-3">
            <div v-for="row in data.topSpecialties" :key="row.name">
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-gray-700">{{ row.name }}</span>
                <span class="font-medium text-gray-900">{{ row.count }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-100">
                <div
                  class="h-2 rounded-full bg-purple-500"
                  :style="{ width: barWidth(row.count, maxSpecialty) }"
                />
              </div>
            </div>
            <p
              v-if="data.topSpecialties.length === 0"
              class="text-sm text-gray-500"
            >
              Aucune donnée
            </p>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Top villes</h2>
          <div class="space-y-3">
            <div v-for="row in data.topCities" :key="row.city">
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-gray-700">{{ row.city }}</span>
                <span class="font-medium text-gray-900">{{ row.count }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-100">
                <div
                  class="h-2 rounded-full bg-blue-500"
                  :style="{ width: barWidth(row.count, maxCity) }"
                />
              </div>
            </div>
            <p v-if="data.topCities.length === 0" class="text-sm text-gray-500">
              Aucune donnée
            </p>
          </div>
        </section>
      </div>

      <p class="text-right text-xs text-gray-400">
        Généré le {{ formatDateTime(data.generatedAt) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

interface Statistics {
  overview: {
    totalUsers: number;
    patients: number;
    practitioners: number;
    staff: number;
    cabinetAdmins: number;
    admins: number;
    cabinets: number;
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    currency: string;
    averageRating: number;
    totalReviews: number;
    activeSubscriptions: number;
  };
  usersGrowth: { label: string; patients: number; practitioners: number }[];
  appointmentsByMonth: { label: string; total: number; completed: number }[];
  revenueByMonth: { label: string; amount: number }[];
  appointmentStatusDistribution: { status: string; count: number }[];
  subscriptionPlanDistribution: { plan: string; count: number }[];
  topSpecialties: { name: string; count: number }[];
  topCities: { city: string; count: number }[];
  generatedAt: string;
}

const data = ref<Statistics | null>(null);
const loading = ref(true);
const fetchError = ref("");

const kpis = computed(() => {
  if (!data.value) return [];
  const o = data.value.overview;
  return [
    { label: "Utilisateurs", value: o.totalUsers, color: "text-gray-900", sub: "" },
    { label: "Patients", value: o.patients, color: "text-blue-600", sub: "" },
    {
      label: "Praticiens",
      value: o.practitioners,
      color: "text-orange-600",
      sub: "",
    },
    { label: "Cabinets", value: o.cabinets, color: "text-purple-600", sub: "" },
    {
      label: "Rendez-vous",
      value: o.totalAppointments,
      sub: `${o.completedAppointments} terminés`,
      color: "text-teal-600",
    },
    {
      label: "Revenus",
      value: `${formatNumber(o.totalRevenue)} ${o.currency}`,
      color: "text-green-600",
      sub: "",
    },
    {
      label: "Note moyenne",
      value: o.averageRating ? `${o.averageRating}/5` : "—",
      sub: `${o.totalReviews} avis`,
      color: "text-yellow-600",
    },
    {
      label: "Abonnements actifs",
      value: o.activeSubscriptions,
      color: "text-gray-900",
      sub: "",
    },
  ];
});

const maxGrowth = computed(() =>
  Math.max(
    1,
    ...(data.value?.usersGrowth.flatMap((m) => [m.patients, m.practitioners]) ??
      [0]),
  ),
);
const maxAppts = computed(() =>
  Math.max(1, ...(data.value?.appointmentsByMonth.map((m) => m.total) ?? [0])),
);
const maxRevenue = computed(() =>
  Math.max(1, ...(data.value?.revenueByMonth.map((m) => m.amount) ?? [0])),
);
const totalSubs = computed(() =>
  Math.max(
    1,
    (data.value?.subscriptionPlanDistribution ?? []).reduce(
      (s, r) => s + r.count,
      0,
    ),
  ),
);
const maxSpecialty = computed(() =>
  Math.max(1, ...(data.value?.topSpecialties.map((r) => r.count) ?? [0])),
);
const maxCity = computed(() =>
  Math.max(1, ...(data.value?.topCities.map((r) => r.count) ?? [0])),
);

function barHeight(value: number, max: number) {
  return `${Math.round((value / max) * 100)}%`;
}
function barWidth(value: number, max: number) {
  return `${Math.max(2, Math.round((value / max) * 100))}%`;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function apptStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmés",
    COMPLETED: "Terminés",
    CANCELLED: "Annulés",
    NO_SHOW: "Absences",
    RESCHEDULED: "Reportés",
  };
  return labels[status] || status;
}

async function fetchStatistics() {
  loading.value = true;
  fetchError.value = "";
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Statistics;
    }>("/admin/statistics");
    data.value = response.data;
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des statistiques";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStatistics);
</script>
