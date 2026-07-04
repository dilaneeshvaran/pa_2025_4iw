<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Mes Cabinets</h1>
      <p class="text-gray-600">
        Gérez vos affiliations et invitations de cabinets
      </p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="scrollbar-hide -mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        <button
          @click="currentTab = 'active'"
          :class="[
            currentTab === 'active'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'shrink-0 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
          ]"
        >
          {{ "Cabinets actifs" }}
          <span
            v-if="cabinets.length"
            :class="[
              currentTab === 'active'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-900',
              'ml-2 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
            ]"
          >
            {{ cabinets.length }}
          </span>
        </button>
        <button
          @click="currentTab = 'invitations'"
          :class="[
            currentTab === 'invitations'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'shrink-0 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
          ]"
        >
          {{ "Invitations" }}
          <span
            v-if="invitations.length"
            :class="[
              currentTab === 'invitations'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-red-100 text-red-600',
              'ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium',
            ]"
          >
            {{ invitations.length }}
          </span>
        </button>
      </nav>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <UiCard v-for="i in 2" :key="i">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/4 rounded bg-gray-200"></div>
            <div class="h-3 w-1/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </UiCard>
    </div>

    <div v-else-if="currentTab === 'active'" class="space-y-4">
      <div v-if="!cabinets.length" class="py-12 text-center">
        <Building class="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 class="text-sm font-medium text-gray-900">Aucun cabinet</h3>
        <p class="mt-1 text-sm text-gray-500">
          Vous n'êtes membre d'aucun cabinet pour le moment.
        </p>
      </div>

      <UiCard
        v-for="item in cabinets"
        :key="item.id"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4 sm:items-center">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50"
            >
              <Building class="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ item.cabinet.name }}
              </h3>
              <div
                class="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4"
              >
                <span class="flex items-center gap-1">
                  <MapPin class="h-4 w-4" />
                  {{ item.cabinet.address }}
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="h-4 w-4" />
                  Rejoint le {{ formatDate(item.joinedAt) }}
                </span>
                <span
                  v-if="item.isPaused"
                  class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-600"
                >
                  En pause
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UiButton
              variant="secondary"
              size="sm"
              @click="toggleColleagues(item.cabinet.id)"
            >
              <Users class="mr-1 h-4 w-4" />
              <span>{{ expandedColleagues[item.cabinet.id] ? 'Masquer praticiens' : 'Voir praticiens' }}</span>
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="confirmAction('pause', item.cabinet.id, item.isPaused)"
              :disabled="actionLoading === item.cabinet.id"
            >
              <span v-if="item.isPaused">Reprendre</span>
              <span v-else>Pauser</span>
            </UiButton>
            <UiButton
              variant="danger"
              size="sm"
              @click="confirmAction('leave', item.cabinet.id)"
              :disabled="actionLoading === item.cabinet.id"
            >
              <LogOut class="mr-2 h-4 w-4" />
              <span>Quitter</span>
            </UiButton>
          </div>
        </div>

        <div v-if="expandedColleagues[item.cabinet.id]" class="mt-4 border-t border-gray-100 pt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Praticiens de ce cabinet</h4>
          <div v-if="colleaguesLoading[item.cabinet.id]" class="text-xs text-gray-500">
            Chargement...
          </div>
          <div v-else-if="!colleagues[item.cabinet.id]?.length" class="text-xs text-gray-500">
            Aucun autre praticien dans ce cabinet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="col in colleagues[item.cabinet.id]"
              :key="col.id"
              class="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
            >
              <div>
                <span class="font-medium text-gray-900">{{ col.title }} {{ col.firstName }} {{ col.lastName }}</span>
                <span class="text-xs text-gray-500 ml-2">({{ col.specialties.join(', ') || 'Généraliste' }})</span>
              </div>
              <span class="text-xs text-gray-500">{{ col.phone }}</span>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <div v-else-if="currentTab === 'invitations'" class="space-y-4">
      <div v-if="!invitations.length" class="py-12 text-center">
        <Mail class="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 class="text-sm font-medium text-gray-900">Aucune invitation</h3>
        <p class="mt-1 text-sm text-gray-500">
          Vous n'avez pas d'invitations en attente.
        </p>
      </div>

      <UiCard
        v-for="invitation in invitations"
        :key="invitation.id"
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-4 sm:items-center">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50"
          >
            <Mail class="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ invitation.cabinet.name }}
            </h3>
            <div
              class="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4"
            >
              <span class="flex items-center gap-1">
                <MapPin class="h-4 w-4" />
                {{ invitation.cabinet.address }}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="h-4 w-4" />
                Expire le {{ formatDate(invitation.expiresAt) }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UiButton
            variant="outline"
            size="sm"
            @click="confirmAction('reject', invitation.id)"
            :disabled="actionLoading === invitation.id"
          >
            <X class="mr-1 h-4 w-4" />
            Refuser
          </UiButton>
          <UiButton
            variant="primary"
            size="sm"
            @click="confirmAction('accept', invitation.id)"
            :disabled="actionLoading === invitation.id"
          >
            <Check class="mr-1 h-4 w-4" />
            Accepter
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>

  <UiConfirmModal
    v-model="isModalOpen"
    :title="modalData.title"
    :description="modalData.description"
    :variant="modalData.variant"
    :loading="!!actionLoading"
    @confirm="executeAction"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Building,
  MapPin,
  Calendar,
  LogOut,
  Mail,
  Clock,
  Check,
  X,
  Users,
} from "lucide-vue-next";
import { useToast } from "vue-toastification";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const toast = useToast();
const route = useRoute();
const loading = ref(true);
const actionLoading = ref<string | null>(null);
const currentTab = ref<"active" | "invitations">("active");

const cabinets = ref<any[]>([]);
const invitations = ref<any[]>([]);

const expandedColleagues = ref<Record<string, boolean>>({});
const colleagues = ref<Record<string, any[]>>({});
const colleaguesLoading = ref<Record<string, boolean>>({});

const isModalOpen = ref(false)
const modalData = ref({
  type: '',
  id: '',
  payload: null as any,
  title: '',
  description: '',
  variant: 'danger' as 'danger' | 'warning' | 'success' | 'info',
})

const ACTION_META: Record<string, { title: string; description: string; variant: 'danger' | 'warning' | 'success' | 'info' }> = {
  accept: {
    title: "Accepter l'invitation",
    description: 'Voulez-vous vraiment accepter cette invitation ? Vous rejoindrez le cabinet immédiatement.',
    variant: 'success',
  },
  reject: {
    title: "Refuser l'invitation",
    description: 'Voulez-vous vraiment refuser cette invitation ?',
    variant: 'danger',
  },
  pause: {
    title: 'Changer le statut',
    description: "Voulez-vous vraiment modifier l'état de pause de ce cabinet ?",
    variant: 'warning',
  },
  leave: {
    title: 'Quitter le cabinet',
    description: 'Voulez-vous vraiment quitter ce cabinet ? Cette action est irréversible.',
    variant: 'danger',
  },
}

const confirmAction = (type: string, id: string, payload?: any) => {
  const meta = ACTION_META[type]
  modalData.value = { type, id, payload, ...meta }
  isModalOpen.value = true
}

const executeAction = async () => {
  const { type, id, payload } = modalData.value;
  actionLoading.value = id;
  isModalOpen.value = false;
  try {
    if (type === 'accept') await acceptInvitation(id);
    else if (type === 'reject') await rejectInvitation(id);
    else if (type === 'pause') await togglePauseCabinet(id, payload);
    else if (type === 'leave') await leaveCabinet(id);
  } finally {
    actionLoading.value = null;
  }
};

const toggleColleagues = async (cabinetId: string) => {
  expandedColleagues.value[cabinetId] = !expandedColleagues.value[cabinetId];
  if (expandedColleagues.value[cabinetId] && !colleagues.value[cabinetId]) {
    colleaguesLoading.value[cabinetId] = true;
    try {
      const response = await useAuthenticatedFetch<{ success: boolean; data: any[] }>(
        `/practitioner/cabinets/${cabinetId}/practitioners`
      );
      if (response.success) {
        colleagues.value[cabinetId] = response.data;
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des praticiens");
    } finally {
      colleaguesLoading.value[cabinetId] = false;
    }
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        activeCabinets: any[];
        invitations: any[];
      };
    }>("/practitioner/cabinets");

    if (response.success) {
      cabinets.value = response.data.activeCabinets;
      invitations.value = response.data.invitations;
    }
  } catch (error: any) {
    toast.error("Erreur lors de la récupération des données");
  } finally {
    loading.value = false;
  }
};

const acceptInvitation = async (id: string) => {
  const response = await useAuthenticatedFetch<{ success: boolean }>(`/practitioner/cabinets/invitations/${id}/accept`, { method: "POST" });
  if (response.success) {
    toast.success("Invitation acceptée");
    await fetchData();
  }
};

const rejectInvitation = async (id: string) => {
  const response = await useAuthenticatedFetch<{ success: boolean }>(`/practitioner/cabinets/invitations/${id}/reject`, { method: "POST" });
  if (response.success) {
    toast.success("Invitation refusée");
    await fetchData();
  }
};

const togglePauseCabinet = async (id: string, isCurrentlyPaused: boolean) => {
  const response = await useAuthenticatedFetch<{ success: boolean }>(`/practitioner/cabinets/${id}/toggle-pause`, { method: "PATCH" });
  if (response.success) {
    toast.success(isCurrentlyPaused ? "Activité reprise" : "Cabinet mis en pause");
    await fetchData();
  }
};

const leaveCabinet = async (id: string) => {
  const response = await useAuthenticatedFetch<{ success: boolean }>(`/practitioner/cabinets/${id}`, { method: "DELETE" });
  if (response.success) {
    toast.success("Vous avez quitté le cabinet");
    await fetchData();
  }
};

onMounted(() => {
  if (route.query.tab === 'invitations') {
    currentTab.value = 'invitations';
  }
  fetchData();
});
</script>
