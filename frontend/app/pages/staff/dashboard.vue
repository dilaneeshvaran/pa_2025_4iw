<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <div class="mb-2 flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">
            Tableau de bord personnel
          </h1>
          <span
            v-if="dashboard?.assignedTo"
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              dashboard.assignedTo.type === 'cabinet'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800',
            ]"
          >
            <component
              :is="dashboard.assignedTo.type === 'cabinet' ? Building : User"
              class="mr-1 h-3.5 w-3.5"
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
          class="mt-2 space-y-1 text-sm text-gray-600"
        >
          <p>
            Affecté à :
            <strong class="text-gray-900">{{
              dashboard.assignedTo.name
            }}</strong>
          </p>
          <div class="mt-2 flex items-center gap-4 text-gray-500">
            <div
              v-if="dashboard.assignedTo.address"
              class="flex items-center gap-1.5"
            >
              <MapPin class="h-4 w-4 shrink-0" />
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
              <Phone class="h-4 w-4 shrink-0" />
              <span>{{ dashboard.assignedTo.phone }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- kpi -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100"
          >
            <Users class="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Praticiens gérés</p>
            <p
              v-if="loading"
              class="h-7 w-12 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ dashboard?.practitioners?.length ?? 0 }}
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

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100"
          >
            <ClipboardList class="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Votre rôle</p>
            <p class="text-lg font-semibold text-gray-900">
              {{ dashboard?.staff?.position || "Personnel" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- practitioners list -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        Praticiens que vous gérez
      </h3>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100"></div>
      </div>

      <div
        v-else-if="!dashboard?.practitioners?.length"
        class="py-8 text-center"
      >
        <Users class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucun praticien assigné</p>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="prac in dashboard.practitioners"
          :key="prac.id"
          :to="`/staff/agenda/${prac.id}`"
          class="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-teal-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100"
            >
              <span class="text-sm font-bold text-teal-600">
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
          <div class="flex items-center gap-2 text-sm text-teal-600">
            <Calendar class="h-4 w-4" />
            Voir l'agenda
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- today's appointments -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        Rendez-vous d'aujourd'hui
      </h3>

      <div
        v-if="!loading && !dashboard?.todayAppointments?.length"
        class="py-6 text-center"
      >
        <Calendar class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucun rendez-vous aujourd'hui</p>
      </div>

      <div v-else-if="!loading" class="space-y-2">
        <div
          v-for="apt in dashboard?.todayAppointments"
          :key="apt.id"
          class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
        >
          <div>
            <p class="font-medium text-gray-900">{{ apt.patientName }}</p>
            <p class="text-sm text-gray-500">
              {{ apt.startTime }} - {{ apt.endTime }} ·
              {{ apt.practitionerName }}
            </p>
          </div>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-xs font-medium',
              apt.status === 'CONFIRMED'
                ? 'bg-green-100 text-green-700'
                : apt.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700',
            ]"
          >
            {{
              apt.status === "CONFIRMED"
                ? "Confirmé"
                : apt.status === "CANCELLED"
                  ? "Annulé"
                  : apt.status
            }}
          </span>
        </div>
      </div>
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
  middleware: "auth",
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
