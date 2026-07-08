<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button
        @click="navigateTo('/staff/agenda')"
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ practitionerName }}
        </h1>
        <p class="text-gray-600">Gestion de l'agenda</p>
      </div>
      <div class="ml-auto">
        <UiButton size="sm" @click="openNewAppointmentModal">
          <Plus class="mr-1.5 h-4 w-4" />
          Ajouter un rdv
        </UiButton>
      </div>
    </div>

    <!-- view switch + navigation -->
    <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-1 rounded-lg border p-0.5">
          <button
            v-for="v in viewOptions"
            :key="v.value"
            @click="calendarView = v.value"
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              calendarView === v.value
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100',
            ]"
          >
            {{ v.label }}
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="navigateDate(-1)"
            class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <h3
            class="min-w-[200px] text-center text-lg font-semibold text-gray-900"
          >
            {{ periodLabel }}
          </h3>
          <button
            @click="navigateDate(1)"
            class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
          <button
            @click="goToToday"
            class="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Aujourd'hui
          </button>
        </div>

        <div class="flex items-center gap-4 text-sm">
          <div
            class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1"
          >
            <CalendarIcon class="h-3.5 w-3.5 text-green-600" />
            <span class="font-medium text-green-700">
              {{ daySummary.total }} rdv
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- loding -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 animate-pulse rounded-lg bg-gray-100"
      ></div>
    </div>

    <!-- day -->
    <template v-else-if="calendarView === 'day'">
      <div
        v-if="dayEvents.length === 0 && !currentDayAbsence"
        class="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm"
      >
        <CalendarX2 class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucun rendez-vous pour cette journée</p>
      </div>
      <div v-else class="space-y-3">
        <!-- absence banner -->
        <div v-if="currentDayAbsence" class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-red-800 shadow-sm">
          <Ban class="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p class="font-semibold text-red-900">Absent / Indisponible</p>
            <p class="text-sm text-red-700">
              {{ currentDayAbsence.reason || "Aucun motif spécifié" }} (Du {{ formatShortDate(currentDayAbsence.startDate) }} au {{ formatShortDate(currentDayAbsence.endDate) }})
            </p>
          </div>
        </div>

        <template v-for="event in dayEvents" :key="event.id">
          <!-- appointment card -->
          <div
            v-if="event.isAppointment"
            :class="[
              'flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 bg-white',
              event.status === 'COMPLETED'
                ? 'border-green-200 bg-green-50/50'
                : event.status === 'NO_SHOW'
                  ? 'border-red-200 bg-red-50/50'
                  : event.status === 'CANCELLED'
                    ? 'border-gray-200 bg-gray-50/50 opacity-60'
                    : 'border-gray-200',
            ]"
          >
            <div class="text-center">
              <p class="text-lg font-bold text-green-600">{{ event.startTime }}</p>
              <p class="text-xs text-gray-500">{{ event.endTime }}</p>
            </div>
            <div class="h-10 w-px bg-gray-200"></div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">
                {{ event.patient?.firstName }} {{ event.patient?.lastName }}
              </p>
              <p class="text-sm text-gray-500">
                {{ event.patient?.phone || "-" }}
              </p>
            </div>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                statusClass(event.status),
              ]"
            >
              {{ statusLabel(event.status) }}
            </span>
            <template
              v-if="
                event.status !== 'CANCELLED' &&
                event.status !== 'COMPLETED' &&
                event.status !== 'NO_SHOW'
              "
            >
              <button
                @click="openModifyModal(event)"
                class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500"
                title="Modifier"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                @click="openCancelModal(event)"
                class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Annuler"
              >
                <XCircle class="h-4 w-4" />
              </button>
            </template>
          </div>

          <!-- blocked slot card -->
          <div
            v-else-if="event.isBlockedSlot"
            class="flex items-center gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:bg-gray-100/70"
          >
            <div class="text-center">
              <p class="text-lg font-bold text-green-600">{{ event.startTime }}</p>
              <p class="text-xs text-gray-500">{{ event.endTime }}</p>
            </div>
            <div class="h-10 w-px bg-gray-200"></div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-700 flex items-center gap-1.5">
                <Ban class="h-4 w-4 text-gray-500" />
                Créneau bloqué
              </p>
              <p class="text-sm text-gray-500 italic">
                {{ event.reason || "Aucun motif spécifié" }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- week -->
    <template v-else-if="calendarView === 'week'">
      <div class="grid grid-cols-7 gap-2">
        <div v-for="day in weekDays" :key="day.dateStr" class="min-h-[200px] rounded-lg border border-gray-100 bg-white p-1.5 shadow-sm">
          <div
            :class="[
              'mb-2 rounded-lg px-2 py-1.5 text-center text-xs font-semibold',
              day.isToday
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700',
            ]"
          >
            <div>{{ day.dayName }}</div>
            <div class="text-lg">{{ day.dayNum }}</div>
          </div>
          <div class="space-y-1.5">
            <!-- Absence indicator -->
            <div
              v-if="getAbsenceForDate(day.dateStr)"
              class="rounded bg-red-50 border border-red-100 p-1.5 text-center text-[10px] font-semibold text-red-800 shadow-sm"
              :title="`Absent: ${getAbsenceForDate(day.dateStr).reason || 'Aucun motif'}`"
            >
              <span class="block truncate">Absent</span>
              <span class="block truncate text-[9px] font-normal text-red-600">
                {{ getAbsenceForDate(day.dateStr).reason || "Indisponible" }}
              </span>
            </div>

            <!-- Blocked slots -->
            <div
              v-for="slot in getBlockedSlotsForDate(day.dateStr)"
              :key="slot.id"
              class="rounded bg-gray-50 border border-dashed border-gray-200 px-2 py-1 text-[10px] text-gray-700"
              :title="`Créneau bloqué: ${slot.startTime} - ${slot.endTime} ${slot.reason ? '(' + slot.reason + ')' : ''}`"
            >
              <span class="font-medium text-gray-500">{{ slot.startTime }} - {{ slot.endTime }}</span>
              <span class="block truncate font-semibold text-gray-600">🚫 Bloqué</span>
            </div>

            <!-- Appointments -->
            <div
              v-for="apt in getAppointmentsForDate(day.dateStr)"
              :key="apt.id"
              :class="[
                'cursor-pointer rounded px-2 py-1 text-xs transition-opacity hover:opacity-80',
                apt.status === 'CANCELLED'
                  ? 'bg-gray-100 text-gray-500 line-through'
                  : 'bg-green-100 text-green-800',
              ]"
              :title="`${apt.patient?.firstName} ${apt.patient?.lastName}`"
              @click="openModifyModal(apt)"
            >
              <span class="font-medium">{{ apt.startTime }}</span>
              {{ apt.patient?.lastName }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- month view -->
    <template v-else-if="calendarView === 'month'">
      <div
        class="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-gray-200"
      >
        <div
          v-for="dayName in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']"
          :key="dayName"
          class="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-600"
        >
          {{ dayName }}
        </div>
        <div
          v-for="(day, i) in monthDays"
          :key="i"
          :class="[
            'min-h-[90px] bg-white p-1.5',
            !day.inMonth && 'bg-gray-50/70',
          ]"
        >
          <p
            :class="[
              'mb-1 text-xs font-medium',
              day.isToday
                ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white'
                : day.inMonth
                  ? 'text-gray-900'
                  : 'text-gray-300',
            ]"
          >
            {{ day.num }}
          </p>
          <div class="space-y-0.5">
            <div
              v-for="event in getMonthDayEvents(day.dateStr).slice(0, 3)"
              :key="event.id"
              :class="[
                'cursor-pointer truncate rounded px-1 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80',
                event.class
              ]"
              @click="event.type === 'appointment' ? openModifyModal(event.appointment) : null"
            >
              {{ event.label }}
            </div>
            <p
              v-if="getMonthDayEvents(day.dateStr).length > 3"
              class="text-[10px] text-gray-500 font-semibold pl-1"
            >
              +{{ getMonthDayEvents(day.dateStr).length - 3 }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- new apointment modal -->
    <Teleport to="body">
      <div
        v-if="showNewAppointmentModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showNewAppointmentModal = false"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Ajouter un rendez-vous
            </h3>
            <button
              @click="showNewAppointmentModal = false"
              class="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="createAppointment" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Patient</label
              >
              <div class="relative">
                <input
                  v-model="patientSearch"
                  @input="searchPatients"
                  type="text"
                  placeholder="Rechercher un patient..."
                  class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <div
                  v-if="patientResults.length > 0 && patientSearch.length >= 2"
                  class="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-white shadow-lg"
                >
                  <button
                    v-for="p in patientResults"
                    :key="p.id"
                    type="button"
                    @click="selectPatient(p)"
                    class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <User class="h-4 w-4 text-gray-500" />
                    {{ p.firstName }} {{ p.lastName }}
                    <span class="text-xs text-gray-500">{{ p.phone }}</span>
                  </button>
                </div>
              </div>
              <p v-if="selectedPatient" class="mt-1 text-sm text-green-600">
                Sélectionné : {{ selectedPatient.firstName }}
                {{ selectedPatient.lastName }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Date</label
                >
                <input
                  v-model="newAppointment.appointmentDate"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Heure début</label
                >
                <input
                  v-model="newAppointment.startTime"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Heure fin</label
                >
                <input
                  v-model="newAppointment.endTime"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Type</label
                >
                <select
                  v-model="newAppointment.type"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="IN_PERSON">Cabinet</option>
                  <option value="TELECONSULTATION">Téléconsultation</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Motif (optionnel)</label
              >
              <input
                v-model="newAppointment.reason"
                type="text"
                placeholder="Motif de la consultation..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <p v-if="appointmentError" class="text-sm text-red-600">
              {{ appointmentError }}
            </p>

            <div class="flex justify-end gap-2">
              <UiButton
                variant="secondary"
                @click="showNewAppointmentModal = false"
              >
                Annuler
              </UiButton>
              <UiButton
                type="submit"
                :disabled="creatingAppointment || !selectedPatient"
              >
                {{
                  creatingAppointment ? "Création..." : "Créer le rendez-vous"
                }}
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCancelModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <XCircle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler le rendez-vous
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler le rendez-vous de
            <strong
              >{{ selectedAppointment?.patient?.firstName }}
              {{ selectedAppointment?.patient?.lastName }}</strong
            >
            à <strong>{{ selectedAppointment?.startTime }}</strong> ?
          </p>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showCancelModal = false">
              Retour
            </UiButton>
            <UiButton
              variant="danger"
              :disabled="cancelLoading"
              @click="confirmCancel"
            >
              {{ cancelLoading ? "Annulation..." : "Confirmer l'annulation" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- modify mdal -->
    <Teleport to="body">
      <div
        v-if="showModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showModifyModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <Pencil class="h-5 w-5 text-orange-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Modifier le rendez-vous
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Modifier le rendez-vous de
            <strong
              >{{ selectedAppointment?.patient?.firstName }}
              {{ selectedAppointment?.patient?.lastName }}</strong
            >
          </p>
          <div class="mb-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nouvelle date</label
              >
              <input
                v-model="modifyDate"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Nouvelle heure début</label
                >
                <input
                  v-model="modifyStartTime"
                  type="time"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Nouvelle heure fin</label
                >
                <input
                  v-model="modifyEndTime"
                  type="time"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="showModifyModal = false">
              Retour
            </UiButton>
            <UiButton
              :disabled="
                modifyLoading ||
                !modifyDate ||
                !modifyStartTime ||
                !modifyEndTime
              "
              @click="confirmModify"
            >
              {{
                modifyLoading ? "Modification..." : "Confirmer la modification"
              }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- taost -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'rounded-lg px-4 py-3 shadow-lg transition-all duration-300',
          toast.type === 'success' ? 'bg-green-600 text-white' : '',
          toast.type === 'error' ? 'bg-red-600 text-white' : '',
          toast.type === 'info' ? 'bg-orange-600 text-white' : '',
        ]"
      >
        <div class="flex items-start gap-2">
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button
            @click="removeToast(toast.id)"
            class="text-white/80 hover:text-white"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar as CalendarIcon,
  CalendarX2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Pencil,
  Plus,
  X,
  User,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "staff",
  middleware: "staff-only",
});

const route = useRoute();
const authStore = useAuthStore();

const practitionerId = route.params.id as string;
const practitionerName = ref("Agenda du praticien");
const appointments = ref<any[]>([]);
const absences = ref<any[]>([]);
const blockedSlots = ref<any[]>([]);
const loading = ref(true);

type CalendarViewType = "day" | "week" | "month";
const viewOptions = [
  { value: "day" as const, label: "Jour" },
  { value: "week" as const, label: "Semaine" },
  { value: "month" as const, label: "Mois" },
];
const calendarView = ref<CalendarViewType>("day");
const currentDate = ref(new Date());

// toast
interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}
const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
) {
  const id = ++toastIdCounter;
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

const periodLabel = computed(() => {
  const d = currentDate.value;
  if (calendarView.value === "day") {
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (calendarView.value === "week") {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
});

const dateRange = computed(() => {
  const d = currentDate.value;
  if (calendarView.value === "day") {
    const s = toDateStr(d);
    return { startDate: s, endDate: s };
  }
  if (calendarView.value === "week") {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startDate: toDateStr(start), endDate: toDateStr(end) };
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { startDate: toDateStr(start), endDate: toDateStr(end) };
});

const daySummary = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  const dayApts =
    calendarView.value === "day"
      ? filteredAppointments.value
      : appointments.value;
  return {
    total: dayApts.filter((a: any) => a.status !== "CANCELLED").length,
  };
});

const filteredAppointments = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  return appointments.value.filter(
    (a: any) => toDateStr(new Date(a.appointmentDate)) === dateStr,
  );
});

const weekDays = computed(() => {
  const start = getWeekStart(currentDate.value);
  const today = toDateStr(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: toDateStr(d),
      dayName: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: toDateStr(d) === today,
    });
  }
  return days;
});

const monthDays = computed(() => {
  const d = currentDate.value;
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const today = toDateStr(new Date());

  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: {
    num: number;
    dateStr: string;
    inMonth: boolean;
    isToday: boolean;
  }[] = [];

  const prevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
  for (let i = startDow - 1; i >= 0; i--) {
    const dd = new Date(prevMonth);
    dd.setDate(prevMonth.getDate() - i);
    days.push({
      num: dd.getDate(),
      dateStr: toDateStr(dd),
      inMonth: false,
      isToday: false,
    });
  }

  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    const dd = new Date(d.getFullYear(), d.getMonth(), i);
    const ds = toDateStr(dd);
    days.push({ num: i, dateStr: ds, inMonth: true, isToday: ds === today });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const dd = new Date(d.getFullYear(), d.getMonth() + 1, i);
    days.push({
      num: i,
      dateStr: toDateStr(dd),
      inMonth: false,
      isToday: false,
    });
  }

  return days;
});

function getAppointmentsForDate(dateStr: string) {
  return appointments.value.filter(
    (a: any) => toDateStr(new Date(a.appointmentDate)) === dateStr,
  );
}

function navigateDate(direction: number) {
  const d = new Date(currentDate.value);
  if (calendarView.value === "day") {
    d.setDate(d.getDate() + direction);
  } else if (calendarView.value === "week") {
    d.setDate(d.getDate() + direction * 7);
  } else {
    d.setMonth(d.getMonth() + direction);
  }
  currentDate.value = d;
}

function goToToday() {
  currentDate.value = new Date();
}

const statusClass = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "RESCHEDULED":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-orange-100 text-orange-700";
    case "NO_SHOW":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "Confirmé";
    case "CANCELLED":
      return "Annulé";
    case "RESCHEDULED":
      return "Déplacé";
    case "COMPLETED":
      return "Terminé";
    case "PENDING":
      return "En attente";
    case "NO_SHOW":
      return "Absent";
    default:
      return status;
  }
};

async function fetchAppointments() {
  loading.value = true;
  try {
    const { startDate, endDate } = dateRange.value;
    const [aptsRes, absencesRes, blockedRes] = await Promise.all([
      useAuthenticatedFetch<{ success: boolean; data: any[] }>(
        `/staff/practitioners/${practitionerId}/appointments?startDate=${startDate}&endDate=${endDate}`,
      ),
      useAuthenticatedFetch<{ success: boolean; data: any[] }>(
        `/staff/practitioners/${practitionerId}/absences?startDate=${startDate}&endDate=${endDate}`,
      ),
      useAuthenticatedFetch<{ success: boolean; data: any[] }>(
        `/staff/practitioners/${practitionerId}/blocked-slots?startDate=${startDate}&endDate=${endDate}`,
      ),
    ]);
    if (aptsRes.success) {
      appointments.value = aptsRes.data;
    }
    if (absencesRes.success) {
      absences.value = absencesRes.data;
    }
    if (blockedRes.success) {
      blockedSlots.value = blockedRes.data;
    }
  } catch (error) {
    console.error("Error fetching agenda data:", error);
  } finally {
    loading.value = false;
  }
}

// Helpers for unavailable periods rendering on calendar views
const currentDayAbsence = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  return getAbsenceForDate(dateStr);
});

function getAbsenceForDate(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return absences.value.find((abs) => {
    const start = new Date(abs.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(abs.endDate);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });
}

function getBlockedSlotsForDate(dateStr: string): any[] {
  return blockedSlots.value.filter(
    (s) => toDateStr(new Date(s.date)) === dateStr,
  );
}

const dayEvents = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  const list: any[] = [];

  appointments.value.forEach((apt) => {
    if (toDateStr(new Date(apt.appointmentDate)) === dateStr) {
      list.push({ ...apt, isAppointment: true });
    }
  });

  blockedSlots.value.forEach((slot) => {
    if (toDateStr(new Date(slot.date)) === dateStr) {
      list.push({ ...slot, isBlockedSlot: true });
    }
  });

  return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
});

function getMonthDayEvents(dateStr: string): any[] {
  const list: any[] = [];
  
  const absence = getAbsenceForDate(dateStr);
  if (absence) {
    list.push({
      id: absence.id,
      type: "absence",
      label: `Absent: ${absence.reason || "Indisponible"}`,
      class: "bg-red-50 text-red-700 border border-red-100",
    });
  }
  
  const slots = getBlockedSlotsForDate(dateStr);
  slots.forEach(slot => {
    list.push({
      id: slot.id,
      type: "blocked",
      label: `🚫 ${slot.startTime} Bloqué`,
      class: "bg-gray-50 text-gray-600 border border-dashed border-gray-200",
    });
  });
  
  const apts = getAppointmentsForDate(dateStr);
  apts.forEach(apt => {
    list.push({
      id: apt.id,
      type: "appointment",
      startTime: apt.startTime,
      label: `${apt.startTime} ${apt.patient?.lastName || ""}`,
      class: apt.status === "CANCELLED" ? "bg-gray-100 text-gray-500 line-through" : "bg-green-100 text-green-700",
      appointment: apt,
    });
  });
  
  list.sort((a, b) => {
    if (a.type === "absence" && b.type !== "absence") return -1;
    if (b.type === "absence" && a.type !== "absence") return 1;
    if (a.type === "absence" && b.type === "absence") return 0;
    
    const timeA = a.startTime || a.appointment?.startTime || "00:00";
    const timeB = b.startTime || b.appointment?.startTime || "00:00";
    return timeA.localeCompare(timeB);
  });
  
  return list;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchPractitionerInfo() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any[];
    }>("/staff/practitioners");
    if (response.success) {
      const prac = response.data.find((p: any) => p.id === practitionerId);
      if (prac) {
        practitionerName.value = `${prac.title} ${prac.firstName} ${prac.lastName}`;
      }
    }
  } catch (error) {
    console.error("Error fetching practitioners:", error);
  }
}

const showCancelModal = ref(false);
const selectedAppointment = ref<any>(null);
const cancelLoading = ref(false);

function openCancelModal(apt: any) {
  selectedAppointment.value = apt;
  showCancelModal.value = true;
}

async function confirmCancel() {
  if (!selectedAppointment.value) return;
  cancelLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/staff/appointments/${selectedAppointment.value.id}/cancel`,
      { method: "PATCH" },
    );
    showCancelModal.value = false;
    showToast("Rendez-vous annulé", "success");
    await fetchAppointments();
  } catch (error: any) {
    showToast(error?.data?.message || "Erreur lors de l'annulation", "error");
  } finally {
    cancelLoading.value = false;
  }
}

const showModifyModal = ref(false);
const modifyDate = ref("");
const modifyStartTime = ref("");
const modifyEndTime = ref("");
const modifyLoading = ref(false);

function openModifyModal(apt: any) {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return;
  selectedAppointment.value = apt;
  const d = new Date(apt.appointmentDate);
  modifyDate.value = toDateStr(d);
  modifyStartTime.value = apt.startTime;
  modifyEndTime.value = apt.endTime;
  showModifyModal.value = true;
}

async function confirmModify() {
  if (
    !selectedAppointment.value ||
    !modifyDate.value ||
    !modifyStartTime.value ||
    !modifyEndTime.value
  )
    return;
  modifyLoading.value = true;
  try {
    await useAuthenticatedFetch(
      `/staff/appointments/${selectedAppointment.value.id}/move`,
      {
        method: "PATCH",
        body: {
          newDate: modifyDate.value,
          newStartTime: modifyStartTime.value,
          newEndTime: modifyEndTime.value,
        },
      },
    );
    showModifyModal.value = false;
    showToast("Rendez-vous modifié", "success");
    await fetchAppointments();
  } catch (error: any) {
    showToast(
      error?.data?.message || "Erreur lors de la modification",
      "error",
    );
  } finally {
    modifyLoading.value = false;
  }
}

const showNewAppointmentModal = ref(false);
const patientSearch = ref("");
const patientResults = ref<any[]>([]);
const selectedPatient = ref<any>(null);
const creatingAppointment = ref(false);
const appointmentError = ref("");
const newAppointment = ref({
  appointmentDate: "",
  startTime: "09:00",
  endTime: "09:30",
  type: "IN_PERSON" as "IN_PERSON" | "TELECONSULTATION",
  reason: "",
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function openNewAppointmentModal() {
  selectedPatient.value = null;
  patientSearch.value = "";
  patientResults.value = [];
  appointmentError.value = "";
  newAppointment.value = {
    appointmentDate: toDateStr(currentDate.value),
    startTime: "09:00",
    endTime: "09:30",
    type: "IN_PERSON",
    reason: "",
  };
  showNewAppointmentModal.value = true;
}

function searchPatients() {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (patientSearch.value.length < 2) {
    patientResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const response = await useAuthenticatedFetch<{
        success: boolean;
        data: any[];
      }>(
        `/staff/practitioners/${practitionerId}/patients/search?q=${encodeURIComponent(patientSearch.value)}`,
      );
      if (response.success) {
        patientResults.value = response.data;
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  }, 300);
}

function selectPatient(p: any) {
  selectedPatient.value = p;
  patientSearch.value = `${p.firstName} ${p.lastName}`;
  patientResults.value = [];
}

async function createAppointment() {
  if (!selectedPatient.value) return;
  creatingAppointment.value = true;
  appointmentError.value = "";
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>(`/staff/practitioners/${practitionerId}/appointments`, {
      method: "POST",
      body: {
        patientId: selectedPatient.value.id,
        ...newAppointment.value,
      },
    });
    if (response.success) {
      showNewAppointmentModal.value = false;
      showToast("Rendez-vous créé avec succès", "success");
      await fetchAppointments();
    }
  } catch (error: any) {
    appointmentError.value =
      error?.data?.message || "Erreur lors de la création du rendez-vous";
  } finally {
    creatingAppointment.value = false;
  }
}

watch([currentDate, calendarView], () => {
  fetchAppointments();
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchPractitionerInfo();
    fetchAppointments();
  } else {
    loading.value = false;
  }
});
</script>
