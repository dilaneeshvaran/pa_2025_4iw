<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">
        Informations du cabinet
      </h1>
      <p class="text-gray-600">
        Modifiez les informations et horaires de votre cabinet
      </p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-32 rounded-xl bg-gray-200"></div>
      <div class="h-64 rounded-xl bg-gray-200"></div>
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-6">
      <!-- general info -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Informations générales
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Nom du cabinet
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              v-model="form.address"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Ville
            </label>
            <input
              v-model="form.city"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <!-- open hours -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Horaires d'ouverture
        </h3>
        <div class="space-y-3">
          <div
            v-for="day in daysOfWeek"
            :key="day.key"
            class="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
          >
            <div class="w-28">
              <label class="text-sm font-medium text-gray-700">
                {{ day.label }}
              </label>
            </div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="!openHours[day.key]?.closed"
                @change="toggleDay(day.key)"
                class="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span class="text-sm text-gray-600">Ouvert</span>
            </label>
            <template v-if="!openHours[day.key]?.closed">
              <input
                v-model="openHours[day.key].open"
                type="time"
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
              <span class="text-gray-400">-</span>
              <input
                v-model="openHours[day.key].close"
                type="time"
                class="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
            </template>
            <span v-else class="text-sm text-gray-400">Fermé</span>
          </div>
        </div>
      </div>

      <div
        v-if="saveError"
        class="rounded-lg bg-red-50 p-3 text-sm text-red-600"
      >
        {{ saveError }}
      </div>

      <div
        v-if="saveSuccess"
        class="rounded-lg bg-green-50 p-3 text-sm text-green-600"
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

    <!-- Danger Zone -->
    <div class="rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm space-y-6">
      <h3 class="text-lg font-semibold text-red-900 flex items-center gap-2">
        <ShieldAlert class="h-5 w-5 text-red-600" />
        Zone de danger
      </h3>
      
      <div class="divide-y divide-red-200">
        <!-- Transfer Ownership -->
        <div class="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="max-w-md">
            <p class="font-medium text-gray-900">Transférer la propriété du cabinet</p>
            <p class="text-sm text-gray-500">Transférez les droits d'administrateur à un autre utilisateur via son adresse email.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
            <input
              v-model="transferEmail"
              type="email"
              placeholder="nouveau.admin@email.com"
              class="rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
            <button
              type="button"
              @click="handleTransferOwnership"
              :disabled="transferring || !transferEmail"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Transférer
            </button>
          </div>
        </div>

        <!-- Delete Cabinet -->
        <div class="py-4 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="max-w-md">
            <p class="font-medium text-gray-900">Supprimer le cabinet</p>
            <p class="text-sm text-gray-500">Cette action est irréversible. Elle annulera tous les rendez-vous à venir et supprimera toutes les données associées du cabinet.</p>
          </div>
          <button
            type="button"
            @click="handleDeleteCabinet"
            :disabled="deleting"
            class="rounded-lg border border-red-300 bg-white text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 self-start sm:self-center"
          >
            Supprimer le cabinet
          </button>
        </div>
      </div>

      <div v-if="dangerError" class="rounded-lg bg-red-100 p-3 text-sm text-red-800">
        {{ dangerError }}
      </div>
      <div v-if="dangerSuccess" class="rounded-lg bg-green-100 p-3 text-sm text-green-800">
        {{ dangerSuccess }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { ShieldAlert } from 'lucide-vue-next';
import { ref } from 'vue';

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

const transferEmail = ref('')
const transferring = ref(false)
const deleting = ref(false)
const dangerError = ref('')
const dangerSuccess = ref('')

const handleTransferOwnership = async () => {
  if (!confirm(`Êtes-vous sûr de vouloir transférer la propriété du cabinet à ${transferEmail.value} ? Cette action vous déconnectera.`)) {
    return
  }
  transferring.value = true
  dangerError.value = ''
  dangerSuccess.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean }>('/cabinet/transfer-ownership', {
      method: 'POST',
      body: { email: transferEmail.value }
    })
    if (res.success) {
      dangerSuccess.value = 'Propriété transférée avec succès. Déconnexion...'
      setTimeout(() => {
        authStore.logout()
        navigateTo('/auth/login')
      }, 2000)
    }
  } catch (err: any) {
    dangerError.value = err?.data?.message || 'Erreur lors du transfert'
  } finally {
    transferring.value = false
  }
}

const handleDeleteCabinet = async () => {
  const confirmText = prompt('Pour confirmer la suppression, veuillez saisir le nom du cabinet :')
  if (confirmText !== form.value.name) {
    alert('Le nom saisi ne correspond pas. Suppression annulée.')
    return
  }
  deleting.value = true
  dangerError.value = ''
  dangerSuccess.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean }>('/cabinet', {
      method: 'DELETE'
    })
    if (res.success) {
      dangerSuccess.value = 'Cabinet supprimé avec succès. Déconnexion...'
      setTimeout(() => {
        authStore.logout()
        navigateTo('/auth/login')
      }, 2000)
    }
  } catch (err: any) {
    dangerError.value = err?.data?.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

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
