<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Téléconsultations</h1>
        <p class="text-gray-600">Gérez vos consultations à distance</p>
      </div>
      <UiButton variant="secondary" @click="showPreCallChecks = true">
        <Camera class="mr-1.5 h-4 w-4" />
        Tester caméra et microphone
      </UiButton>
    </div>

    <!-- pre call status -->
    <UiCard>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Video class="h-5 w-5 text-green-600" />
          <h3 class="text-lg font-semibold text-gray-900">
            Préparer ma consultation
          </h3>
        </div>
      </div>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <div
            :class="[
              'h-3 w-3 rounded-full',
              preCallStatus.camera ? 'bg-green-500' : 'bg-gray-300',
            ]"
          />
          <span class="text-sm">Caméra</span>
        </div>
        <div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <div
            :class="[
              'h-3 w-3 rounded-full',
              preCallStatus.microphone ? 'bg-green-500' : 'bg-gray-300',
            ]"
          />
          <span class="text-sm">Microphone</span>
        </div>
        <div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <div
            :class="[
              'h-3 w-3 rounded-full',
              preCallStatus.network
                ? 'bg-green-500'
                : preCallStatus.network === false
                  ? 'bg-red-500'
                  : 'bg-gray-300',
            ]"
          />
          <span class="text-sm">Réseau</span>
        </div>
        <div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <div
            :class="[
              'h-3 w-3 rounded-full',
              preCallStatus.browser ? 'bg-green-500' : 'bg-yellow-500',
            ]"
          />
          <span class="text-sm">Navigateur</span>
        </div>
      </div>
    </UiCard>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = 'upcoming'"
        >
          Téléconsultations à venir
          <span
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === 'upcoming'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ upcomingTeleconsultations.length }}
          </span>
        </button>
        <button
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'past'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = 'past'"
        >
          Consultations passées
          <span
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === 'past'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ pastTeleconsultations.length }}
          </span>
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'upcoming'">
      <div class="mb-4 flex items-center justify-end">
        <div class="inline-flex rounded-lg border border-gray-300 bg-white">
          <button
            :class="[
              'rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors',
              upcomingSortOrder === 'asc'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50',
            ]"
            @click="upcomingSortOrder = 'asc'"
          >
            Plus proche
          </button>
          <button
            :class="[
              'rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors',
              upcomingSortOrder === 'desc'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50',
            ]"
            @click="upcomingSortOrder = 'desc'"
          >
            Plus tard
          </button>
        </div>
      </div>
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 2"
          :key="i"
          class="animate-pulse rounded-lg border bg-white p-6"
        >
          <div class="flex gap-4">
            <div class="h-16 w-16 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-3">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="upcomingTeleconsultations.length === 0"
        class="rounded-lg border bg-white py-12 text-center"
      >
        <Video class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 class="mb-2 text-lg font-medium text-gray-900">
          Aucune téléconsultation à venir
        </h3>
        <p class="mb-6 text-gray-500">
          Prenez rendez-vous avec un praticien qui propose la téléconsultation.
        </p>
        <UiButton @click="navigateTo('/search')"
          >Rechercher un praticien</UiButton
        >
      </div>

      <div v-else>
        <div class="space-y-4">
          <div
            v-for="apt in paginatedUpcoming"
            :key="apt.id"
            class="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div class="p-6">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
                >
                  <Video class="h-8 w-8 text-green-600" />
                </div>
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
                    <UiBadge :variant="getStatusVariant(apt.status)">{{
                      getStatusLabel(apt.status)
                    }}</UiBadge>
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
                  </div>
                  <p v-if="apt.reason" class="mt-2 text-sm text-gray-500">
                    Motif : {{ apt.reason }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex gap-3 rounded-b-lg border-t bg-gray-50 px-6 py-3">
              <UiButton
                v-if="canJoinTeleconsultation(apt)"
                size="sm"
                @click="joinTeleconsultation(apt)"
              >
                <Video class="mr-1.5 h-4 w-4" />
                Rejoindre la téléconsultation
              </UiButton>
              <UiButton
                v-else-if="isTeleconsultationSoon(apt)"
                variant="secondary"
                size="sm"
                disabled
              >
                <Clock class="mr-1.5 h-4 w-4" />
                Disponible dans {{ getTimeUntilJoin(apt) }}
              </UiButton>
            </div>
          </div>
        </div>

        <div
          v-if="upcomingTotalPages > 1"
          class="mt-4 flex items-center justify-center gap-2 border-t pt-4"
        >
          <UiButton
            variant="outline"
            size="sm"
            :disabled="upcomingPage <= 1"
            @click="upcomingPage--"
          >
            Précédent
          </UiButton>
          <span class="text-sm text-gray-600">
            Page {{ upcomingPage }} / {{ upcomingTotalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="upcomingPage >= upcomingTotalPages"
            @click="upcomingPage++"
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'past'">
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 2"
          :key="i"
          class="animate-pulse rounded-lg border bg-white p-6"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-3">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="pastTeleconsultations.length === 0"
        class="rounded-lg border bg-white py-8 text-center"
      >
        <p class="text-gray-500">Aucune téléconsultation passée</p>
      </div>

      <div v-else>
        <div class="space-y-3">
          <div
            v-for="apt in paginatedPast"
            :key="apt.id"
            class="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100"
              >
                <Video class="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ apt.practitioner.title }}
                  {{ apt.practitioner.firstName }}
                  {{ apt.practitioner.lastName }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(apt.appointmentDate) }} à
                  {{ apt.startTime }}
                </p>
                <p
                  v-if="apt.teleconsultationSession?.duration"
                  class="text-xs text-gray-400"
                >
                  Durée : {{ apt.teleconsultationSession.duration }} min
                </p>
              </div>
            </div>
            <UiBadge :variant="getStatusVariant(apt.status)">{{
              getStatusLabel(apt.status)
            }}</UiBadge>
          </div>
        </div>

        <div
          v-if="pastTotalPages > 1"
          class="mt-4 flex items-center justify-center gap-2 border-t pt-4"
        >
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pastPage <= 1"
            @click="pastPage--"
          >
            Précédent
          </UiButton>
          <span class="text-sm text-gray-600">
            Page {{ pastPage }} / {{ pastTotalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pastPage >= pastTotalPages"
            @click="pastPage++"
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showPreCallChecks"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="stopPreCallTest"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Test caméra et microphone
            </h3>
            <button
              class="rounded-lg p-1 hover:bg-gray-100"
              @click="stopPreCallTest"
            >
              <X class="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div class="overflow-hidden rounded-lg bg-black">
              <video
                ref="preCallVideoRef"
                autoplay
                muted
                playsinline
                class="h-48 w-full object-cover"
              />
            </div>
            <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  :style="{ width: micLevel + '%' }"
                  class="h-full rounded-full bg-green-500 transition-all"
                />
              </div>
              <span class="text-xs text-gray-500">Volume micro</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallStatus.camera
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Camera
                  :class="
                    preCallStatus.camera ? 'text-green-600' : 'text-red-600'
                  "
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallStatus.camera ? "Caméra OK" : "Caméra indisponible"
                }}</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallStatus.microphone
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Mic
                  :class="
                    preCallStatus.microphone ? 'text-green-600' : 'text-red-600'
                  "
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallStatus.microphone ? "Micro OK" : "Micro indisponible"
                }}</span>
              </div>
            </div>
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p class="text-sm text-blue-800">
                <strong>Conseil :</strong> Utilisez un casque ou des écouteurs
                pour une meilleure qualité audio.
              </p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <UiButton variant="secondary" @click="stopPreCallTest"
              >Fermer</UiButton
            >
            <UiButton @click="runPreCallTest">Relancer le test</UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showTeleconsultationRoom"
        class="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        <TeleconsultationRoom
          :appointment-id="activeRoomAppointmentId!"
          :session="activeSession!"
          @close="closeTeleconsultationRoom"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Video, Calendar, Clock, Camera, Mic, X } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { formatDateLong as formatDate } from "~/utils/date";
import { getStatusVariant, getStatusLabel } from "~/utils/status";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
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
  teleconsultationSession?: {
    id: string;
    roomId: string;
    roomName: string;
    status: string;
    duration: number | null;
    startedAt: string | null;
    endedAt: string | null;
    connectionQuality: string | null;
  } | null;
}

const loading = ref(true);
const activeTab = ref<"upcoming" | "past">("upcoming");
const upcomingTeleconsultations = ref<Appointment[]>([]);
const pastTeleconsultations = ref<Appointment[]>([]);
const ITEMS_PER_PAGE = 5;
const upcomingPage = ref(1);
const pastPage = ref(1);
const upcomingSortOrder = ref<"asc" | "desc">("asc");

const upcomingTotalPages = computed(() =>
  Math.ceil(upcomingTeleconsultations.value.length / ITEMS_PER_PAGE),
);
const pastTotalPages = computed(() =>
  Math.ceil(pastTeleconsultations.value.length / ITEMS_PER_PAGE),
);
const paginatedUpcoming = computed(() => {
  const sorted = [...upcomingTeleconsultations.value].sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const partsA = a.startTime.split(":").map(Number);
    dateA.setHours(partsA[0] || 0, partsA[1] || 0, 0, 0);
    const dateB = new Date(b.appointmentDate);
    const partsB = b.startTime.split(":").map(Number);
    dateB.setHours(partsB[0] || 0, partsB[1] || 0, 0, 0);
    return upcomingSortOrder.value === "asc"
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
  const start = (upcomingPage.value - 1) * ITEMS_PER_PAGE;
  return sorted.slice(start, start + ITEMS_PER_PAGE);
});
const paginatedPast = computed(() => {
  const start = (pastPage.value - 1) * ITEMS_PER_PAGE;
  return pastTeleconsultations.value.slice(start, start + ITEMS_PER_PAGE);
});

const showPreCallChecks = ref(false);
const preCallVideoRef = ref<HTMLVideoElement | null>(null);
const micLevel = ref(0);
const preCallStatus = ref({
  camera: null as boolean | null,
  microphone: null as boolean | null,
  network: null as boolean | null,
  browser: null as boolean | null,
});
let preCallStream: MediaStream | null = null;
let micAnalyserInterval: ReturnType<typeof setInterval> | null = null;

const showTeleconsultationRoom = ref(false);
const activeRoomAppointmentId = ref<string | null>(null);
const activeSession = ref<{
  id: string;
  roomId: string;
  roomName: string;
  status: string;
  duration: number | null;
  startedAt: string | null;
  endedAt: string | null;
  connectionQuality: string | null;
  patient?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  practitioner?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
} | null>(null);

const fetchTeleconsultations = async () => {
  loading.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { upcoming: Appointment[]; past: Appointment[] };
    }>("/teleconsultations/patient");
    if (response.success && response.data) {
      upcomingTeleconsultations.value = response.data.upcoming;
      pastTeleconsultations.value = response.data.past;
    }
  } catch (e) {
    console.error("Failed to fetch teleconsultations:", e);
  } finally {
    loading.value = false;
  }
};

const canJoinTeleconsultation = (apt: Appointment): boolean => {
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const startParts = apt.startTime.split(":").map(Number);
  aptDate.setHours(startParts[0] || 0, startParts[1] || 0, 0, 0);

  // calculate end time from the appointments endTime
  const endDate = new Date(apt.appointmentDate);
  const endParts = apt.endTime.split(":").map(Number);
  endDate.setHours(endParts[0] || 0, endParts[1] || 0, 0, 0);

  const earlyJoinMs = aptDate.getTime() - 15 * 60 * 1000; // 15 min before start
  const lateJoinMs = endDate.getTime() + 30 * 60 * 1000; // 30 min after end time

  // allow joining from 15 min before to 30 min after appointment end time
  // this allows rejoining even after ending the call, as long as appointment window is active
  return now.getTime() >= earlyJoinMs && now.getTime() <= lateJoinMs;
};

const isTeleconsultationSoon = (apt: Appointment): boolean => {
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffMs = aptDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > 15 && diffMinutes <= 120;
};

const getTimeUntilJoin = (apt: Appointment): string => {
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const joinTime = new Date(aptDate.getTime() - 15 * 60 * 1000);
  const diffMs = joinTime.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h${mins > 0 ? mins + "min" : ""}`;
  }
  return `${diffMinutes} min`;
};

const joinTeleconsultation = async (apt: Appointment) => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        id: string;
        roomId: string;
        roomName: string;
        status: string;
        duration: number | null;
        startedAt: string | null;
        endedAt: string | null;
        connectionQuality: string | null;
        patient?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
        practitioner?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
      };
    }>(`/teleconsultations/appointment/${apt.id}`);
    if (response.success && response.data) {
      activeRoomAppointmentId.value = apt.id;
      activeSession.value = {
        id: response.data.id,
        roomId: response.data.roomId,
        roomName: response.data.roomName,
        status: response.data.status,
        duration: response.data.duration,
        startedAt: response.data.startedAt,
        endedAt: response.data.endedAt,
        connectionQuality: response.data.connectionQuality,
        patient: response.data.patient,
        practitioner: response.data.practitioner,
      };
      showTeleconsultationRoom.value = true;
    }
  } catch (e) {
    console.error("Failed to join teleconsultation:", e);
  }
};

const closeTeleconsultationRoom = () => {
  showTeleconsultationRoom.value = false;
  activeRoomAppointmentId.value = null;
  activeSession.value = null;
  fetchTeleconsultations();
};

const runPreCallTest = async () => {
  preCallStatus.value.browser = !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    window.RTCPeerConnection
  );

  try {
    preCallStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    preCallStatus.value.camera = true;
    preCallStatus.value.microphone = true;

    if (preCallVideoRef.value) {
      preCallVideoRef.value.srcObject = preCallStream;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(preCallStream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    micAnalyserInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      micLevel.value = Math.min(100, Math.round((avg / 128) * 100));
    }, 100);
  } catch {
    preCallStatus.value.camera = false;
    preCallStatus.value.microphone = false;
  }

  if ("connection" in navigator) {
    const conn = (
      navigator as unknown as { connection?: { downlink?: number } }
    ).connection;
    preCallStatus.value.network = !!(
      conn &&
      conn.downlink &&
      conn.downlink > 1
    );
  } else {
    preCallStatus.value.network = navigator.onLine;
  }
};

const stopPreCallTest = () => {
  if (preCallStream) {
    preCallStream.getTracks().forEach((t) => t.stop());
    preCallStream = null;
  }
  if (micAnalyserInterval) {
    clearInterval(micAnalyserInterval);
    micAnalyserInterval = null;
  }
  micLevel.value = 0;
  showPreCallChecks.value = false;
};

watch(showPreCallChecks, (val) => {
  if (val) {
    nextTick(() => runPreCallTest());
  } else {
    stopPreCallTest();
  }
});

const route = useRoute();

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    await fetchTeleconsultations();

    // auto join if appointmentId query param is set
    const appointmentId = route.query.appointmentId as string;
    if (appointmentId) {
      const apt = upcomingTeleconsultations.value?.find(
        (a) => a.id === appointmentId,
      );
      if (apt && canJoinTeleconsultation(apt)) {
        joinTeleconsultation(apt);
      }
    }
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopPreCallTest();
});
</script>
