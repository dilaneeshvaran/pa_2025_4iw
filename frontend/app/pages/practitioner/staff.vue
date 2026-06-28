<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mon personnel
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gérez les comptes de votre personnel (assistant·e·s, secrétaires…)
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        <UserPlus class="h-4 w-4" />
        Créer un compte personnel
      </button>
    </div>

    <!-- search / filter -->
    <div class="flex flex-wrap gap-3">
      <div class="relative min-w-[240px] flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par nom, email, poste…"
          class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
        />
      </div>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700"
      >
        <option value="all">Tous les statuts</option>
        <option value="ACTIVE">Actif</option>
        <option value="INACTIVE">Inactif</option>
      </select>
    </div>

    <!-- staff list -->
    <div
      class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div v-if="loading" class="animate-pulse space-y-3 p-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <div v-else-if="!filteredStaff.length" class="py-12 text-center">
        <UserPlus
          class="mx-auto mb-3 h-16 w-16 text-gray-300 dark:text-gray-600"
        />
        <p class="text-lg text-gray-500 dark:text-gray-400">
          {{ staffMembers.length ? "Aucun résultat" : "Aucun personnel" }}
        </p>
        <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {{
            staffMembers.length
              ? "Essayez de modifier vos filtres"
              : "Créez des comptes pour votre personnel"
          }}
        </p>
      </div>

      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="staff in filteredStaff"
          :key="staff.id"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40"
            >
              <span
                class="text-sm font-bold text-orange-600 dark:text-orange-400"
              >
                {{ staff.firstName[0] }}{{ staff.lastName[0] }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-gray-100">
                {{ staff.firstName }} {{ staff.lastName }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ staff.user?.email || staff.email }} · {{ staff.phone }}
              </p>
              <!-- editable position -->
              <div class="mt-1 flex items-center gap-2">
                <template v-if="editingId === staff.id">
                  <input
                    v-model="editPosition"
                    type="text"
                    class="w-48 rounded border border-orange-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    @keyup.enter="savePosition(staff.id)"
                    @keyup.escape="cancelEdit"
                  />
                  <button
                    @click="savePosition(staff.id)"
                    class="rounded p-0.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                    title="Enregistrer"
                  >
                    <Check class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="cancelEdit"
                    class="rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
                    title="Annuler"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </template>
                <template v-else>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{
                    staff.position
                  }}</span>
                  <button
                    @click="startEdit(staff)"
                    class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-orange-600 dark:text-gray-500 dark:hover:bg-gray-800"
                    title="Modifier le poste"
                  >
                    <Pencil class="h-3 w-3" />
                  </button>
                </template>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                (staff.user?.status || staff.status) === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
              ]"
            >
              {{
                (staff.user?.status || staff.status) === "ACTIVE"
                  ? "Actif"
                  : "Inactif"
              }}
            </span>
            <button
              @click="removeStaff(staff.id)"
              class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-950/40"
              title="Supprimer"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- create staff modal -->
    <CreateStaffModal
      :is-open="showCreateModal"
      api-endpoint="/practitioner/dashboard/staff"
      @close="showCreateModal = false"
      @success="handleStaffCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { UserPlus, Trash2, Search, Pencil, Check, X } from "lucide-vue-next";
import CreateStaffModal from "~/components/shared/CreateStaffModal.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const authStore = useAuthStore();

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  position: string;
  status?: string;
  user?: { email: string; status: string };
}

const staffMembers = ref<StaffMember[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const searchQuery = ref("");
const statusFilter = ref("all");

const editingId = ref<string | null>(null);
const editPosition = ref("");

const filteredStaff = computed(() => {
  let list = staffMembers.value;
  const q = searchQuery.value.toLowerCase().trim();
  if (q) {
    list = list.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.user?.email || s.email || "").toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q),
    );
  }
  if (statusFilter.value !== "all") {
    list = list.filter(
      (s) => (s.user?.status || s.status) === statusFilter.value,
    );
  }
  return list;
});

const fetchStaff = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: StaffMember[];
    }>("/practitioner/dashboard/staff");
    if (response.success) {
      staffMembers.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching staff:", error);
  } finally {
    loading.value = false;
  }
};

const handleStaffCreated = (data: StaffMember) => {
  staffMembers.value.push(data);
};

const startEdit = (staff: StaffMember) => {
  editingId.value = staff.id;
  editPosition.value = staff.position;
};

const cancelEdit = () => {
  editingId.value = null;
  editPosition.value = "";
};

const savePosition = async (id: string) => {
  if (!editPosition.value.trim()) return;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: StaffMember;
    }>(`/practitioner/dashboard/staff/${id}`, {
      method: "PATCH",
      body: { position: editPosition.value.trim() },
    });
    if (res.success) {
      const idx = staffMembers.value.findIndex((s) => s.id === id);
      if (idx !== -1) staffMembers.value[idx] = res.data;
    }
  } catch (error) {
    console.error("Error updating staff position:", error);
  } finally {
    cancelEdit();
  }
};

const removeStaff = async (id: string) => {
  if (!confirm("Supprimer ce membre du personnel ?")) return;
  try {
    await useAuthenticatedFetch(`/practitioner/dashboard/staff/${id}`, {
      method: "DELETE",
    });
    staffMembers.value = staffMembers.value.filter((s) => s.id !== id);
  } catch (error) {
    console.error("Error removing staff:", error);
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchStaff();
  } else {
    loading.value = false;
  }
});
</script>
