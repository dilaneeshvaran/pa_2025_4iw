<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900">Gestion des No-Shows</h1>
    <p class="mb-6 text-gray-600">
      Patients avec absences répétées - avertissements et sanctions
    </p>

    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[240px] flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Rechercher
          </label>
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom, prénom ou email..."
              class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              @input="debouncedFetch"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Date début
          </label>
          <input
            v-model="dateFrom"
            type="date"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="fetchPatients"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Date fin
          </label>
          <input
            v-model="dateTo"
            type="date"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="fetchPatients"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Absences min.
          </label>
          <input
            v-model.number="minNoShows"
            type="number"
            min="0"
            placeholder="0"
            class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="fetchPatients"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            v-model="statusFilter"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="fetchPatients"
          >
            <option value="">Tous</option>
            <option value="normal">Normal</option>
            <option value="warned">Averti</option>
            <option value="banned">Banni</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Tri no-shows
          </label>
          <select
            v-model="sortOrder"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="fetchPatients"
          >
            <option value="desc">Plus élevé d'abord</option>
            <option value="asc">Plus faible d'abord</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement des données...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 p-4 text-red-800">
      {{ fetchError }}
    </div>

    <div
      v-else-if="patients.length === 0"
      class="rounded-lg border border-gray-200 bg-white py-12 text-center"
    >
      <AlertTriangle class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <p class="text-gray-500">Aucun patient avec absences trouvé</p>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-lg border border-gray-200 bg-white"
    >
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50">
          <tr>
            <th class="px-4 py-3 font-medium text-gray-700">Patient</th>
            <th class="px-4 py-3 font-medium text-gray-700">Total RDV</th>
            <th
              class="cursor-pointer px-4 py-3 font-medium text-gray-700"
              @click="toggleSort"
            >
              No-shows
              <component
                :is="sortOrder === 'desc' ? ArrowDown : ArrowUp"
                class="ml-1 inline h-4 w-4"
              />
            </th>
            <th class="px-4 py-3 font-medium text-gray-700">Taux présence</th>
            <th class="px-4 py-3 font-medium text-gray-700">Statut</th>
            <th class="px-4 py-3 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="patient in patients"
            :key="patient.id"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-3">
              <div>
                <p class="font-medium text-gray-900">
                  {{ patient.firstName }} {{ patient.lastName }}
                </p>
                <p class="text-xs text-gray-500">{{ patient.email }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ patient.totalAppointments }}
            </td>
            <td class="px-4 py-3">
              <span class="font-semibold text-red-600">
                {{ patient.noShows }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'font-medium',
                  patient.attendanceRate >= 80
                    ? 'text-green-600'
                    : patient.attendanceRate >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600',
                ]"
              >
                {{ patient.attendanceRate }}%
              </span>
            </td>
            <td class="px-4 py-3">
              <UiBadge :variant="getStatusVariant(patient.status)">
                {{ getStatusLabel(patient.status) }}
              </UiBadge>
            </td>
            <td class="px-4 py-3">
              <div class="relative">
                <button
                  class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
                  @click.stop="toggleMenu(patient.id, $event)"
                >
                  <MoreVertical class="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- dropdown menu (teleport to body to avoid overflow crop) -->
    <Teleport to="body">
      <div
        v-if="openMenuId"
        class="fixed z-50 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        :style="{
          top: menuPosition.top + 'px',
          left: menuPosition.left + 'px',
        }"
      >
        <button
          class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          @click="viewHistory(patients.find((p: any) => p.id === openMenuId)!)"
        >
          <History class="h-4 w-4" />
          Voir historique
        </button>
        <button
          v-if="
            patients.find((p: any) => p.id === openMenuId)?.status !== 'banned'
          "
          class="flex w-full items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
          @click="
            openWarnModal(patients.find((p: any) => p.id === openMenuId)!)
          "
        >
          <AlertTriangle class="h-4 w-4" />
          Envoyer avertissement
        </button>
        <button
          v-if="
            patients.find((p: any) => p.id === openMenuId)?.status !== 'banned'
          "
          class="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          @click="openBanModal(patients.find((p: any) => p.id === openMenuId)!)"
        >
          <Ban class="h-4 w-4" />
          Bannir
        </button>
        <button
          v-if="
            patients.find((p: any) => p.id === openMenuId)?.status === 'banned'
          "
          class="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
          @click="liftSanction(patients.find((p: any) => p.id === openMenuId)!)"
        >
          <ShieldCheck class="h-4 w-4" />
          Lever sanction
        </button>
      </div>
    </Teleport>

    <div
      v-if="pagination.totalPages > 1"
      class="mt-4 flex items-center justify-between"
    >
      <p class="text-sm text-gray-600">
        Page {{ pagination.page }} sur {{ pagination.totalPages }} ({{
          pagination.total
        }}
        résultat{{ pagination.total > 1 ? "s" : "" }})
      </p>
      <div class="flex gap-2">
        <button
          :disabled="pagination.page <= 1"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToPage(pagination.page - 1)"
        >
          Précédent
        </button>
        <button
          v-for="p in visiblePages"
          :key="p"
          :class="[
            'rounded-lg border px-3 py-1.5 text-sm font-medium',
            p === pagination.page
              ? 'border-orange-600 bg-orange-500 text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          :disabled="pagination.page >= pagination.totalPages"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToPage(pagination.page + 1)"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- history modal -->
    <div
      v-if="showHistoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showHistoryModal = false"
    >
      <div
        class="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">
            Historique -
            {{ historyData?.patient.firstName }}
            {{ historyData?.patient.lastName }}
          </h2>
          <button
            class="text-gray-500 hover:text-gray-600"
            @click="showHistoryModal = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div v-if="historyLoading" class="py-8 text-center text-gray-500">
          Chargement...
        </div>

        <div v-else-if="historyData">
          <div class="mb-4 rounded-lg bg-gray-50 p-4">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p class="text-xs text-gray-500">Email</p>
                <p class="text-sm font-medium">
                  {{ historyData.patient.email }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">No-shows</p>
                <p class="text-sm font-semibold text-red-600">
                  {{ historyData.patient.noShowCount }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Avertissements</p>
                <p class="text-sm font-medium">
                  {{ historyData.patient.warningCount }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Statut</p>
                <UiBadge
                  :variant="getStatusVariant(historyData.patient.status)"
                >
                  {{ getStatusLabel(historyData.patient.status) }}
                </UiBadge>
              </div>
            </div>
            <div
              v-if="
                historyData.patient.status === 'banned' &&
                historyData.patient.penaltyUntil
              "
              class="mt-3 rounded bg-red-50 p-2 text-sm text-red-700"
            >
              <strong>Banni jusqu'au :</strong>
              {{ formatDate(historyData.patient.penaltyUntil) }}
              <span v-if="historyData.patient.penaltyReason">
                - {{ historyData.patient.penaltyReason }}
              </span>
            </div>
          </div>

          <!-- actions in modal -->
          <div class="mb-4 flex gap-2">
            <button
              v-if="historyData.patient.status !== 'banned'"
              class="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
              :disabled="actionLoading"
              @click="openWarnModalFromHistory"
            >
              <AlertTriangle class="h-4 w-4" />
              Envoyer avertissement
            </button>
            <button
              v-if="historyData.patient.status !== 'banned'"
              class="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
              :disabled="actionLoading"
              @click="openBanModalFromHistory"
            >
              <Ban class="h-4 w-4" />
              Bannir
            </button>
            <button
              v-if="historyData.patient.status === 'banned'"
              class="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
              :disabled="actionLoading"
              @click="liftSanctionFromHistory"
            >
              <ShieldCheck class="h-4 w-4" />
              Lever sanction
            </button>
          </div>

          <!-- appointments list -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b bg-gray-50">
                <tr>
                  <th class="px-3 py-2 font-medium text-gray-700">Date</th>
                  <th class="px-3 py-2 font-medium text-gray-700">Horaire</th>
                  <th class="px-3 py-2 font-medium text-gray-700">Praticien</th>
                  <th class="px-3 py-2 font-medium text-gray-700">Type</th>
                  <th class="px-3 py-2 font-medium text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="apt in historyData.appointments"
                  :key="apt.id"
                  :class="apt.status === 'NO_SHOW' ? 'bg-red-50/50' : ''"
                >
                  <td class="px-3 py-2 text-gray-700">
                    {{ formatDate(apt.appointmentDate) }}
                  </td>
                  <td class="px-3 py-2 text-gray-700">
                    {{ apt.startTime }} - {{ apt.endTime }}
                  </td>
                  <td class="px-3 py-2 text-gray-700">
                    {{ apt.practitioner.title }}
                    {{ apt.practitioner.firstName }}
                    {{ apt.practitioner.lastName }}
                  </td>
                  <td class="px-3 py-2">
                    <UiBadge
                      :variant="
                        apt.type === 'TELECONSULTATION' ? 'primary' : 'default'
                      "
                    >
                      {{
                        apt.type === "TELECONSULTATION"
                          ? "Téléconsultation"
                          : "Cabinet"
                      }}
                    </UiBadge>
                  </td>
                  <td class="px-3 py-2">
                    <UiBadge :variant="getAppointmentStatusVariant(apt.status)">
                      {{ getAppointmentStatusLabel(apt.status) }}
                    </UiBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="historyData.appointments.length === 0"
            class="py-6 text-center text-gray-500"
          >
            Aucun rendez-vous trouvé
          </div>
        </div>
      </div>
    </div>

    <!-- warning modal -->
    <div
      v-if="showWarnModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showWarnModal = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-lg font-bold text-gray-900">
          Envoyer un avertissement
        </h2>
        <p class="mb-4 text-sm text-gray-600">
          Un email d'avertissement sera envoyé à
          <strong>
            {{ warnTarget?.firstName }} {{ warnTarget?.lastName }}
          </strong>
          ({{ warnTarget?.email }}).
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="showWarnModal = false"
          >
            Annuler
          </button>
          <button
            :disabled="actionLoading"
            class="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            @click="confirmWarning"
          >
            {{ actionLoading ? "Envoi..." : "Envoyer l'avertissement" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ban modal -->
    <div
      v-if="showBanModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showBanModal = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-lg font-bold text-gray-900">Bannir le patient</h2>
        <p class="mb-4 text-sm text-gray-600">
          Le patient
          <strong>
            {{ banTarget?.firstName }} {{ banTarget?.lastName }}
          </strong>
          sera suspendu et notifié par email.
        </p>

        <div class="mb-4 space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Durée (en jours)
            </label>
            <input
              v-model.number="banDuration"
              type="number"
              min="1"
              placeholder="Ex: 30"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Raison (visible par le patient)
            </label>
            <textarea
              v-model="banReason"
              rows="3"
              placeholder="Ex: Absences répétées à 5 rendez-vous consécutifs..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <p v-if="banError" class="mb-3 text-sm text-red-600">
          {{ banError }}
        </p>

        <div class="flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="showBanModal = false"
          >
            Annuler
          </button>
          <button
            :disabled="actionLoading"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            @click="confirmBan"
          >
            {{ actionLoading ? "En cours..." : "Bannir" }}
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
import {
  Search,
  AlertTriangle,
  MoreVertical,
  History,
  Ban,
  ShieldCheck,
  X,
  ArrowDown,
  ArrowUp,
} from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

interface PatientNoShow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalAppointments: number;
  noShows: number;
  noShowsInPeriod: number;
  attendanceRate: number;
  status: "banned" | "warned" | "normal";
  penaltyUntil: string | null;
  penaltyReason: string | null;
  warningCount: number;
  lastWarningAt: string | null;
  bannedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HistoryAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string | null;
  markedAsNoShow: boolean;
  noShowMarkedAt: string | null;
  practitioner: {
    firstName: string;
    lastName: string;
    title: string;
  };
}

interface HistoryData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    noShowCount: number;
    warningCount: number;
    lastWarningAt: string | null;
    penaltyUntil: string | null;
    penaltyReason: string | null;
    bannedAt: string | null;
    status: "banned" | "warned" | "normal";
  };
  appointments: HistoryAppointment[];
}

const searchQuery = ref("");
const dateFrom = ref("");
const dateTo = ref("");
const minNoShows = ref<number | undefined>(undefined);
const statusFilter = ref("");
const sortOrder = ref<"asc" | "desc">("desc");

const patients = ref<PatientNoShow[]>([]);
const pagination = ref<Pagination>({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 0,
});
const loading = ref(true);
const fetchError = ref("");

const showHistoryModal = ref(false);
const historyData = ref<HistoryData | null>(null);
const historyLoading = ref(false);

const showWarnModal = ref(false);
const warnTarget = ref<PatientNoShow | null>(null);

const showBanModal = ref(false);
const banTarget = ref<PatientNoShow | null>(null);
const banDuration = ref<number>(30);
const banReason = ref("");
const banError = ref("");

const actionLoading = ref(false);
const openMenuId = ref<string | null>(null);
const menuPosition = ref({ top: 0, left: 0 });

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const debouncedFetch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchPatients();
  }, 300);
};

const visiblePages = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

function getStatusVariant(
  status: string,
): "danger" | "warning" | "success" | "default" {
  if (status === "banned") return "danger";
  if (status === "warned") return "warning";
  return "success";
}

function getStatusLabel(status: string): string {
  if (status === "banned") return "Banni";
  if (status === "warned") return "Averti";
  return "Normal";
}

function getAppointmentStatusVariant(
  status: string,
): "danger" | "warning" | "success" | "default" {
  if (status === "NO_SHOW") return "danger";
  if (status === "CANCELLED") return "warning";
  if (status === "COMPLETED") return "success";
  return "default";
}

function getAppointmentStatusLabel(status: string): string {
  if (status === "NO_SHOW") return "Absent";
  if (status === "CANCELLED") return "Annulé";
  if (status === "COMPLETED") return "Terminé";
  return status;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toggleMenu(patientId: string, event?: MouseEvent) {
  if (openMenuId.value === patientId) {
    openMenuId.value = null;
  } else {
    if (event) {
      const btn = event.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      menuPosition.value = {
        top: rect.bottom + 4,
        left: rect.right - 208,
      };
    }
    openMenuId.value = patientId;
  }
}

function toggleSort() {
  sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
  fetchPatients();
}

function goToPage(page: number) {
  pagination.value.page = page;
  fetchPatients();
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

// close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (openMenuId.value) {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-dropdown]")) {
      openMenuId.value = null;
    }
  }
}

async function fetchPatients() {
  loading.value = true;
  fetchError.value = "";

  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.set("search", searchQuery.value);
    if (dateFrom.value) params.set("dateFrom", dateFrom.value);
    if (dateTo.value) params.set("dateTo", dateTo.value);
    if (minNoShows.value && minNoShows.value > 0)
      params.set("minNoShows", String(minNoShows.value));
    if (statusFilter.value) params.set("status", statusFilter.value);
    params.set("sortOrder", sortOrder.value);
    params.set("page", String(pagination.value.page));
    params.set("limit", String(pagination.value.limit));

    const queryString = params.toString();
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        patients: PatientNoShow[];
        pagination: Pagination;
      };
    }>(`/admin/no-shows${queryString ? `?${queryString}` : ""}`);

    if (response.success) {
      patients.value = response.data.patients;
      pagination.value = response.data.pagination;
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des données";
  } finally {
    loading.value = false;
  }
}

async function viewHistory(patient: PatientNoShow) {
  openMenuId.value = null;
  showHistoryModal.value = true;
  historyLoading.value = true;

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: HistoryData;
    }>(`/admin/no-shows/${patient.id}/history`);

    if (response.success) {
      historyData.value = response.data;
    }
  } catch {
    showToast("Erreur lors du chargement de l'historique", "error");
    showHistoryModal.value = false;
  } finally {
    historyLoading.value = false;
  }
}

function openWarnModal(patient: PatientNoShow) {
  openMenuId.value = null;
  warnTarget.value = patient;
  showWarnModal.value = true;
}

function openWarnModalFromHistory() {
  if (!historyData.value) return;
  warnTarget.value = {
    id: historyData.value.patient.id,
    firstName: historyData.value.patient.firstName,
    lastName: historyData.value.patient.lastName,
    email: historyData.value.patient.email,
  } as PatientNoShow;
  showWarnModal.value = true;
}

function openBanModalFromHistory() {
  if (!historyData.value) return;
  banTarget.value = {
    id: historyData.value.patient.id,
    firstName: historyData.value.patient.firstName,
    lastName: historyData.value.patient.lastName,
    email: historyData.value.patient.email,
  } as PatientNoShow;
  banDuration.value = 30;
  banReason.value = "";
  banError.value = "";
  showBanModal.value = true;
}

async function liftSanctionFromHistory() {
  if (!historyData.value) return;
  await liftSanction({ id: historyData.value.patient.id } as PatientNoShow);
}

async function confirmWarning() {
  if (!warnTarget.value) return;
  actionLoading.value = true;

  try {
    await useAuthenticatedFetch(`/admin/no-shows/${warnTarget.value.id}/warn`, {
      method: "POST",
    });
    showWarnModal.value = false;
    showToast("Avertissement envoyé avec succès");
    await fetchPatients();
    if (showHistoryModal.value && historyData.value) {
      await refreshHistory();
    }
  } catch {
    showToast("Erreur lors de l'envoi de l'avertissement", "error");
  } finally {
    actionLoading.value = false;
  }
}

function openBanModal(patient: PatientNoShow) {
  openMenuId.value = null;
  banTarget.value = patient;
  banDuration.value = 30;
  banReason.value = "";
  banError.value = "";
  showBanModal.value = true;
}

async function confirmBan() {
  if (!banTarget.value) return;

  if (!banDuration.value || banDuration.value < 1) {
    banError.value = "La durée doit être supérieure à 0";
    return;
  }
  if (!banReason.value || banReason.value.trim().length < 10) {
    banError.value = "Le motif doit contenir au moins 10 caractères";
    return;
  }

  actionLoading.value = true;
  banError.value = "";

  try {
    await useAuthenticatedFetch(`/admin/no-shows/${banTarget.value.id}/ban`, {
      method: "POST",
      body: {
        durationDays: banDuration.value,
        reason: banReason.value.trim(),
      },
    });
    showBanModal.value = false;
    showToast("Patient banni avec succès");
    await fetchPatients();
    if (showHistoryModal.value && historyData.value) {
      await refreshHistory();
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    banError.value = err?.data?.message || "Erreur lors du bannissement";
  } finally {
    actionLoading.value = false;
  }
}

async function liftSanction(patient: PatientNoShow) {
  openMenuId.value = null;
  actionLoading.value = true;

  try {
    await useAuthenticatedFetch(`/admin/no-shows/${patient.id}/lift`, {
      method: "POST",
    });
    showToast("Sanction levée avec succès");
    await fetchPatients();
    if (showHistoryModal.value && historyData.value) {
      await refreshHistory();
    }
  } catch {
    showToast("Erreur lors de la levée de sanction", "error");
  } finally {
    actionLoading.value = false;
  }
}

async function refreshHistory() {
  if (!historyData.value) return;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: HistoryData;
    }>(`/admin/no-shows/${historyData.value.patient.id}/history`);
    if (response.success) {
      historyData.value = response.data;
    }
  } catch {
    // silent fail
  }
}

onMounted(() => {
  fetchPatients();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
