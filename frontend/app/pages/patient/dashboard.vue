<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p class="text-gray-600">Bienvenue sur votre espace patient</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Prochain rendez-vous
        </h3>

        <!-- loading  -->
        <div v-if="loadingNext" class="animate-pulse">
          <div class="flex gap-4">
            <div class="h-20 w-20 rounded-full bg-gray-200"></div>
            <div class="flex-1 space-y-3">
              <div class="h-4 w-1/2 rounded bg-gray-200"></div>
              <div class="h-3 w-1/3 rounded bg-gray-200"></div>
              <div class="h-3 w-1/4 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <!-- no appointment -->
        <div v-else-if="!nextAppointment" class="py-6 text-center">
          <Calendar class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="mb-4 text-gray-500">Aucun rendez-vous à venir</p>
          <UiButton size="sm" @click="navigateTo('/search')">
            Prendre un rendez-vous
          </UiButton>
        </div>

        <!-- appointment card -->
        <div v-else>
          <div class="flex gap-4">
            <UiImageWithFallback
              :src="nextAppointment.practitioner.photo || ''"
              :alt="`${nextAppointment.practitioner.title} ${nextAppointment.practitioner.firstName} ${nextAppointment.practitioner.lastName}`"
              class-name="w-20 h-20 rounded-full object-cover"
            />
            <div class="flex-1">
              <h3 class="mb-1 text-lg font-semibold">
                {{ nextAppointment.practitioner.title }}
                {{ nextAppointment.practitioner.firstName }}
                {{ nextAppointment.practitioner.lastName }}
              </h3>
              <p class="mb-2 text-gray-600">
                {{
                  nextAppointment.practitioner.specialty || "Médecine générale"
                }}
              </p>
              <div class="mb-3 flex items-center gap-2">
                <Clock class="h-4 w-4 text-gray-500" />
                <span class="text-sm"
                  >{{ formatDate(nextAppointment.appointmentDate) }} à
                  {{ nextAppointment.startTime }}</span
                >
              </div>
              <UiBadge
                :variant="
                  nextAppointment.type === 'TELECONSULTATION'
                    ? 'success'
                    : 'primary'
                "
              >
                {{
                  nextAppointment.type === "TELECONSULTATION"
                    ? "Téléconsultation"
                    : "Cabinet"
                }}
              </UiBadge>
            </div>
          </div>
          <div class="mt-4 flex gap-3 border-t pt-4">
            <div class="group relative flex-1">
              <UiButton
                variant="secondary"
                class-name="w-full"
                :disabled="!canModifyNext"
                @click="handleModifyClick"
              >
                Modifier
              </UiButton>
              <div
                v-if="!canModifyNext"
                class="invisible absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:visible group-hover:opacity-100"
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
              v-if="canCancelNext"
              variant="danger"
              class-name="flex-1"
              @click="openCancelModal"
            >
              Annuler
            </UiButton>
            <UiButton
              v-if="canJoinNext"
              class-name="flex-1"
              @click="handleJoin"
            >
              <Video class="h-4 w-4" />
              Rejoindre
            </UiButton>
          </div>
        </div>
      </UiCard>

      <!--  actions -->
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Actions rapides
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="(action, i) in quickActions"
            :key="i"
            @click="action.action"
            :class="[
              'rounded-lg p-4 text-left transition-all hover:shadow-md',
              action.color,
            ]"
          >
            <component :is="action.icon" class="mb-2 h-6 w-6" />
            <p class="text-sm font-medium">{{ action.label }}</p>
          </button>
        </div>
      </UiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- notifications /  reminders -->
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Rappels santé</h3>

        <!-- loading  -->
        <div v-if="loadingNotifications" class="animate-pulse space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="flex gap-3 rounded-lg bg-gray-50 p-3"
          >
            <div class="h-10 w-10 rounded-lg bg-gray-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded bg-gray-200"></div>
              <div class="h-3 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <!-- no notifications -->
        <div v-else-if="notifications.length === 0" class="py-6 text-center">
          <Bell class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucune notification</p>
        </div>

        <!-- notifications list -->
        <div v-else class="space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="flex gap-3 rounded-lg bg-gray-50 p-3"
          >
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100"
            >
              <component
                :is="getNotificationIcon(notification.type)"
                class="h-5 w-5 text-blue-600"
              />
            </div>
            <div class="flex-1">
              <p class="mb-1 text-sm font-medium">{{ notification.title }}</p>
              <p class="text-xs text-gray-600">
                {{ formatNotificationTime(notification.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Rendez-vous passés
          </h3>
          <UiButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/patient/appointments')"
          >
            Voir tout
          </UiButton>
        </div>

        <!-- loading  -->
        <div v-if="loadingPast" class="animate-pulse space-y-3">
          <div v-for="i in 2" :key="i" class="rounded-lg bg-gray-50 p-3">
            <div class="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
            <div class="h-3 w-1/3 rounded bg-gray-200"></div>
          </div>
        </div>

        <div v-else-if="pastAppointments.length === 0" class="py-6 text-center">
          <FileText class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun rendez-vous passé</p>
        </div>

        <!-- past appointments list -->
        <div v-else class="space-y-3">
          <div
            v-for="apt in pastAppointments"
            :key="apt.id"
            class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
          >
            <div>
              <p class="font-medium">
                {{ apt.practitioner.title }} {{ apt.practitioner.firstName }}
                {{ apt.practitioner.lastName }}
              </p>
              <p class="text-sm text-gray-600">
                {{ apt.practitioner.specialty || "Médecine générale" }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ formatDate(apt.appointmentDate) }}
              </p>
            </div>
            <UiBadge :variant="getStatusVariant(apt.status)">{{
              getStatusLabel(apt.status)
            }}</UiBadge>
          </div>
        </div>
      </UiCard>
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
              {{ nextAppointment?.practitioner.title }}
              {{ nextAppointment?.practitioner.firstName }}
              {{ nextAppointment?.practitioner.lastName }}
            </strong>
            le
            <strong>{{
              formatDate(nextAppointment?.appointmentDate || "")
            }}</strong>
            à <strong>{{ nextAppointment?.startTime }}</strong> ?
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

    <!-- Modify Modal -->
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
              {{ nextAppointment?.practitioner.title }}
              {{ nextAppointment?.practitioner.firstName }}
              {{ nextAppointment?.practitioner.lastName }}
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
                :min="minModifyDate"
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
  Video,
  FileText,
  MessageSquare,
  Clock,
  Bell,
  Activity,
  AlertTriangle,
  Pencil,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

const authStore = useAuthStore();
const router = useRouter();

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string | null;
  photo: string | null;
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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const nextAppointment = ref<Appointment | null>(null);
const pastAppointments = ref<Appointment[]>([]);
const notifications = ref<Notification[]>([]);
const loadingNext = ref(true);
const loadingPast = ref(true);
const loadingNotifications = ref(true);

// cancel modal state
const showCancelModal = ref(false);
const cancelReason = ref("");
const cancelling = ref(false);

// modify modal state
const showModifyModal = ref(false);
const modifyDate = ref("");
const modifyTime = ref("");
const modifyError = ref("");
const modifying = ref(false);

const minModifyDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0] || "";
});

// action helpers for next appointment
const canModifyNext = computed(() => {
  if (!nextAppointment.value) return false;
  const apt = nextAppointment.value;
  if (apt.status === "CANCELLED" || apt.status === "COMPLETED") return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 24;
});

const canCancelNext = computed(() => {
  if (!nextAppointment.value) return false;
  const apt = nextAppointment.value;
  if (apt.status === "CANCELLED" || apt.status === "COMPLETED") return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return aptDate > now;
});

const canJoinNext = computed(() => {
  if (!nextAppointment.value) return false;
  const apt = nextAppointment.value;
  if (apt.type !== "TELECONSULTATION") return false;
  if (apt.status === "CANCELLED" || apt.status === "COMPLETED") return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffMinutes = (aptDate.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60;
});

const quickActions = [
  {
    icon: Calendar,
    label: "Prendre RDV",
    action: () => router.push("/search"),
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Video,
    label: "Téléconsultation",
    action: () => router.push("/patient/waiting"),
    color: "bg-green-100 text-green-600",
  },
  {
    icon: FileText,
    label: "Mes documents",
    action: () => router.push("/patient/documents"),
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    action: () => router.push("/patient/messages"),
    color: "bg-purple-100 text-purple-600",
  },
];

const fetchNextAppointment = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Appointment | null;
    }>("/appointments/patient/next");
    if (response.success) {
      nextAppointment.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching next appointment:", error);
  } finally {
    loadingNext.value = false;
  }
};

const fetchPastAppointments = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Appointment[];
    }>("/appointments/patient/past");
    if (response.success) {
      pastAppointments.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching past appointments:", error);
  } finally {
    loadingPast.value = false;
  }
};

const fetchNotifications = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Notification[];
    }>("/notifications?limit=5");
    if (response.success) {
      notifications.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  } finally {
    loadingNotifications.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatNotificationTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return "Hier";
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return formatDate(dateStr);
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "APPOINTMENT_REMINDER":
      return Bell;
    case "DOCUMENT_SHARED":
      return FileText;
    case "MESSAGE_RECEIVED":
      return MessageSquare;
    default:
      return Activity;
  }
};

const getStatusVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" => {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "NO_SHOW":
      return "warning";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Terminé";
    case "CANCELLED":
      return "Annulé";
    case "NO_SHOW":
      return "Absent";
    default:
      return status;
  }
};

const openCancelModal = () => {
  cancelReason.value = "";
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
};

const confirmCancel = async () => {
  if (!nextAppointment.value) return;
  cancelling.value = true;
  try {
    await useAuthenticatedFetch(
      `/appointments/${nextAppointment.value.id}/cancel`,
      {
        method: "PATCH",
        body: { reason: cancelReason.value || undefined },
      },
    );
    closeCancelModal();
    loadingNext.value = true;
    await fetchNextAppointment();
    loadingPast.value = true;
    await fetchPastAppointments();
  } catch (error: any) {
    console.error("Error cancelling:", error);
    alert(error?.data?.message || "Erreur lors de l'annulation");
  } finally {
    cancelling.value = false;
  }
};

const handleModifyClick = () => {
  if (!canModifyNext.value) {
    // show popup for mobile/touch devices only bcoz we got hover on pc bro
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      alert(
        "Vous pouvez modifier votre rendez-vous uniquement 24 heures avant la date prévue.",
      );
    }
    return;
  }
  openModifyModal();
};

const openModifyModal = () => {
  if (!nextAppointment.value) return;
  const d = new Date(nextAppointment.value.appointmentDate);
  modifyDate.value = d.toISOString().split("T")[0] || "";
  modifyTime.value = nextAppointment.value.startTime;
  modifyError.value = "";
  showModifyModal.value = true;
};

const closeModifyModal = () => {
  showModifyModal.value = false;
  modifyError.value = "";
};

const confirmModify = async () => {
  if (!nextAppointment.value || !modifyDate.value || !modifyTime.value) return;
  modifying.value = true;
  modifyError.value = "";
  try {
    await useAuthenticatedFetch(`/appointments/${nextAppointment.value.id}`, {
      method: "PATCH",
      body: {
        appointmentDate: modifyDate.value,
        startTime: modifyTime.value,
      },
    });
    closeModifyModal();
    loadingNext.value = true;
    await fetchNextAppointment();
  } catch (error: any) {
    modifyError.value =
      error?.data?.message || "Erreur lors de la modification";
  } finally {
    modifying.value = false;
  }
};

const handleJoin = () => {
  alert("La téléconsultation sera bientôt disponible.");
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (authStore.accessToken) {
    fetchNextAppointment();
    fetchPastAppointments();
    fetchNotifications();
  } else {
    loadingNext.value = false;
    loadingPast.value = false;
    loadingNotifications.value = false;
  }
});
</script>
