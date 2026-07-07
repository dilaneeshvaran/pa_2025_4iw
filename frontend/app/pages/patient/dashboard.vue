<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
      <p class="mt-1 text-sm text-gray-500">Bienvenue sur votre espace patient</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- next appointment - visual moment -->
      <div class="rounded-2xl border border-[#00804A]/15 bg-[#00804A]/5 p-6">
        <h3 class="font-display text-base font-semibold text-gray-900">
          Prochain rendez-vous
        </h3>

        <!-- loading  -->
        <div v-if="loadingNext" class="mt-4 animate-pulse">
          <div class="flex gap-4">
            <div class="h-16 w-16 rounded-full bg-[#00804A]/10"></div>
            <div class="flex-1 space-y-3">
              <div class="h-4 w-1/2 rounded bg-[#00804A]/10"></div>
              <div class="h-3 w-1/3 rounded bg-[#00804A]/10"></div>
              <div class="h-3 w-1/4 rounded bg-[#00804A]/10"></div>
            </div>
          </div>
        </div>

        <!-- no appointment -->
        <div v-else-if="!nextAppointment" class="flex flex-col items-center justify-center py-12 text-center">
          <Calendar class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Aucun rendez-vous</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">
            Vous n'avez pas encore de rendez-vous planifié.
          </p>
          <UiButton size="sm" class-name="mt-5" @click="navigateTo('/search')">
            Prendre un rendez-vous
          </UiButton>
        </div>

        <!-- appointment card -->
        <div v-else class="mt-4">
          <div class="flex gap-4">
            <UiImageWithFallback
              :src="nextAppointment.practitioner.photo || ''"
              :alt="`${nextAppointment.practitioner.title} ${nextAppointment.practitioner.firstName} ${nextAppointment.practitioner.lastName}`"
              class-name="w-16 h-16 rounded-full object-cover"
            />
            <div class="flex-1">
              <h3 class="font-display text-base font-semibold text-gray-900">
                {{ nextAppointment.practitioner.title }}
                {{ nextAppointment.practitioner.firstName }}
                {{ nextAppointment.practitioner.lastName }}
              </h3>
              <p class="text-sm text-gray-500">
                {{
                  nextAppointment.practitioner.specialty || "Médecine générale"
                }}
              </p>
              <div class="mt-2 flex items-center gap-2">
                <Clock class="h-4 w-4 text-gray-400" :stroke-width="1.75" />
                <span class="tabular-nums text-sm font-medium text-gray-700"
                  >{{ formatDate(nextAppointment.appointmentDate) }} à
                  {{ nextAppointment.startTime }}</span
                >
              </div>
              <div class="mt-2">
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
          </div>
          <div class="mt-4 flex gap-3 border-t border-[#00804A]/10 pt-4">
            <div class="group relative flex-1">
              <UiButton
                variant="outline"
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
                  Vous pouvez modifier uniquement
                  {{ nextAppointment?.practitioner?.cancellationNotice || 24 }}h
                  avant
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
              variant="secondary"
              class-name="flex-1"
              @click="handleJoin"
            >
              <Video class="h-4 w-4" :stroke-width="1.75" />
              Rejoindre
            </UiButton>
          </div>
        </div>
      </div>

      <!--  actions -->
      <UiCard>
        <h3 class="mb-4 font-display text-base font-semibold text-gray-900">
          Actions rapides
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="(action, i) in quickActions"
            :key="i"
            @click="action.action"
            class="group flex items-center gap-3 rounded-lg border border-black/[0.08] bg-white p-4 text-left transition-all duration-150 hover:shadow-[0_4px_14px_rgba(26,21,16,0.09)]"
          >
            <component :is="action.icon" class="h-5 w-5 flex-shrink-0" :class="action.iconColor" :stroke-width="1.75" />
            <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">{{ action.label }}</p>
          </button>
        </div>
      </UiCard>
    </div>

    <div class="mt-6 border-t border-gray-100 pt-6">
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- health reminders -->
        <UiCard id="health-reminders">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-display text-base font-semibold text-gray-900">Rappels santé</h3>
          </div>

          <!-- loading  -->
          <div v-if="loadingHealthReminders" class="animate-pulse space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="flex gap-3 rounded-lg bg-gray-50 p-3"
            >
              <div class="h-4 w-4 rounded bg-gray-200"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 rounded bg-gray-200"></div>
                <div class="h-3 w-1/2 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>

          <!-- no reminders -->
          <div v-else-if="healthReminders.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <Bell class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
            <h3 class="font-display text-base font-semibold text-gray-800">Tout est à jour</h3>
            <p class="mt-1 max-w-[280px] text-sm text-gray-400">Aucune notification en attente.</p>
          </div>

          <!-- notifications list -->
          <div v-else class="max-h-[300px] space-y-2 overflow-y-auto">
            <div
              v-for="reminder in healthReminders"
              :key="reminder.id"
              class="flex items-start gap-3 rounded-lg border border-black/[0.05] bg-gray-50/50 p-3"
            >
              <Activity class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#D96F00]" :stroke-width="1.75" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">
                  {{ reminder.message }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400">
                  {{ reminder.practitioner.title }}
                  {{ reminder.practitioner.firstName }}
                  {{ reminder.practitioner.lastName }} ·
                  <span class="tabular-nums">{{ formatNotificationTime(reminder.scheduledFor) }}</span>
                </p>
              </div>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-display text-base font-semibold text-gray-900">
              Rendez-vous passés
            </h3>
            <UiButton
              variant="ghost"
              size="sm"
              @click="navigateTo('/patient/appointments?tab=past')"
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

          <div v-else-if="pastAppointments.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <FileText class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
            <h3 class="font-display text-base font-semibold text-gray-800">Aucun rendez-vous</h3>
            <p class="mt-1 max-w-[280px] text-sm text-gray-400">Vos rendez-vous passés apparaîtront ici.</p>
          </div>

          <!-- past appointments list -->
          <div v-else class="max-h-[300px] space-y-2 overflow-y-auto">
            <div
              v-for="apt in pastAppointments"
              :key="apt.id"
              class="flex items-center justify-between rounded-lg border border-black/[0.05] bg-gray-50/50 p-3"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ apt.practitioner.title }} {{ apt.practitioner.firstName }}
                  {{ apt.practitioner.lastName }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ apt.practitioner.specialty || "Médecine générale" }}
                </p>
                <p class="mt-1 tabular-nums text-xs text-gray-400">
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

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeCancelModal"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <AlertTriangle class="h-5 w-5 text-red-600" :stroke-width="1.75" />
            <h3 class="font-display text-base font-semibold text-gray-900">
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
              class="mt-1"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <UiButton
              variant="outline"
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
            <Pencil class="h-5 w-5 text-[#D96F00]" :stroke-width="1.75" />
            <h3 class="font-display text-base font-semibold text-gray-900">
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
                class="mt-1"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nouvel horaire
              </label>
              <input
                v-model="modifyTime"
                type="time"
                class="mt-1"
              />
            </div>
          </div>

          <p v-if="modifyError" class="mb-3 text-sm text-red-600">
            {{ modifyError }}
          </p>

          <div class="flex gap-3">
            <UiButton
              variant="outline"
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
import { formatDate, formatNotificationTime } from "~/utils/date";
import { getStatusVariant, getStatusLabel } from "~/utils/status";
import type { PatientHealthReminderOccurrence } from "@medicote/shared";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
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
  cancellationNotice?: number;
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

const nextAppointment = ref<Appointment | null>(null);
const pastAppointments = ref<Appointment[]>([]);
const healthReminders = ref<PatientHealthReminderOccurrence[]>([]);
const loadingNext = ref(true);
const loadingPast = ref(true);
const loadingHealthReminders = ref(true);

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
  const cancellationNotice = apt.practitioner.cancellationNotice || 24;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const aptMs = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffHours = (aptMs - now) / (1000 * 60 * 60);
  return diffHours >= cancellationNotice;
});

const canCancelNext = computed(() => {
  if (!nextAppointment.value) return false;
  const apt = nextAppointment.value;
  if (apt.status === "CANCELLED" || apt.status === "COMPLETED") return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentMs = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  return appointmentMs > now;
});

const canJoinNext = computed(() => {
  if (!nextAppointment.value) return false;
  const apt = nextAppointment.value;
  if (apt.type !== "TELECONSULTATION") return false;
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentMs = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMinutes = (appointmentMs - now) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60;
});

const quickActions = [
  {
    icon: Calendar,
    label: "Prendre RDV",
    action: () => router.push("/search"),
    iconColor: "text-[#D96F00]",
  },
  {
    icon: Video,
    label: "Téléconsultation",
    action: () => router.push("/patient/teleconsultations"),
    iconColor: "text-[#00804A]",
  },
  {
    icon: FileText,
    label: "Mes documents",
    action: () => router.push("/patient/documents"),
    iconColor: "text-[#D96F00]",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    action: () => router.push("/patient/messages"),
    iconColor: "text-gray-500",
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

const fetchHealthReminders = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: PatientHealthReminderOccurrence[];
    }>("/health-reminders/patient/dashboard?limit=5");
    if (response.success) {
      healthReminders.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching health reminders:", error);
  } finally {
    loadingHealthReminders.value = false;
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
      const notice =
        nextAppointment.value?.practitioner?.cancellationNotice || 24;
      alert(
        `Vous pouvez modifier votre rendez-vous uniquement ${notice} heures avant la date prévue.`,
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
  if (nextAppointment.value) {
    navigateTo(
      `/patient/teleconsultations?appointmentId=${nextAppointment.value.id}`,
    );
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (authStore.accessToken) {
    fetchNextAppointment();
    fetchPastAppointments();
    fetchHealthReminders();
  } else {
    loadingNext.value = false;
    loadingPast.value = false;
    loadingHealthReminders.value = false;
  }
});
</script>
