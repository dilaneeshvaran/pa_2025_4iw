<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p class="text-gray-600">Bienvenue sur votre espace praticien</p>
    </div>

    <!-- kpi  -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard v-for="(kpi, i) in kpiCards" :key="i">
        <div class="flex items-center gap-4">
          <div
            :class="[
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
              kpi.bgColor,
            ]"
          >
            <component :is="kpi.icon" :class="['h-6 w-6', kpi.iconColor]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500">{{ kpi.label }}</p>
            <p
              v-if="loading"
              class="h-7 w-16 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="text-2xl font-bold text-gray-900">
              {{ kpi.value }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <!--  row: next rdv + today appointments  -->
    <div class="grid gap-6 lg:grid-cols-2">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Prochain rendez-vous
        </h3>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div class="h-4 w-3/4 rounded bg-gray-200"></div>
          <div class="h-3 w-1/2 rounded bg-gray-200"></div>
          <div class="h-3 w-1/3 rounded bg-gray-200"></div>
        </div>

        <div
          v-else-if="!dashboard?.nextAppointment"
          class="flex flex-col items-center justify-center py-8"
        >
          <Calendar class="mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun rendez-vous à venir</p>
        </div>

        <div v-else class="flex flex-col">
          <div class="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
            <div
              class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
            >
              <User class="h-7 w-7 text-blue-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-lg font-semibold text-gray-900">
                {{ dashboard.nextAppointment.patient.firstName }}
                {{ dashboard.nextAppointment.patient.lastName }}
              </p>
              <div class="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Clock class="h-4 w-4" />
                {{ formatDate(dashboard.nextAppointment.appointmentDate) }} à
                {{ dashboard.nextAppointment.startTime }}
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <UiBadge
              :variant="
                dashboard.nextAppointment.type === 'TELECONSULTATION'
                  ? 'success'
                  : 'primary'
              "
            >
              {{
                dashboard.nextAppointment.type === "TELECONSULTATION"
                  ? "Téléconsultation"
                  : "Cabinet"
              }}
            </UiBadge>
            <UiBadge variant="default">
              {{ getStatusLabel(dashboard.nextAppointment.status) }}
            </UiBadge>
          </div>

          <p
            v-if="dashboard.nextAppointment.reason"
            class="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600"
          >
            <span class="font-medium text-gray-700">Motif :</span>
            {{ dashboard.nextAppointment.reason }}
          </p>

          <div class="mt-4 flex gap-2">
            <UiButton
              variant="secondary"
              size="sm"
              class="flex-1"
              @click="
                navigateTo(
                  `/practitioner/patients/${dashboard.nextAppointment.patient.id}/medical-record`,
                )
              "
            >
              Voir le dossier
            </UiButton>
            <UiButton
              v-if="canJoinNextTeleconsultation"
              size="sm"
              class="flex-1"
              @click="navigateTo('/practitioner/teleconsultations')"
            >
              <Video class="mr-1.5 h-4 w-4" />
              Rejoindre
            </UiButton>
          </div>
        </div>
      </UiCard>

      <!-- today appointments -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Rendez-vous aujourd'hui
          </h3>
          <div class="flex items-center gap-2">
            <UiBadge variant="primary">
              {{ loading ? "..." : dashboard?.todayAppointments?.length || 0 }}
            </UiBadge>
            <UiButton
              variant="secondary"
              size="sm"
              @click="navigateTo('/practitioner/agenda')"
            >
              Voir agenda complet
            </UiButton>
          </div>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
          >
            <div class="h-4 w-12 rounded bg-gray-200"></div>
            <div class="flex-1">
              <div class="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!dashboard?.todayAppointments?.length"
          class="py-6 text-center"
        >
          <CalendarCheck class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun rendez-vous aujourd'hui</p>
        </div>

        <div v-else class="max-h-64 space-y-2 overflow-y-auto">
          <div
            v-for="apt in dashboard.todayAppointments"
            :key="apt.id"
            class="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
          >
            <span class="font-mono text-sm font-medium text-blue-600">
              {{ apt.startTime }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ apt.patient.firstName }} {{ apt.patient.lastName }}
              </p>
            </div>
            <UiBadge
              :variant="apt.type === 'TELECONSULTATION' ? 'success' : 'default'"
              class-name="text-xs"
            >
              {{ apt.type === "TELECONSULTATION" ? "Télé" : "Cabinet" }}
            </UiBadge>
            <UiBadge
              :variant="getStatusVariant(apt.status)"
              class-name="text-xs"
            >
              {{ getStatusLabel(apt.status) }}
            </UiBadge>
            <UiButton
              v-if="apt.status === 'COMPLETED' && apt.type === 'CABINET'"
              size="sm"
              variant="outline"
              class="ml-2 h-6 px-2 py-0 text-xs"
              @click.stop="openInvoiceModal(apt)"
            >
              Facturer
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <!--  row: waiting teleconsultations + recent messages  -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- waiting teleconsultations -->
      <UiCard>
        <div class="mb-4 flex items-center gap-3">
          <Video class="h-5 w-5 text-green-600" />
          <h3 class="text-lg font-semibold text-gray-900">
            Patients en attente – Téléconsultations
          </h3>
        </div>

        <div v-if="loading" class="animate-pulse">
          <div class="h-16 rounded bg-gray-200"></div>
        </div>

        <div v-else class="flex items-center gap-4 rounded-lg bg-green-50 p-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
          >
            <span class="text-2xl font-bold text-green-700">
              {{ dashboard?.waitingTeleconsultations || 0 }}
            </span>
          </div>
          <div>
            <p class="font-medium text-green-800">
              {{
                (dashboard?.waitingTeleconsultations || 0) === 0
                  ? "Aucun patient en attente"
                  : (dashboard?.waitingTeleconsultations || 0) === 1
                    ? "1 patient en attente"
                    : `${dashboard?.waitingTeleconsultations} patients en attente`
              }}
            </p>
            <p class="text-sm text-green-600">Salle d'attente virtuelle</p>
          </div>
        </div>
      </UiCard>

      <!-- recent messages -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <MessageSquare class="h-5 w-5 text-purple-600" />
            <h3 class="text-lg font-semibold text-gray-900">
              Messages récents
            </h3>
          </div>
          <UiButton
            variant="secondary"
            size="sm"
            @click="navigateTo('/practitioner/messages')"
          >
            Voir tout
          </UiButton>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="flex gap-3 rounded-lg bg-gray-50 p-3"
          >
            <div class="h-10 w-10 rounded-full bg-gray-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/2 rounded bg-gray-200"></div>
              <div class="h-3 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!dashboard?.recentMessages?.length"
          class="py-6 text-center"
        >
          <MessageSquare class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun message récent</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="msg in dashboard.recentMessages"
            :key="msg.conversationId"
            class="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
            @click="navigateTo('/practitioner/messages')"
          >
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100"
            >
              <User class="h-5 w-5 text-purple-600" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900">
                  {{ msg.patientName }}
                </p>
                <span class="text-xs text-gray-400">
                  {{ formatRelativeTime(msg.createdAt) }}
                </span>
              </div>
              <p class="truncate text-sm text-gray-500">
                {{ msg.lastMessage }}
              </p>
            </div>
            <span
              v-if="msg.unread"
              class="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500"
            ></span>
          </div>
        </div>
      </UiCard>
    </div>

    <!--  row: todo list  -->
    <UiCard>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <ListTodo class="h-5 w-5 text-orange-600" />
          <h3 class="text-lg font-semibold text-gray-900">À faire</h3>
        </div>
      </div>

      <!-- add new todo -->
      <form @submit.prevent="addTodo" class="mb-4 flex gap-2">
        <input
          v-model="newTodoTitle"
          type="text"
          placeholder="Ajouter une tâche..."
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="addingTodo"
        />
        <UiButton
          type="submit"
          size="sm"
          :disabled="!newTodoTitle.trim() || addingTodo"
        >
          <Plus class="h-4 w-4" />
          Ajouter
        </UiButton>
      </form>

      <div v-if="loading" class="animate-pulse space-y-2">
        <div v-for="i in 3" :key="i" class="h-10 rounded bg-gray-200"></div>
      </div>

      <div v-else-if="!dashboard?.todos?.length" class="py-6 text-center">
        <ListTodo class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucune tâche en cours</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="todo in dashboard.todos"
          :key="todo.id"
          class="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          <button
            @click="toggleTodo(todo.id)"
            :disabled="togglingId === todo.id"
            :class="[
              'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
              todo.completed
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 hover:border-blue-400',
            ]"
          >
            <Check v-if="todo.completed" class="h-2.5 w-2.5" />
          </button>
          <span
            :class="[
              'flex-1 text-sm',
              todo.completed ? 'text-gray-400 line-through' : 'text-gray-900',
            ]"
          >
            {{ todo.title }}
          </span>
          <button
            @click="deleteTodo(todo.id)"
            :disabled="deletingId === todo.id"
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </UiCard>

    <!-- invoice modal -->
    <CreateInvoiceModal
      :is-open="isInvoiceModalOpen"
      :appointment="selectedAppointmentForInvoice"
      @close="isInvoiceModalOpen = false"
      @success="handleInvoiceSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  CalendarCheck,
  Clock,
  User,
  Video,
  MessageSquare,
  CreditCard,
  TrendingUp,
  UserPlus,
  ListTodo,
  Plus,
  Check,
  X,
  Activity,
} from "lucide-vue-next";
import CreateInvoiceModal from "~/components/practitioner/CreateInvoiceModal.vue";
import { useAuthStore } from "~/stores/auth";
import { formatDateLong as formatDate, formatRelativeTime } from "~/utils/date";
import { getStatusVariant, getStatusLabel } from "~/utils/status";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});

const authStore = useAuthStore();

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AppointmentInfo {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason: string | null;
  patient: PatientInfo;
}

interface MessageInfo {
  conversationId: string;
  patientName: string;
  lastMessage: string;
  isFromPatient: boolean;
  unread: boolean;
  createdAt: string;
}

interface TodoInfo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface DashboardData {
  consultationsThisMonth: number;
  revenue: number;
  attendanceRate: number;
  newPatients: number;
  nextAppointment: AppointmentInfo | null;
  todayAppointments: AppointmentInfo[];
  waitingTeleconsultations: number;
  recentMessages: MessageInfo[];
  todos: TodoInfo[];
}

const dashboard = ref<DashboardData | null>(null);
const loading = ref(true);
const newTodoTitle = ref("");
const addingTodo = ref(false);
const togglingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

const canJoinNextTeleconsultation = computed(() => {
  if (!dashboard.value?.nextAppointment) return false;
  const apt = dashboard.value.nextAppointment;
  if (apt.type !== "TELECONSULTATION") return false;
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  const now = new Date();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  aptDate.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  const diffMinutes = (aptDate.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60;
});

const kpiCards = computed(() => [
  {
    label: "Consultations ce mois",
    value: dashboard.value?.consultationsThisMonth ?? "-",
    icon: Calendar,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Revenus ce mois",
    value: dashboard.value
      ? `${dashboard.value.revenue.toLocaleString("fr-FR")} XOF`
      : "-",
    icon: CreditCard,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "Taux de présence ce mois",
    value: dashboard.value ? `${dashboard.value.attendanceRate}%` : "-",
    icon: TrendingUp,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    label: "Nouveaux patients ce mois",
    value: dashboard.value?.newPatients ?? "-",
    icon: UserPlus,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
]);

const fetchDashboard = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DashboardData;
    }>("/practitioner/dashboard");
    if (response.success) {
      dashboard.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching dashboard:", error);
  } finally {
    loading.value = false;
  }
};

const addTodo = async () => {
  if (!newTodoTitle.value.trim()) return;
  addingTodo.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: TodoInfo;
    }>("/practitioner/dashboard/todos", {
      method: "POST",
      body: { title: newTodoTitle.value.trim() },
    });
    if (response.success && dashboard.value) {
      dashboard.value.todos.unshift(response.data);
      newTodoTitle.value = "";
    }
  } catch (error) {
    console.error("Error adding todo:", error);
  } finally {
    addingTodo.value = false;
  }
};

const toggleTodo = async (todoId: string) => {
  togglingId.value = todoId;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: TodoInfo;
    }>(`/practitioner/dashboard/todos/${todoId}/toggle`, {
      method: "PATCH",
    });
    if (response.success && dashboard.value) {
      const idx = dashboard.value.todos.findIndex((t) => t.id === todoId);
      if (idx !== -1) {
        dashboard.value.todos[idx] = response.data;
      }
    }
  } catch (error) {
    console.error("Error toggling todo:", error);
  } finally {
    togglingId.value = null;
  }
};

const deleteTodo = async (todoId: string) => {
  deletingId.value = todoId;
  try {
    await useAuthenticatedFetch(`/practitioner/dashboard/todos/${todoId}`, {
      method: "DELETE",
    });
    if (dashboard.value) {
      dashboard.value.todos = dashboard.value.todos.filter(
        (t) => t.id !== todoId,
      );
    }
  } catch (error) {
    console.error("Error deleting todo:", error);
  } finally {
    deletingId.value = null;
  }
};

const isInvoiceModalOpen = ref(false);
const selectedAppointmentForInvoice = ref(null);

const openInvoiceModal = (apt: any) => {
  selectedAppointmentForInvoice.value = apt;
  isInvoiceModalOpen.value = true;
};

const handleInvoiceSuccess = (invoice: any) => {
  isInvoiceModalOpen.value = false;
  navigateTo("/practitioner/billing");
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (authStore.accessToken) {
    fetchDashboard();
  } else {
    loading.value = false;
  }
});
</script>
