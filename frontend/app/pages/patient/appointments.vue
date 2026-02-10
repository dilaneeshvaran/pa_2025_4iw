<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
      <p class="text-gray-600">Consultez et gérez vos rendez-vous</p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === tab.key
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- loading -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse rounded-lg border bg-white p-6"
      >
        <div class="flex gap-4">
          <div class="h-16 w-16 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-3">
            <div class="h-4 w-1/3 rounded bg-gray-200"></div>
            <div class="h-3 w-1/4 rounded bg-gray-200"></div>
            <div class="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- empty state -->
    <div
      v-else-if="currentAppointments.length === 0"
      class="rounded-lg border bg-white py-16 text-center"
    >
      <Calendar class="mx-auto mb-4 h-16 w-16 text-gray-300" />
      <h3 class="mb-2 text-lg font-medium text-gray-900">
        {{ emptyMessages[activeTab].title }}
      </h3>
      <p class="mb-6 text-gray-500">
        {{ emptyMessages[activeTab].description }}
      </p>
      <UiButton v-if="activeTab === 'upcoming'" @click="navigateTo('/search')">
        Prendre un rendez-vous
      </UiButton>
    </div>

    <!-- appointment list -->
    <div v-else class="space-y-4">
      <div
        v-for="apt in currentAppointments"
        :key="apt.id"
        class="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="p-6">
          <div class="flex items-start gap-4">
            <!-- Doctor photo -->
            <UiImageWithFallback
              :src="apt.practitioner.photo || ''"
              :alt="`${apt.practitioner.title} ${apt.practitioner.firstName} ${apt.practitioner.lastName}`"
              class-name="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />

            <!-- appointment info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ apt.practitioner.title }}
                    {{ apt.practitioner.firstName }}
                    {{ apt.practitioner.lastName }}
                  </h3>
                  <p class="text-sm text-gray-600">
                    {{ apt.practitioner.specialty || "Médecine générale" }}
                  </p>
                </div>
                <UiBadge :variant="getStatusVariant(apt.status)">
                  {{ getStatusLabel(apt.status) }}
                </UiBadge>
              </div>

              <div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-1.5">
                  <Calendar class="h-4 w-4 text-gray-400" />
                  <span>{{ formatDate(apt.appointmentDate) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Clock class="h-4 w-4 text-gray-400" />
                  <span>{{ apt.startTime }} - {{ apt.endTime }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <component
                    :is="apt.type === 'TELECONSULTATION' ? Video : MapPin"
                    class="h-4 w-4 text-gray-400"
                  />
                  <span>{{
                    apt.type === "TELECONSULTATION"
                      ? "Téléconsultation"
                      : "En cabinet"
                  }}</span>
                </div>
              </div>

              <!-- address for in person -->
              <div
                v-if="apt.type === 'IN_PERSON' && apt.practitioner.address"
                class="mt-2 flex items-start gap-1.5 text-sm text-gray-500"
              >
                <MapPin class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>
                  {{ apt.practitioner.address }}
                  <template v-if="apt.practitioner.city"
                    >, {{ apt.practitioner.city }}</template
                  >
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- action  -->
        <div
          v-if="getActions(apt).length > 0"
          class="flex gap-3 rounded-b-lg border-t bg-gray-50 px-6 py-3"
        >
          <div class="group relative">
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="!canModify(apt)"
              @click="handleModifyClick(apt)"
            >
              <Pencil class="mr-1.5 h-4 w-4" />
              Modifier
            </UiButton>
            <div
              v-if="!canModify(apt)"
              class="pointer-events-none invisible absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:visible group-hover:opacity-100"
            >
              <div class="relative">
                Vous pouvez modifier uniquement 24h avant
                <div
                  class="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                ></div>
              </div>
            </div>
          </div>
          <UiButton
            v-if="canCancel(apt)"
            variant="danger"
            size="sm"
            @click="openCancelModal(apt)"
          >
            <X class="mr-1.5 h-4 w-4" />
            Annuler
          </UiButton>
          <UiButton v-if="canJoin(apt)" size="sm" @click="handleJoin(apt)">
            <Video class="mr-1.5 h-4 w-4" />
            Rejoindre
          </UiButton>
        </div>
      </div>

      <div
        v-if="pagination.totalPages > 1"
        class="flex items-center justify-center gap-2 pt-4"
      >
        <UiButton
          variant="outline"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          Précédent
        </UiButton>
        <span class="px-3 text-sm text-gray-600">
          Page {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          Suivant
        </UiButton>
      </div>
    </div>

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeCancelModal"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler le rendez-vous
            </h3>
          </div>

          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler votre rendez-vous avec
            <strong>
              {{ selectedAppointment?.practitioner.title }}
              {{ selectedAppointment?.practitioner.firstName }}
              {{ selectedAppointment?.practitioner.lastName }}
            </strong>
            le
            <strong>{{
              formatDate(selectedAppointment?.appointmentDate || "")
            }}</strong>
            à
            <strong>{{ selectedAppointment?.startTime }}</strong> ?
          </p>

          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Raison (optionnelle)
            </label>
            <textarea
              v-model="cancelReason"
              rows="3"
              placeholder="Indiquez la raison de l'annulation..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              class-name="flex-1"
              @click="closeCancelModal"
              :disabled="cancelling"
            >
              Non, garder
            </UiButton>
            <UiButton
              variant="danger"
              class-name="flex-1"
              @click="confirmCancel"
              :disabled="cancelling"
            >
              {{ cancelling ? "Annulation..." : "Oui, annuler" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- modify modal -->
    <Teleport to="body">
      <div
        v-if="showModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeModifyModal"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"
            >
              <Pencil class="h-5 w-5 text-blue-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Modifier le rendez-vous
            </h3>
          </div>

          <p class="mb-4 text-sm text-gray-600">
            Modifier votre rendez-vous avec
            <strong>
              {{ selectedAppointment?.practitioner.title }}
              {{ selectedAppointment?.practitioner.firstName }}
              {{ selectedAppointment?.practitioner.lastName }}
            </strong>
          </p>

          <div class="mb-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nouvelle date
              </label>
              <input
                v-model="modifyDate"
                type="date"
                :min="minDate"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nouvel horaire
              </label>
              <input
                v-model="modifyTime"
                type="time"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <p v-if="modifyError" class="mb-3 text-sm text-red-600">
            {{ modifyError }}
          </p>

          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              class-name="flex-1"
              @click="closeModifyModal"
              :disabled="modifying"
            >
              Annuler
            </UiButton>
            <UiButton
              class-name="flex-1"
              @click="confirmModify"
              :disabled="modifying || !modifyDate || !modifyTime"
            >
              {{ modifying ? "Modification..." : "Confirmer" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Pencil,
  X,
  AlertTriangle,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

const authStore = useAuthStore();

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string | null;
  photo: string | null;
  address: string | null;
  city: string | null;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason: string | null;
  consultationFee: number;
  practitioner: Practitioner;
}

const activeTab = ref<"upcoming" | "past" | "cancelled">("upcoming");
const loading = ref(true);
const appointments = ref<Appointment[]>([]);
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

//cancel
const showCancelModal = ref(false);
const selectedAppointment = ref<Appointment | null>(null);
const cancelReason = ref("");
const cancelling = ref(false);

// modify modal
const showModifyModal = ref(false);
const modifyDate = ref("");
const modifyTime = ref("");
const modifyError = ref("");
const modifying = ref(false);

const tabs = computed(() => [
  {
    key: "upcoming" as const,
    label: "À venir",
    count: activeTab.value === "upcoming" ? pagination.value.total : undefined,
  },
  {
    key: "past" as const,
    label: "Passés",
    count: activeTab.value === "past" ? pagination.value.total : undefined,
  },
  {
    key: "cancelled" as const,
    label: "Annulés",
    count: activeTab.value === "cancelled" ? pagination.value.total : undefined,
  },
]);

const emptyMessages: Record<
  "upcoming" | "past" | "cancelled",
  { title: string; description: string }
> = {
  upcoming: {
    title: "Aucun rendez-vous à venir",
    description:
      "Vous n'avez pas de rendez-vous prévu. Recherchez un praticien pour en prendre un.",
  },
  past: {
    title: "Aucun rendez-vous passé",
    description: "Votre historique de rendez-vous apparaîtra ici.",
  },
  cancelled: {
    title: "Aucun rendez-vous annulé",
    description: "Vos rendez-vous annulés apparaîtront ici.",
  },
};

const currentAppointments = computed(() => appointments.value);

const minDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 2); // at least 24h before
  return d.toISOString().split("T")[0] || "";
});

const getStatusVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" | "primary" => {
  switch (status) {
    case "CONFIRMED":
      return "primary";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "NO_SHOW":
      return "warning";
    case "PENDING":
      return "default";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "Confirmé";
    case "COMPLETED":
      return "Terminé";
    case "CANCELLED":
      return "Annulé";
    case "NO_SHOW":
      return "Absent";
    case "PENDING":
      return "En attente";
    default:
      return status;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const canModify = (apt: Appointment): boolean => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffMs = aptDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 24;
};

const canCancel = (apt: Appointment): boolean => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return aptDate > now;
};

const canJoin = (apt: Appointment): boolean => {
  if (apt.type !== "TELECONSULTATION") return false;
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffMs = aptDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60; // 15 min before, up to 1h after start
};

const getActions = (apt: Appointment): string[] => {
  const actions: string[] = [];
  if (canModify(apt)) actions.push("modify");
  if (canCancel(apt)) actions.push("cancel");
  if (canJoin(apt)) actions.push("join");
  return actions;
};

const handleJoin = (_apt: Appointment) => {
  // tofo :video call not implemented yet
  alert("La téléconsultation sera bientôt disponible.");
};

const fetchAppointments = async (page = 1) => {
  loading.value = true;
  try {
    const statusMap: Record<string, string> = {
      upcoming: "upcoming",
      past: "past",
      cancelled: "cancelled",
    };
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Appointment[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(
      `/appointments/patient?status=${statusMap[activeTab.value]}&limit=10&page=${page}`,
    );
    if (response.success) {
      appointments.value = response.data;
      pagination.value = response.pagination;
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  fetchAppointments(page);
};

const openCancelModal = (apt: Appointment) => {
  selectedAppointment.value = apt;
  cancelReason.value = "";
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  selectedAppointment.value = null;
};

const confirmCancel = async () => {
  if (!selectedAppointment.value) return;
  cancelling.value = true;
  try {
    await useAuthenticatedFetch(
      `/appointments/${selectedAppointment.value.id}/cancel`,
      {
        method: "PATCH",
        body: { reason: cancelReason.value || undefined },
      },
    );
    closeCancelModal();
    fetchAppointments(pagination.value.page);
  } catch (error: any) {
    console.error("Error cancelling:", error);
    alert(error?.data?.message || "Erreur lors de l'annulation");
  } finally {
    cancelling.value = false;
  }
};

const handleModifyClick = (apt: Appointment) => {
  if (!canModify(apt)) {
    // show popup for mobile/touch devices only bcoz we got hover on pc bro
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      alert(
        "Vous pouvez modifier votre rendez-vous uniquement 24 heures avant la date prévue.",
      );
    }
    return;
  }
  openModifyModal(apt);
};

const openModifyModal = (apt: Appointment) => {
  selectedAppointment.value = apt;
  const d = new Date(apt.appointmentDate);
  modifyDate.value = d.toISOString().split("T")[0] || "";
  modifyTime.value = apt.startTime;
  modifyError.value = "";
  showModifyModal.value = true;
};

const closeModifyModal = () => {
  showModifyModal.value = false;
  selectedAppointment.value = null;
  modifyError.value = "";
};

const confirmModify = async () => {
  if (!selectedAppointment.value || !modifyDate.value || !modifyTime.value)
    return;
  modifying.value = true;
  modifyError.value = "";
  try {
    await useAuthenticatedFetch(
      `/appointments/${selectedAppointment.value.id}`,
      {
        method: "PATCH",
        body: {
          appointmentDate: modifyDate.value,
          startTime: modifyTime.value,
        },
      },
    );
    closeModifyModal();
    fetchAppointments(pagination.value.page);
  } catch (error: any) {
    modifyError.value =
      error?.data?.message || "Erreur lors de la modification";
  } finally {
    modifying.value = false;
  }
};

watch(activeTab, () => {
  fetchAppointments(1);
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchAppointments(1);
  } else {
    loading.value = false;
  }
});
</script>
