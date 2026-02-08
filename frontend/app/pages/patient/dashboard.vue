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
            <UiButton variant="secondary" class-name="flex-1">
              Modifier
            </UiButton>
            <UiButton variant="danger" class-name="flex-1"> Annuler </UiButton>
            <UiButton
              v-if="nextAppointment.type === 'TELECONSULTATION'"
              class-name="flex-1"
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
  Heart,
  Activity,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

const config = useRuntimeConfig();
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
    const response = await $fetch<{
      success: boolean;
      data: Appointment | null;
    }>("/api/appointments/patient/next", {
      baseURL: config.public.apiBase,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
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
    const response = await $fetch<{ success: boolean; data: Appointment[] }>(
      "/api/appointments/patient/past",
      {
        baseURL: config.public.apiBase,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    );
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
    const response = await $fetch<{ success: boolean; data: Notification[] }>(
      "/api/notifications?limit=5",
      {
        baseURL: config.public.apiBase,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    );
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

onMounted(() => {
  fetchNextAppointment();
  fetchPastAppointments();
  fetchNotifications();
});
</script>
