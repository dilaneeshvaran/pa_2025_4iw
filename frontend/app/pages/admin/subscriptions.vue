<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900">Gestion abonnements</h1>
    <p class="mb-6 text-gray-600">
      Consultez et gérez les abonnements des praticiens.
    </p>

    <!-- stat cards -->
    <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm text-gray-500">Total</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm text-gray-500">Actifs</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm text-gray-500">Annulation prévue</p>
        <p class="text-2xl font-bold text-orange-600">
          {{ stats.scheduledCancel }}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <p class="text-sm text-gray-500">Expirés</p>
        <p class="text-2xl font-bold text-red-600">{{ stats.expired }}</p>
      </div>
    </div>

    <!-- filters -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher par praticien ou email..."
        class="min-w-64 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @input="debouncedFetch"
      />
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @change="resetAndFetch"
      >
        <option value="">Tous les statuts</option>
        <option value="ACTIVE">Actif</option>
        <option value="SUSPENDED">Suspendu</option>
        <option value="CANCELLED">Annulé</option>
        <option value="EXPIRED">Expiré</option>
      </select>
      <select
        v-model="planFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @change="resetAndFetch"
      >
        <option value="">Tous les plans</option>
        <option value="FREE">Free (0 XOF / mois)</option>
        <option value="PREMIUM">Premium (12 000 XOF / mois)</option>
        <option value="PRO">Pro (24 000 XOF / mois)</option>
      </select>
      <button
        class="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 p-4 text-red-800">
      {{ fetchError }}
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Praticien
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Plan
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Statut
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Échéance
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="subscriptions.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
              Aucun abonnement trouvé
            </td>
          </tr>
          <tr v-for="s in subscriptions" :key="s.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">
                {{ s.practitionerName }}
              </div>
              <div class="text-sm text-gray-500">{{ s.email || "-" }}</div>
              <div v-if="s.city" class="text-xs text-gray-400">
                {{ s.title ? s.title + " · " : "" }}{{ s.city }}
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="planBadgeClass(s.plan)"
              >
                {{ s.plan }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statusBadgeClass(s.status)"
              >
                {{ statusLabel(s.status) }}
              </span>
              <span
                v-if="s.cancelAtPeriodEnd"
                class="ml-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700"
              >
                annulation prévue
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
              {{ s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "-" }}
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <button
                class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                @click="openEditModal(s)"
              >
                Gérer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- pagination -->
    <div
      v-if="!loading && pagination.totalPages > 1"
      class="mt-4 flex items-center justify-between"
    >
      <p class="text-sm text-gray-600">
        {{ pagination.total }} abonnement(s) - page {{ pagination.page }} /
        {{ pagination.totalPages }}
      </p>
      <div class="flex gap-2">
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          Précédent
        </button>
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- edit modal -->
    <div
      v-if="showEditModal && editTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showEditModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="mb-1 text-xl font-bold text-gray-900">Gérer l'abonnement</h2>
        <p class="mb-4 text-sm text-gray-600">
          {{ editTarget.practitionerName }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Plan
            </label>
            <select
              v-model="editForm.plan"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="FREE">Free (0 XOF / mois)</option>
              <option value="PREMIUM">Premium (12 000 XOF / mois)</option>
              <option value="PRO">Pro (24 000 XOF / mois)</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              v-model="editForm.status"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="CANCELLED">Annulé</option>
              <option value="EXPIRED">Expiré</option>
            </select>
          </div>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              v-model="editForm.cancelAtPeriodEnd"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Annuler à la fin de la période en cours
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="showEditModal = false"
          >
            Annuler
          </button>
          <button
            type="button"
            :disabled="processingId === editTarget.id"
            class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            @click="saveEdit"
          >
            {{ processingId === editTarget.id ? "Enregistrement..." : "Enregistrer" }}
          </button>
        </div>
      </div>
    </div>

    <!-- toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 rounded-lg px-6 py-3 text-white shadow-lg"
      :class="toastType === 'error' ? 'bg-red-600' : 'bg-green-600'"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

interface AdminSubscription {
  id: string;
  practitionerId: string;
  practitionerName: string;
  email: string | null;
  title: string | null;
  city: string | null;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const subscriptions = ref<AdminSubscription[]>([]);
const stats = ref({
  total: 0,
  active: 0,
  cancelled: 0,
  suspended: 0,
  scheduledCancel: 0,
  expired: 0,
});
const pagination = ref<Pagination>({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 0,
});

const search = ref("");
const statusFilter = ref("");
const planFilter = ref("");

const loading = ref(true);
const fetchError = ref("");
const processingId = ref<string | null>(null);

const showEditModal = ref(false);
const editTarget = ref<AdminSubscription | null>(null);
const editForm = ref({
  plan: "PREMIUM",
  status: "ACTIVE",
  cancelAtPeriodEnd: false,
});

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
  };
  return labels[status] || status;
}

function statusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    SUSPENDED: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-100 text-gray-600",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

function planBadgeClass(plan: string) {
  const classes: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-700",
    PREMIUM: "bg-orange-100 text-orange-800",
    PRO: "bg-purple-100 text-purple-800",
  };
  return classes[plan] || "bg-gray-100 text-gray-800";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function fetchSubscriptions() {
  loading.value = true;
  fetchError.value = "";
  try {
    const params = new URLSearchParams();
    params.set("page", String(pagination.value.page));
    params.set("limit", String(pagination.value.limit));
    if (search.value) params.set("search", search.value);
    if (statusFilter.value) params.set("status", statusFilter.value);
    if (planFilter.value) params.set("plan", planFilter.value);

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { subscriptions: AdminSubscription[]; pagination: Pagination };
    }>(`/admin/subscriptions?${params.toString()}`);
    subscriptions.value = response.data.subscriptions;
    pagination.value = response.data.pagination;
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des abonnements";
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: typeof stats.value;
    }>("/admin/subscriptions/stats");
    stats.value = response.data;
  } catch {
    // non-blocking
  }
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchSubscriptions();
  }, 300);
}

function resetAndFetch() {
  pagination.value.page = 1;
  fetchSubscriptions();
}

function resetFilters() {
  search.value = "";
  statusFilter.value = "";
  planFilter.value = "";
  resetAndFetch();
}

function goToPage(page: number) {
  pagination.value.page = page;
  fetchSubscriptions();
}

function openEditModal(s: AdminSubscription) {
  editTarget.value = s;
  editForm.value = {
    plan: s.plan,
    status: s.status,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
  };
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editTarget.value) return;
  processingId.value = editTarget.value.id;
  try {
    await useAuthenticatedFetch(`/admin/subscriptions/${editTarget.value.id}`, {
      method: "PATCH",
      body: { ...editForm.value },
    });
    showEditModal.value = false;
    showToast("Abonnement mis à jour");
    await Promise.all([fetchSubscriptions(), fetchStats()]);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    showToast(err?.data?.message || "Erreur lors de la mise à jour", "error");
  } finally {
    processingId.value = null;
  }
}

onMounted(() => {
  fetchSubscriptions();
  fetchStats();
});
</script>
