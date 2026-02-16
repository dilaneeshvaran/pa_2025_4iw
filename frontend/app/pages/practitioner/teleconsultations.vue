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

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100"
          >
            <Video class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Aujourd'hui</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ todaySessions.length }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100"
          >
            <Clock class="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">En attente</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ waitingPatients.length }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100"
          >
            <CheckCircle class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">
              Terminées ({{ pastPeriod === "week" ? "semaine" : "mois" }})
            </p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ pastSessions.length }}
            </p>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100"
          >
            <AlertTriangle class="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Non présentés</p>
            <p
              v-if="loading"
              class="h-7 w-10 animate-pulse rounded bg-gray-200"
            />
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ noShowCount }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <UiCard v-if="waitingPatients.length > 0">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
          <h3 class="text-lg font-semibold text-gray-900">
            Patients en attente
          </h3>
        </div>
        <UiBadge variant="warning"
          >{{ waitingPatients.length }} en attente</UiBadge
        >
      </div>
      <div class="space-y-3">
        <div
          v-for="wp in waitingPatients"
          :key="wp.id"
          class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100"
            >
              <User class="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ wp.patientName }}</p>
              <p class="text-sm text-gray-500">
                En attente depuis {{ formatWaitingTime(wp.joinedAt) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UiButton size="sm" @click="joinSession(wp)">
              <Video class="mr-1.5 h-4 w-4" />
              Rejoindre
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="viewPatientFile(wp)"
            >
              <FileText class="mr-1.5 h-4 w-4" />
              Voir dossier
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Téléconsultations du jour
        </h3>
        <UiButton variant="outline" size="sm" @click="refreshData">
          <RefreshCw class="mr-1.5 h-4 w-4" />
          Actualiser
        </UiButton>
      </div>

      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border p-4"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="todaySessions.length === 0" class="py-8 text-center">
        <Video class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucune téléconsultation prévue aujourd'hui</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="session in todaySessions"
          :key="session.id"
          class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full',
                getSessionBgColor(session.status),
              ]"
            >
              <Video
                :class="['h-5 w-5', getSessionIconColor(session.status)]"
              />
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ session.patientName }}</p>
              <div class="flex items-center gap-3 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <Clock class="h-3.5 w-3.5" />
                  {{ session.startTime }} - {{ session.endTime }}
                </span>
                <span v-if="session.reason" class="truncate">{{
                  session.reason
                }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UiBadge :variant="getStatusBadgeVariant(session.status)">
              {{ getStatusLabel(session.status) }}
            </UiBadge>
            <UiButton
              v-if="canJoinSession(session)"
              size="sm"
              @click="joinSession(session)"
            >
              <Video class="mr-1.5 h-4 w-4" />
              Rejoindre
            </UiButton>
            <UiButton
              v-if="canMarkNoShow(session)"
              variant="danger"
              size="sm"
              @click="markNoShow(session)"
            >
              Non présenté
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="viewPatientFile(session)"
            >
              <FileText class="mr-1.5 h-4 w-4" />
              Dossier
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Consultations passées
        </h3>
        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              :class="[
                'rounded-l-lg px-4 py-2 text-sm font-medium transition-colors',
                pastPeriod === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="pastPeriod = 'week'"
            >
              Semaine
            </button>
            <button
              :class="[
                'rounded-r-lg px-4 py-2 text-sm font-medium transition-colors',
                pastPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="pastPeriod = 'month'"
            >
              Mois
            </button>
          </div>
          <UiButton
            variant="outline"
            size="sm"
            @click="showHistoryModal = true"
          >
            <Search class="mr-1.5 h-4 w-4" />
            Historique complet
          </UiButton>
        </div>
      </div>

      <div v-if="loadingPast" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border p-4"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-gray-200" />
              <div class="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="pastSessions.length === 0" class="py-8 text-center">
        <p class="text-gray-500">
          Aucune consultation passée cette
          {{ pastPeriod === "week" ? "semaine" : "période" }}
        </p>
      </div>

      <div v-else>
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500">
              <th class="pb-3 font-medium">Patient</th>
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Durée</th>
              <th class="pb-3 font-medium">Statut</th>
              <th class="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="ps in pastSessions"
              :key="ps.id"
              class="hover:bg-gray-50"
            >
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                  >
                    <User class="h-4 w-4 text-gray-500" />
                  </div>
                  <span class="font-medium text-gray-900">{{
                    ps.patientName
                  }}</span>
                </div>
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ formatDate(ps.scheduledAt) }}
              </td>
              <td class="py-3 text-sm text-gray-600">
                {{ ps.duration ? ps.duration + " min" : "-" }}
              </td>
              <td class="py-3">
                <UiBadge :variant="getStatusBadgeVariant(ps.status)">{{
                  getStatusLabel(ps.status)
                }}</UiBadge>
              </td>
              <td class="py-3">
                <UiButton
                  variant="secondary"
                  size="sm"
                  @click="viewPatientFile(ps)"
                >
                  <FileText class="mr-1 h-3.5 w-3.5" />
                  Dossier
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <Teleport to="body">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showHistoryModal = false"
      >
        <div class="mx-4 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Historique des téléconsultations
            </h3>
            <button
              class="rounded-lg p-1 hover:bg-gray-100"
              @click="showHistoryModal = false"
            >
              <X class="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div class="border-b px-6 py-4">
            <div class="flex flex-wrap gap-3">
              <div class="relative flex-1">
                <Search
                  class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model="historySearch"
                  type="text"
                  placeholder="Rechercher un patient..."
                  class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @input="debouncedFetchHistory"
                />
              </div>
              <select
                v-model="historyStatus"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                @change="fetchHistory()"
              >
                <option value="">Tous les statuts</option>
                <option value="COMPLETED">Terminées</option>
                <option value="CANCELLED">Annulées</option>
                <option value="FAILED">Échouées</option>
                <option value="NO_SHOW">Non présentés</option>
              </select>
              <input
                v-model="historyDateFrom"
                type="date"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                @change="fetchHistory()"
              />
              <input
                v-model="historyDateTo"
                type="date"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                @change="fetchHistory()"
              />
            </div>
          </div>

          <div class="max-h-[60vh] overflow-y-auto px-6">
            <div v-if="loadingHistory" class="space-y-3 py-4">
              <div
                v-for="i in 5"
                :key="i"
                class="animate-pulse rounded-lg border p-3"
              >
                <div class="flex gap-3">
                  <div class="h-8 w-8 rounded-full bg-gray-200" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-1/3 rounded bg-gray-200" />
                    <div class="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="historyItems.length === 0"
              class="py-12 text-center"
            >
              <p class="text-gray-500">Aucun résultat trouvé</p>
            </div>

            <table v-else class="w-full">
              <thead>
                <tr class="border-b text-left text-sm text-gray-500">
                  <th class="py-3 font-medium">Patient</th>
                  <th class="py-3 font-medium">Date</th>
                  <th class="py-3 font-medium">Durée</th>
                  <th class="py-3 font-medium">Qualité</th>
                  <th class="py-3 font-medium">Statut</th>
                  <th class="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="item in historyItems"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="py-3">
                    <span class="font-medium text-gray-900">{{
                      item.patientName
                    }}</span>
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ formatDate(item.scheduledAt) }}
                  </td>
                  <td class="py-3 text-sm text-gray-600">
                    {{ item.duration ? item.duration + " min" : "-" }}
                  </td>
                  <td class="py-3">
                    <span
                      v-if="item.connectionQuality"
                      :class="getQualityClass(item.connectionQuality)"
                      class="text-sm"
                    >
                      {{ getQualityLabel(item.connectionQuality) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="py-3">
                    <UiBadge :variant="getStatusBadgeVariant(item.status)">{{
                      getStatusLabel(item.status)
                    }}</UiBadge>
                  </td>
                  <td class="py-3">
                    <UiButton
                      variant="secondary"
                      size="sm"
                      @click="viewPatientFile(item)"
                    >
                      <FileText class="mr-1 h-3.5 w-3.5" />
                      Dossier
                    </UiButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="historyPagination.totalPages > 1"
            class="flex items-center justify-center gap-2 border-t px-6 py-4"
          >
            <UiButton
              variant="outline"
              size="sm"
              :disabled="historyPagination.page <= 1"
              @click="fetchHistory(historyPagination.page - 1)"
            >
              Précédent
            </UiButton>
            <span class="text-sm text-gray-600">
              Page {{ historyPagination.page }} /
              {{ historyPagination.totalPages }}
            </span>
            <UiButton
              variant="outline"
              size="sm"
              :disabled="historyPagination.page >= historyPagination.totalPages"
              @click="fetchHistory(historyPagination.page + 1)"
            >
              Suivant
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPreCallChecks"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showPreCallChecks = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Test caméra et microphone
            </h3>
            <button
              class="rounded-lg p-1 hover:bg-gray-100"
              @click="closePreCallChecks"
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
                  preCallCamera
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Camera
                  :class="preCallCamera ? 'text-green-600' : 'text-red-600'"
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallCamera ? "Caméra OK" : "Caméra indisponible"
                }}</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallMic
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Mic
                  :class="preCallMic ? 'text-green-600' : 'text-red-600'"
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallMic ? "Micro OK" : "Micro indisponible"
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
            <UiButton variant="secondary" @click="closePreCallChecks"
              >Fermer</UiButton
            >
            <UiButton @click="runPreCallTest">Relancer le test</UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- room -->
    <Teleport to="body">
      <div
        v-if="showTeleconsultationRoom"
        class="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        <TeleconsultationRoom
          :appointment-id="activeAppointmentId!"
          :session="activeSessionData!"
          @close="closeTeleconsultationRoom"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Video,
  Clock,
  User,
  FileText,
  Search,
  X,
  RefreshCw,
  Camera,
  Mic,
  CheckCircle,
  AlertTriangle,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});

const authStore = useAuthStore();
const router = useRouter();

interface SessionItem {
  id: string;
  appointmentId: string;
  patientId?: string;
  patientName: string;
  startTime: string;
  endTime: string;
  scheduledAt: string;
  status: string;
  reason?: string;
  duration?: number | null;
  connectionQuality?: string | null;
  joinedAt?: string;
  roomId?: string;
  roomName?: string;
}

const loading = ref(true);
const loadingPast = ref(false);
const loadingHistory = ref(false);
const todaySessions = ref<SessionItem[]>([]);
const waitingPatients = ref<SessionItem[]>([]);
const pastSessions = ref<SessionItem[]>([]);
const noShowCount = ref(0);
const pastPeriod = ref<"week" | "month">("week");

const showHistoryModal = ref(false);
const historySearch = ref("");
const historyStatus = ref("");
const historyDateFrom = ref("");
const historyDateTo = ref("");
const historyItems = ref<SessionItem[]>([]);
const historyPagination = ref({ page: 1, totalPages: 1, total: 0 });

const showPreCallChecks = ref(false);
const preCallVideoRef = ref<HTMLVideoElement | null>(null);
const preCallCamera = ref(false);
const preCallMic = ref(false);
const micLevel = ref(0);
let preCallStream: MediaStream | null = null;
let micAnalyserInterval: ReturnType<typeof setInterval> | null = null;

const showTeleconsultationRoom = ref(false);
const activeAppointmentId = ref<string | null>(null);
const activeSessionData = ref<{
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

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const fetchTodaySessions = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>("/teleconsultations/practitioner/today");
    if (res.success) todaySessions.value = res.data;
  } catch (e) {
    console.error("Error fetching today sessions:", e);
  }
};

const fetchWaitingPatients = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>("/teleconsultations/practitioner/waiting");
    if (res.success) waitingPatients.value = res.data;
  } catch (e) {
    console.error("Error fetching waiting patients:", e);
  }
};

const fetchPastSessions = async () => {
  loadingPast.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
    }>(`/teleconsultations/practitioner/past?period=${pastPeriod.value}`);
    if (res.success) {
      pastSessions.value = res.data;
      noShowCount.value = res.data.filter(
        (s) => s.status === "FAILED" || s.status === "NO_SHOW",
      ).length;
    }
  } catch (e) {
    console.error("Error fetching past sessions:", e);
  } finally {
    loadingPast.value = false;
  }
};

const fetchHistory = async (page = 1) => {
  loadingHistory.value = true;
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (historySearch.value) params.set("search", historySearch.value);
    if (historyStatus.value) params.set("status", historyStatus.value);
    if (historyDateFrom.value) params.set("dateFrom", historyDateFrom.value);
    if (historyDateTo.value) params.set("dateTo", historyDateTo.value);

    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SessionItem[];
      pagination: { page: number; totalPages: number; total: number };
    }>(`/teleconsultations/practitioner/history?${params.toString()}`);
    if (res.success) {
      historyItems.value = res.data;
      historyPagination.value = res.pagination;
    }
  } catch (e) {
    console.error("Error fetching history:", e);
  } finally {
    loadingHistory.value = false;
  }
};

const debouncedFetchHistory = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHistory(), 400);
};

const refreshData = async () => {
  await Promise.all([
    fetchTodaySessions(),
    fetchWaitingPatients(),
    fetchPastSessions(),
  ]);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWaitingTime = (joinedAt?: string) => {
  if (!joinedAt) return "quelques instants";
  const diff = Math.floor(
    (Date.now() - new Date(joinedAt).getTime()) / 1000 / 60,
  );
  if (diff < 1) return "moins d'une minute";
  if (diff === 1) return "1 minute";
  return `${diff} minutes`;
};

const getSessionBgColor = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-100";
    case "WAITING":
      return "bg-yellow-100";
    case "IN_PROGRESS":
      return "bg-green-100";
    case "COMPLETED":
      return "bg-gray-100";
    case "FAILED":
    case "NO_SHOW":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
};

const getSessionIconColor = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "text-blue-600";
    case "WAITING":
      return "text-yellow-600";
    case "IN_PROGRESS":
      return "text-green-600";
    case "COMPLETED":
      return "text-gray-500";
    case "FAILED":
    case "NO_SHOW":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
};

const getStatusBadgeVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" | "primary" => {
  switch (status) {
    case "IN_PROGRESS":
      return "success";
    case "WAITING":
    case "SCHEDULED":
      return "warning";
    case "COMPLETED":
      return "primary";
    case "FAILED":
    case "CANCELLED":
    case "NO_SHOW":
      return "danger";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "Planifiée";
    case "WAITING":
      return "En attente";
    case "IN_PROGRESS":
      return "En cours";
    case "COMPLETED":
      return "Terminée";
    case "CANCELLED":
      return "Annulée";
    case "FAILED":
      return "Échouée";
    case "NO_SHOW":
      return "Non présenté";
    default:
      return status;
  }
};

const getQualityLabel = (q: string) => {
  switch (q) {
    case "GOOD":
      return "Bonne";
    case "MEDIUM":
      return "Moyenne";
    case "POOR":
      return "Faible";
    default:
      return q;
  }
};

const getQualityClass = (q: string) => {
  switch (q) {
    case "GOOD":
      return "text-green-600";
    case "MEDIUM":
      return "text-yellow-600";
    case "POOR":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const canJoinSession = (session: SessionItem) => {
  return (
    session.status === "SCHEDULED" ||
    session.status === "WAITING" ||
    session.status === "IN_PROGRESS"
  );
};

const canMarkNoShow = (session: SessionItem) => {
  if (session.status !== "SCHEDULED" && session.status !== "WAITING")
    return false;
  const scheduledTime = new Date(session.scheduledAt);
  const now = new Date();
  return now.getTime() - scheduledTime.getTime() > 15 * 60 * 1000;
};

const joinSession = async (session: SessionItem) => {
  try {
    const res = await useAuthenticatedFetch<{
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
    }>(`/teleconsultations/appointment/${session.appointmentId}`);
    if (res.success && res.data) {
      activeAppointmentId.value = session.appointmentId;
      activeSessionData.value = {
        id: res.data.id,
        roomId: res.data.roomId,
        roomName: res.data.roomName,
        status: res.data.status,
        duration: res.data.duration,
        startedAt: res.data.startedAt,
        endedAt: res.data.endedAt,
        connectionQuality: res.data.connectionQuality,
        patient: res.data.patient,
        practitioner: res.data.practitioner,
      };
      showTeleconsultationRoom.value = true;
    }
  } catch (e) {
    console.error("Failed to join session:", e);
  }
};

const closeTeleconsultationRoom = () => {
  showTeleconsultationRoom.value = false;
  activeAppointmentId.value = null;
  activeSessionData.value = null;
  refreshData();
};

const markNoShow = async (session: SessionItem) => {
  try {
    await useAuthenticatedFetch(`/teleconsultations/${session.id}/no-show`, {
      method: "POST",
    });
    await refreshData();
  } catch (e) {
    console.error("Failed to mark no-show:", e);
  }
};

const viewPatientFile = (session: SessionItem) => {
  if (session.patientId) {
    router.push(`/practitioner/patients/${session.patientId}`);
  }
};

const runPreCallTest = async () => {
  try {
    preCallStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    preCallCamera.value = true;
    preCallMic.value = true;

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
    preCallCamera.value = false;
    preCallMic.value = false;
  }
};

const closePreCallChecks = () => {
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
  if (val) nextTick(() => runPreCallTest());
});

watch(pastPeriod, () => {
  fetchPastSessions();
});

watch(showHistoryModal, (val) => {
  if (val) fetchHistory();
});

// refresh waiting patients atutomatic
let waitingRefresh: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  if (!authStore.isAuthenticated) authStore.initAuth();
  if (authStore.accessToken) {
    await refreshData();
    loading.value = false;

    waitingRefresh = setInterval(() => {
      fetchWaitingPatients();
    }, 30_000);
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  closePreCallChecks();
  if (waitingRefresh) clearInterval(waitingRefresh);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>
