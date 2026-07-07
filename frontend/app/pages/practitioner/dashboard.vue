<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
      <p class="mt-1 text-sm text-gray-500">Bienvenue sur votre espace praticien</p>
    </div>

    <!-- subscription billing warning notice -->
    <div
      v-if="showBillingNotice"
      class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
    >
      <div class="flex items-start gap-3">
        <CreditCard class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" :stroke-width="1.75" />
        <div class="flex-1">
          <h3 class="font-display text-sm font-semibold text-gray-900">
            Moyen de paiement requis pour votre abonnement
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            Vous n'avez pas encore configuré de moyen de paiement actif pour le règlement de votre abonnement. 
            Celui-ci sera facturé automatiquement 1 mois après la date de validation de votre inscription par l'administration 
            (vous bénéficiez d'une période d'essai gratuite d'un mois à compter du {{ formattedTrialStartDate }}). 
            Veuillez enregistrer une carte bancaire ou un compte Mobile Money pour éviter toute suspension de votre compte le {{ formattedBillingDate }}.
          </p>
          <NuxtLink
            to="/practitioner/pay"
            class="mt-2 inline-flex items-center text-sm font-semibold text-[#D96F00] hover:text-[#B85E00]"
          >
            Gérer mes moyens de paiement
            <ArrowRight class="ml-1 h-4 w-4" :stroke-width="1.75" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- profile visibility alert -->
    <div
      v-if="showProfileAlert"
      class="mb-6 rounded-2xl border border-[#D96F00]/20 bg-[#D96F00]/5 p-5 shadow-sm"
    >
      <div class="flex items-start gap-3">
        <Info class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D96F00]" :stroke-width="1.75" />
        <div class="flex-1">
          <h3 class="font-display text-sm font-semibold text-gray-900">
            {{ profileAlertTitle }}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {{ profileAlertMessage }}
          </p>
          <NuxtLink
            :to="profileAlertLink"
            class="mt-2 inline-flex items-center text-sm font-semibold text-[#D96F00] hover:text-[#B85E00]"
          >
            {{ profileAlertAction }}
            <ArrowRight class="ml-1 h-4 w-4" :stroke-width="1.75" />
          </NuxtLink>
        </div>
        <button
          @click="dismissProfileAlert"
          class="text-gray-400 transition-colors hover:text-gray-600"
        >
          <X class="h-4 w-4" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <!-- kpi  -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(kpi, i) in kpiCards"
        :key="i"
        :class="[
          'rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300',
          kpi.borderColor,
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-400">
              {{ kpi.label }}
            </p>
            <p
              v-if="loading"
              class="mt-1 h-8 w-16 animate-pulse rounded bg-gray-200"
            ></p>
            <p v-else class="mt-1 font-display text-2xl font-bold tabular-nums text-gray-900">
              {{ kpi.value }}
            </p>
          </div>
          <component :is="kpi.icon" class="h-5 w-5 text-gray-300" :stroke-width="1.5" />
        </div>
      </div>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100"></div>

    <!--  row: next rdv + today appointments  -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- next appointment - elevated -->
      <div class="rounded-2xl border border-[#00804A]/15 bg-[#00804A]/5 p-6">
        <h3 class="font-display text-base font-semibold text-gray-900">
          Prochain rendez-vous
        </h3>

        <div v-if="loading" class="mt-4 animate-pulse space-y-3">
          <div class="h-4 w-3/4 rounded bg-[#00804A]/10"></div>
          <div class="h-3 w-1/2 rounded bg-[#00804A]/10"></div>
          <div class="h-3 w-1/3 rounded bg-[#00804A]/10"></div>
        </div>

        <div
          v-else-if="!dashboard?.nextAppointment"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <Calendar class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Aucun rendez-vous</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">Aucun rendez-vous à venir pour le moment.</p>
        </div>

        <div v-else class="mt-4 flex flex-col">
          <div class="flex items-center gap-4 rounded-lg border border-[#00804A]/10 bg-white/60 p-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#00804A]"
            >
              {{ dashboard.nextAppointment.patient.firstName[0] }}{{ dashboard.nextAppointment.patient.lastName[0] }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-display text-base font-semibold text-gray-900">
                {{ dashboard.nextAppointment.patient.firstName }}
                {{ dashboard.nextAppointment.patient.lastName }}
              </p>
              <div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Clock class="h-3.5 w-3.5" :stroke-width="1.75" />
                <span class="tabular-nums">{{ formatDate(dashboard.nextAppointment.appointmentDate) }} à
                {{ dashboard.nextAppointment.startTime }}</span>
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
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
            class="mt-3 rounded-lg border border-black/[0.05] bg-white/60 p-3 text-sm text-gray-600"
          >
            <span class="font-medium text-gray-700">Motif :</span>
            {{ dashboard.nextAppointment.reason }}
          </p>

          <div class="mt-4 flex gap-2">
            <UiButton
              variant="outline"
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
              variant="secondary"
              size="sm"
              class="flex-1"
              @click="navigateTo('/practitioner/teleconsultations')"
            >
              <Video class="mr-1.5 h-4 w-4" :stroke-width="1.75" />
              Rejoindre
            </UiButton>
          </div>
        </div>
      </div>

      <!-- today appointments -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-display text-base font-semibold text-gray-900">
            Rendez-vous aujourd'hui
          </h3>
          <div class="flex items-center gap-2">
            <UiBadge variant="primary">
              {{ loading ? "..." : dashboard?.todayAppointments?.length || 0 }}
            </UiBadge>
            <UiButton
              variant="ghost"
              size="sm"
              @click="navigateTo('/practitioner/agenda')"
            >
              Voir agenda
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
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <CalendarCheck class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Aucun rendez-vous</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">Aucun rendez-vous prévu aujourd'hui.</p>
        </div>

        <div v-else class="max-h-64 space-y-1 overflow-y-auto">
          <div
            v-for="apt in dashboard.todayAppointments"
            :key="apt.id"
            class="group flex items-center gap-3 rounded-lg border border-transparent p-3 transition-all duration-150 hover:border-black/[0.05] hover:bg-gray-50"
          >
            <span class="tabular-nums text-sm font-semibold text-[#00804A]">
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
              variant="ghost"
              class="ml-1 h-7 px-2 py-0 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              @click.stop="openInvoiceModal(apt)"
            >
              Facturer
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100"></div>

    <!--  row: waiting teleconsultations + recent messages  -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- waiting teleconsultations -->
      <UiCard>
        <div class="mb-4 flex items-center gap-2">
          <Video class="h-4 w-4 text-[#00804A]" :stroke-width="1.75" />
          <h3 class="font-display text-base font-semibold text-gray-900">
            Patients en attente
          </h3>
        </div>

        <div v-if="loading" class="animate-pulse">
          <div class="h-16 rounded bg-gray-200"></div>
        </div>

        <div v-else class="flex items-center gap-4 rounded-lg border border-[#00804A]/10 bg-[#00804A]/5 p-4">
          <p class="font-display text-3xl font-bold tabular-nums text-[#00804A]">
            {{ dashboard?.waitingTeleconsultations || 0 }}
          </p>
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{
                (dashboard?.waitingTeleconsultations || 0) === 0
                  ? "Aucun patient en attente"
                  : (dashboard?.waitingTeleconsultations || 0) === 1
                    ? "1 patient en attente"
                    : `${dashboard?.waitingTeleconsultations} patients en attente`
              }}
            </p>
            <p class="text-xs text-gray-400">Salle d'attente virtuelle</p>
          </div>
        </div>
      </UiCard>

      <!-- recent messages -->
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <MessageSquare class="h-4 w-4 text-gray-400" :stroke-width="1.75" />
            <h3 class="font-display text-base font-semibold text-gray-900">
              Messages récents
            </h3>
          </div>
          <UiButton
            variant="ghost"
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
            <div class="h-8 w-8 rounded-full bg-gray-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/2 rounded bg-gray-200"></div>
              <div class="h-3 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!dashboard?.recentMessages?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <MessageSquare class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
          <h3 class="font-display text-base font-semibold text-gray-800">Aucun message</h3>
          <p class="mt-1 max-w-[280px] text-sm text-gray-400">Vos échanges apparaîtront ici.</p>
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="msg in dashboard.recentMessages"
            :key="msg.conversationId"
            class="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all duration-150 hover:bg-gray-50"
            @click="navigateTo('/practitioner/messages')"
          >
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500"
            >
              {{ msg.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900">
                  {{ msg.patientName }}
                </p>
                <span class="tabular-nums text-xs text-gray-400">
                  {{ formatRelativeTime(msg.createdAt) }}
                </span>
              </div>
              <p class="truncate text-sm text-gray-500">
                {{ msg.lastMessage }}
              </p>
            </div>
            <span
              v-if="msg.unread"
              class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#D96F00]"
            ></span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- section divider -->
    <div class="my-6 border-b border-gray-100"></div>

    <!--  row: todo list  -->
    <UiCard>
      <div class="mb-4 flex items-center gap-2">
        <ListTodo class="h-4 w-4 text-[#D96F00]" :stroke-width="1.75" />
        <h3 class="font-display text-base font-semibold text-gray-900">À faire</h3>
      </div>

      <!-- add new todo -->
      <form @submit.prevent="addTodo" class="mb-4 flex gap-2">
        <input
          v-model="newTodoTitle"
          type="text"
          placeholder="Ajouter une tâche..."
          class="flex-1"
          :disabled="addingTodo"
        />
        <UiButton
          type="submit"
          size="sm"
          :disabled="!newTodoTitle.trim() || addingTodo"
        >
          <Plus class="h-4 w-4" :stroke-width="1.75" />
          Ajouter
        </UiButton>
      </form>

      <div v-if="loading" class="animate-pulse space-y-2">
        <div v-for="i in 3" :key="i" class="h-10 rounded bg-gray-200"></div>
      </div>

      <div v-else-if="!dashboard?.todos?.length" class="flex flex-col items-center justify-center py-12 text-center">
        <ListTodo class="mb-3 h-12 w-12 text-gray-300 opacity-60" :stroke-width="1.25" />
        <h3 class="font-display text-base font-semibold text-gray-800">Aucune tâche</h3>
        <p class="mt-1 max-w-[280px] text-sm text-gray-400">Vos tâches en cours apparaîtront ici.</p>
      </div>

      <div v-else class="space-y-1">
        <div
          v-for="todo in dashboard.todos"
          :key="todo.id"
          class="flex items-center gap-3 rounded-lg border border-transparent px-4 py-3 transition-all duration-150 hover:border-black/[0.05] hover:bg-gray-50"
        >
          <button
            @click="toggleTodo(todo.id)"
            :disabled="togglingId === todo.id"
            :class="[
              'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
              todo.completed
                ? 'border-[#00804A] bg-[#00804A] text-white'
                : 'border-gray-300 hover:border-[#00804A]',
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
  Info,
  ArrowRight,
} from "lucide-vue-next";
import CreateInvoiceModal from "~/components/practitioner/CreateInvoiceModal.vue";
import { useAuthStore } from "~/stores/auth";
import { formatDateLong as formatDate, formatRelativeTime } from "~/utils/date";
import { getStatusVariant, getStatusLabel } from "~/utils/status";
import { canJoinTeleconsultation } from "@medicote/shared/utils/appointment-time";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
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

// profile visibility alert
const profileAlertDismissed = ref(false);
const profileInfo = ref({
  isProfilePublic: false,
  tarifsAreDefined: false,
  paymentMethodsAreDefined: false,
});

const showProfileAlert = computed(() => {
  if (profileAlertDismissed.value || loading.value) return false;
  return !profileInfo.value.isProfilePublic;
});

const profileAlertTitle = computed(() => {
  if (!profileInfo.value.tarifsAreDefined) {
    return "Configurez vos tarifs pour rendre votre profil public";
  }
  if (!profileInfo.value.paymentMethodsAreDefined) {
    return "Configurez vos moyens de paiement pour rendre votre profil public";
  }
  return "Votre profil n'est pas encore public";
});

const profileAlertMessage = computed(() => {
  if (!profileInfo.value.tarifsAreDefined) {
    return "Définissez vos tarifs de consultation pour permettre aux patients de vous trouver et de prendre rendez-vous en ligne.";
  }
  if (!profileInfo.value.paymentMethodsAreDefined) {
    return "Sélectionnez au moins un moyen de paiement accepté en cabinet pour permettre aux patients de prendre rendez-vous.";
  }
  return "Rendez votre profil visible pour que les patients puissent vous trouver et prendre rendez-vous en ligne.";
});

const profileAlertLink = computed(() => {
  if (!profileInfo.value.tarifsAreDefined) {
    return "/practitioner/billing";
  }
  if (!profileInfo.value.paymentMethodsAreDefined) {
    return "/practitioner/billing";
  }
  return "/practitioner/settings";
});

const profileAlertAction = computed(() => {
  if (!profileInfo.value.tarifsAreDefined) {
    return "Configurer mes tarifs";
  }
  if (!profileInfo.value.paymentMethodsAreDefined) {
    return "Configurer mes moyens de paiement";
  }
  return "Rendre mon profil public";
});

const dismissProfileAlert = () => {
  profileAlertDismissed.value = true;
};

const canJoinNextTeleconsultation = computed(() => {
  if (!dashboard.value?.nextAppointment) return false;
  const apt = dashboard.value.nextAppointment;
  if (apt.type !== "TELECONSULTATION") return false;
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  return canJoinTeleconsultation(
    apt.appointmentDate,
    apt.startTime,
    apt.endTime,
  );
});


const kpiCards = computed(() => [
  {
    label: "Consultations ce mois",
    value: dashboard.value?.consultationsThisMonth ?? "-",
    icon: Calendar,
    borderColor: "border-t-2 border-t-[#00804A]/30",
  },
  {
    label: "Revenus ce mois",
    value: dashboard.value
      ? `${dashboard.value.revenue.toLocaleString("fr-FR")} XOF`
      : "-",
    icon: CreditCard,
    borderColor: "border-t-2 border-t-[#D96F00]/30",
  },
  {
    label: "Taux de présence ce mois",
    value: dashboard.value ? `${dashboard.value.attendanceRate}%` : "-",
    icon: TrendingUp,
    borderColor: "border-t-2 border-t-[#00804A]/30",
  },
  {
    label: "Nouveaux patients ce mois",
    value: dashboard.value?.newPatients ?? "-",
    icon: UserPlus,
    borderColor: "border-t-2 border-t-[#D96F00]/30",
  },
]);

interface ProfileData {
  isProfilePublic: boolean;
  baseConsultationFee: number | null;
  acceptedPaymentMethods?: string[];
  licenseVerifiedAt: string | null;
}

const licenseVerifiedAt = ref<string | null>(null);
const showBillingNotice = ref(false);

const formattedTrialStartDate = computed(() => {
  if (!licenseVerifiedAt.value) return "validation";
  return new Date(licenseVerifiedAt.value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const formattedBillingDate = computed(() => {
  if (!licenseVerifiedAt.value) return "dans 1 mois";
  const d = new Date(licenseVerifiedAt.value);
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const fetchDashboard = async () => {
  try {
    const [dashboardResponse, profileResponse, methodsResponse] = await Promise.all([
      useAuthenticatedFetch<{
        success: boolean;
        data: DashboardData;
      }>("/practitioner/dashboard"),
      useAuthenticatedFetch<{
        success: boolean;
        data: ProfileData;
      }>("/practitioner/dashboard/profile"),
      useAuthenticatedFetch<{
        success: boolean;
        data: any[];
      }>("/payments/methods"),
    ]);

    if (dashboardResponse.success) {
      dashboard.value = dashboardResponse.data;
    }

    if (profileResponse.success) {
      profileInfo.value.isProfilePublic =
        profileResponse.data.isProfilePublic || false;
      profileInfo.value.tarifsAreDefined =
        !!profileResponse.data.baseConsultationFee;
      profileInfo.value.paymentMethodsAreDefined =
        !!profileResponse.data.acceptedPaymentMethods &&
        profileResponse.data.acceptedPaymentMethods.length > 0;
      
      licenseVerifiedAt.value = profileResponse.data.licenseVerifiedAt;
    }

    if (methodsResponse.success && methodsResponse.data) {
      const hasVerifiedMethod = methodsResponse.data.some((m: any) => m.isVerified);
      showBillingNotice.value = !hasVerifiedMethod && !!licenseVerifiedAt.value;
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
const selectedAppointmentForInvoice = ref<AppointmentInfo | null>(null);

const openInvoiceModal = (apt: AppointmentInfo) => {
  selectedAppointmentForInvoice.value = apt;
  isInvoiceModalOpen.value = true;
};

const handleInvoiceSuccess = () => {
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
