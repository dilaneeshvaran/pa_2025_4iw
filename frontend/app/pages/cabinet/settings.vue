<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Informations du cabinet
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Modifiez les informations et horaires de votre cabinet
      </p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-32 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      <div class="h-64 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-6">
      <!-- general info -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Informations générales
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nom du cabinet
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Téléphone
            </label>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
            />
          </div>
          <div class="sm:col-span-2">
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Adresse
            </label>
            <input
              v-model="form.address"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Ville
            </label>
            <input
              v-model="form.city"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      <!-- open hours -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Horaires d'ouverture
        </h3>
        <div class="space-y-3">
          <div
            v-for="day in daysOfWeek"
            :key="day.key"
            class="flex items-center gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-950"
          >
            <div class="w-28">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ day.label }}
              </label>
            </div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="!openHours[day.key]?.closed"
                @change="toggleDay(day.key)"
                class="rounded border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-700 dark:text-orange-400"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Ouvert</span
              >
            </label>
            <template v-if="!openHours[day.key]?.closed">
              <input
                v-model="openHours[day.key].open"
                type="time"
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700"
              />
              <span class="text-gray-400 dark:text-gray-500">-</span>
              <input
                v-model="openHours[day.key].close"
                type="time"
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700"
              />
            </template>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500"
              >Fermé</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="saveError"
        class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
      >
        {{ saveError }}
      </div>

      <div
        v-if="saveSuccess"
        class="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/40 dark:text-green-400"
      >
        Informations mises à jour avec succès !
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {{ saving ? "Enregistrement..." : "Enregistrer" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "cabinet",
  middleware: "cabinet-admin-only",
});

const authStore = useAuthStore();

const form = ref({
  name: "",
  address: "",
  city: "",
  phone: "",
});

const daysOfWeek = [
  { key: "MONDAY", label: "Lundi" },
  { key: "TUESDAY", label: "Mardi" },
  { key: "WEDNESDAY", label: "Mercredi" },
  { key: "THURSDAY", label: "Jeudi" },
  { key: "FRIDAY", label: "Vendredi" },
  { key: "SATURDAY", label: "Samedi" },
  { key: "SUNDAY", label: "Dimanche" },
];

const defaultOpenHours: Record<
  string,
  { open: string; close: string; closed: boolean }
> = {};
daysOfWeek.forEach((d) => {
  defaultOpenHours[d.key] = {
    open: "08:00",
    close: "18:00",
    closed: d.key === "SUNDAY",
  };
});

const openHours = ref<
  Record<string, { open: string; close: string; closed: boolean }>
>({ ...defaultOpenHours });

const loading = ref(true);
const saving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

const toggleDay = (key: string) => {
  openHours.value[key].closed = !openHours.value[key].closed;
};

const fetchInfo = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/cabinet/info");
    if (response.success) {
      form.value.name = response.data.name || "";
      form.value.address = response.data.address || "";
      form.value.city = response.data.city || "";
      form.value.phone = response.data.phone || "";
      if (response.data.openHours) {
        openHours.value = { ...defaultOpenHours, ...response.data.openHours };
      }
    }
  } catch (error) {
    console.error("Error fetching cabinet info:", error);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  saveError.value = "";
  saveSuccess.value = false;

  try {
    const response = await useAuthenticatedFetch<{ success: boolean }>(
      "/cabinet/info",
      {
        method: "PATCH",
        body: {
          ...form.value,
          openHours: openHours.value,
        },
      },
    );
    if (response.success) {
      saveSuccess.value = true;
      setTimeout(() => {
        saveSuccess.value = false;
      }, 3000);
    }
  } catch (err: any) {
    saveError.value = err?.data?.message || "Erreur lors de la sauvegarde";
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchInfo();
  } else {
    loading.value = false;
  }
});
</script>
