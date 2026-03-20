<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Facturation</h1>
      <p class="text-gray-600">Gérez les paiements et factures</p>
    </div>

    <div class="mb-6 border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          class="whitespace-nowrap border-b-2 border-orange-500 px-1 pb-4 text-sm font-medium text-orange-600 transition-colors duration-200"
        >
          Paiements reçus / Factures
        </button>
      </nav>
    </div>

    <div v-if="loading" class="animate-pulse py-10 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else-if="!dashboard" class="py-10 text-center text-red-500">
      Erreur lors du chargement des données.
    </div>

    <div v-else class="space-y-6">
      <div
        v-if="dashboard.assignedTo?.type === 'cabinet'"
        class="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
      >
        <label class="text-sm font-medium text-gray-700"
          >Sélectionner un praticien :</label
        >
        <select
          v-model="selectedPractitionerId"
          class="min-w-[250px] rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
        >
          <option value="" disabled>-- Choisir --</option>
          <option
            v-for="prac in dashboard.practitioners"
            :key="prac.id"
            :value="prac.id"
          >
            {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
          </option>
        </select>
      </div>

      <div v-if="selectedPractitionerId">
        <PractitionerBillingReceived :practitionerId="selectedPractitionerId" />
      </div>
      <div
        v-else-if="dashboard.assignedTo?.type === 'cabinet'"
        class="rounded-lg border border-gray-100 bg-white py-10 text-center text-gray-500 shadow-sm"
      >
        Veuillez sélectionner un praticien pour voir ses factures.
      </div>
      <div
        v-else
        class="rounded-lg border border-gray-100 bg-white py-10 text-center text-gray-500 shadow-sm"
      >
        Aucun praticien assigné.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PractitionerBillingReceived from "~/components/practitioner/BillingReceived.vue";

definePageMeta({
  layout: "staff",
  middleware: "staff-only",
});

const loading = ref(true);
const dashboard = ref<any>(null);
const selectedPractitionerId = ref<string>("");

const fetchDashboard = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/dashboard");

    if (response.success) {
      dashboard.value = response.data;

      // autoselect if practitioner staff
      if (
        dashboard.value.assignedTo?.type === "practitioner" &&
        dashboard.value.practitioners?.length > 0
      ) {
        selectedPractitionerId.value = dashboard.value.practitioners[0].id;
      }

      // also autoselect if cabinet staff but only 1 practitioner
      if (
        dashboard.value.assignedTo?.type === "cabinet" &&
        dashboard.value.practitioners?.length === 1
      ) {
        selectedPractitionerId.value = dashboard.value.practitioners[0].id;
      }
    }
  } catch (error) {
    console.error("Error fetching staff dashboard:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>
