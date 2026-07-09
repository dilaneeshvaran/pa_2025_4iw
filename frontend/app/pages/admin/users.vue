<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion utilisateurs</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consultez, suspendez ou supprimez les comptes de la plateforme.
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[#D96F00] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#BF6200] focus:outline-none focus:ring-2 focus:ring-[#D96F00]"
        @click="showCreateAdminModal = true"
      >
        <UserPlus class="h-4 w-4" />
        Créer admin
      </button>
    </div>

    <!-- stat cards -->
    <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Suspendus</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats.suspended }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">En attente</p>
        <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ stats.pending }}</p>
      </div>
    </div>

    <!-- filters -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher par nom ou email..."
        class="min-w-64 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @input="debouncedFetch"
      />
      <select
        v-model="roleFilter"
        class="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @change="resetAndFetch"
      >
        <option value="">Tous les rôles</option>
        <option value="PATIENT">Patient</option>
        <option value="PRACTITIONER">Praticien</option>
        <option value="STAFF">Secrétaire</option>
        <option value="CABINET_ADMIN">Admin cabinet</option>
        <option value="ADMIN">Administrateur</option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @change="resetAndFetch"
      >
        <option value="">Tous les statuts</option>
        <option value="ACTIVE">Actif</option>
        <option value="SUSPENDED">Suspendu</option>
        <option value="INACTIVE">Inactif</option>
        <option value="PENDING_VERIFICATION">En attente</option>
      </select>
      <button
        class="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500 dark:text-gray-400">
      Chargement...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200">
      {{ fetchError }}
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Utilisateur
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Rôle
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Statut
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Dernière connexion
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Inscrit le
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
          <tr v-if="users.length === 0">
            <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              Aucun utilisateur trouvé
            </td>
          </tr>
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ u.fullName }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ u.email }}</div>
              <div v-if="u.phone" class="text-xs text-gray-500 dark:text-gray-400">
                {{ u.phone }}
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="roleBadgeClass(u.role)"
              >
                {{ roleLabel(u.role) }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statusBadgeClass(u.status)"
              >
                {{ statusLabel(u.status) }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
              {{ u.lastLoginAt ? formatDate(u.lastLoginAt) : "-" }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
              {{ formatDate(u.createdAt) }}
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div
                v-if="canManage(u)"
                class="flex items-center gap-2"
              >
                <button
                  v-if="u.status === 'ACTIVE'"
                  class="rounded bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 disabled:opacity-50"
                  :disabled="processingId === u.id"
                  @click="changeStatus(u, 'SUSPENDED')"
                >
                  Suspendre
                </button>
                <button
                  v-else
                  class="rounded bg-green-50 dark:bg-green-950/30 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 transition-colors hover:bg-green-100 disabled:opacity-50"
                  :disabled="processingId === u.id"
                  @click="changeStatus(u, 'ACTIVE')"
                >
                  Réactiver
                </button>
                <button
                  class="rounded bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200"
                  @click="openDeleteModal(u)"
                >
                  Supprimer
                </button>
              </div>
              <span v-else class="text-xs text-gray-500 dark:text-gray-400">-</span>
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
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ pagination.total }} utilisateur(s) - page {{ pagination.page }} /
        {{ pagination.totalPages }}
      </p>
      <div class="flex gap-2">
        <button
          class="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          Précédent
        </button>
        <button
          class="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- delete confirm modal -->
    <div
      v-if="showDeleteModal && deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showDeleteModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          Supprimer l'utilisateur
        </h2>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Êtes-vous sûr de vouloir supprimer le compte de
          <strong>{{ deleteTarget.fullName }}</strong> ({{
            deleteTarget.email
          }}) ? Cette action est irréversible.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="showDeleteModal = false"
          >
            Annuler
          </button>
          <button
            type="button"
            :disabled="processingId === deleteTarget.id"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            @click="confirmDelete"
          >
            {{ processingId === deleteTarget.id ? "Suppression..." : "Supprimer" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create admin modal -->
    <CreateAdminModal
      :is-open="showCreateAdminModal"
      @close="showCreateAdminModal = false"
      @success="handleAdminCreated"
    />

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
import { useAuthStore } from "~/stores/auth";
import { UserPlus } from "lucide-vue-next";
import CreateAdminModal from "~/components/shared/CreateAdminModal.vue";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const authStore = useAuthStore();

const users = ref<AdminUser[]>([]);
const stats = ref({
  total: 0,
  active: 0,
  suspended: 0,
  inactive: 0,
  pending: 0,
});
const pagination = ref<Pagination>({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 0,
});

const search = ref("");
const roleFilter = ref("");
const statusFilter = ref("");

const loading = ref(true);
const fetchError = ref("");
const processingId = ref<string | null>(null);

const showDeleteModal = ref(false);
const showCreateAdminModal = ref(false);

function handleAdminCreated() {
  showToast("Administrateur créé avec succès");
  fetchUsers();
  fetchStats();
}
const deleteTarget = ref<AdminUser | null>(null);

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    PATIENT: "Patient",
    PRACTITIONER: "Praticien",
    STAFF: "Secrétaire",
    CABINET_ADMIN: "Admin cabinet",
    ADMIN: "Administrateur",
  };
  return labels[role] || role;
}

function roleBadgeClass(role: string) {
  const classes: Record<string, string> = {
    PATIENT: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
    PRACTITIONER: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
    STAFF: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
    CABINET_ADMIN: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
    ADMIN: "bg-gray-800 text-white",
  };
  return classes[role] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    INACTIVE: "Inactif",
    PENDING_VERIFICATION: "En attente",
  };
  return labels[status] || status;
}

function statusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    SUSPENDED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    INACTIVE: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    PENDING_VERIFICATION: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  };
  return classes[status] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// admins cannot act on themselves nor on other admin accounts (mirrors backend)
function canManage(u: AdminUser) {
  return u.id !== authStore.user?.id && u.role !== "ADMIN";
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function fetchUsers() {
  loading.value = true;
  fetchError.value = "";
  try {
    const params = new URLSearchParams();
    params.set("page", String(pagination.value.page));
    params.set("limit", String(pagination.value.limit));
    if (search.value) params.set("search", search.value);
    if (roleFilter.value) params.set("role", roleFilter.value);
    if (statusFilter.value) params.set("status", statusFilter.value);

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { users: AdminUser[]; pagination: Pagination };
    }>(`/admin/users?${params.toString()}`);
    users.value = response.data.users;
    pagination.value = response.data.pagination;
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des utilisateurs";
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: typeof stats.value;
    }>("/admin/users/stats");
    stats.value = response.data;
  } catch {
    // non-blocking: cards just stay at zero
  }
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchUsers();
  }, 300);
}

function resetAndFetch() {
  pagination.value.page = 1;
  fetchUsers();
}

function resetFilters() {
  search.value = "";
  roleFilter.value = "";
  statusFilter.value = "";
  resetAndFetch();
}

function goToPage(page: number) {
  pagination.value.page = page;
  fetchUsers();
}

async function changeStatus(u: AdminUser, status: string) {
  processingId.value = u.id;
  try {
    await useAuthenticatedFetch(`/admin/users/${u.id}/status`, {
      method: "PATCH",
      body: { status },
    });
    showToast(
      status === "ACTIVE" ? "Compte réactivé" : "Compte suspendu",
    );
    await Promise.all([fetchUsers(), fetchStats()]);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    showToast(err?.data?.message || "Erreur lors de la mise à jour", "error");
  } finally {
    processingId.value = null;
  }
}

function openDeleteModal(u: AdminUser) {
  deleteTarget.value = u;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  processingId.value = deleteTarget.value.id;
  try {
    await useAuthenticatedFetch(`/admin/users/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    showDeleteModal.value = false;
    showToast("Utilisateur supprimé");
    await Promise.all([fetchUsers(), fetchStats()]);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    showToast(err?.data?.message || "Erreur lors de la suppression", "error");
  } finally {
    processingId.value = null;
  }
}

onMounted(() => {
  fetchUsers();
  fetchStats();
});
</script>
