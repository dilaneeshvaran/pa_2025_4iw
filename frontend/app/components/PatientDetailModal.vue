<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="emit('close')"
      >
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl"
        >
          <!-- for practitioner dash -->
          <!-- loading -->
          <div v-if="loading" class="p-6">
            <div class="animate-pulse space-y-4">
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 rounded-full bg-gray-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-5 w-2/3 rounded bg-gray-200"></div>
                  <div class="h-3 w-1/3 rounded bg-gray-200"></div>
                </div>
              </div>
              <div class="h-24 rounded bg-gray-200"></div>
              <div class="h-20 rounded bg-gray-200"></div>
            </div>
          </div>

          <!-- error -->
          <div v-else-if="error" class="p-6 text-center">
            <AlertCircle class="mx-auto mb-3 h-12 w-12 text-red-400" />
            <p class="text-gray-600">
              Impossible de charger les détails du patient
            </p>
            <UiButton
              variant="secondary"
              size="sm"
              class="mt-4"
              @click="emit('close')"
            >
              Fermer
            </UiButton>
          </div>

          <div v-else-if="patient">
            <div
              class="flex items-start justify-between border-b border-gray-200 p-6 pb-4"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
                >
                  <span class="text-lg font-bold text-blue-600">
                    {{ patient.firstName.charAt(0)
                    }}{{ patient.lastName.charAt(0) }}
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-gray-900">
                      {{ patient.firstName }} {{ patient.lastName }}
                    </h2>
                    <UiBadge
                      v-if="patient.isNew"
                      variant="success"
                      class-name="text-xs"
                    >
                      Nouveau
                    </UiBadge>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ getAge(patient.dateOfBirth) }} ans -
                    {{ getGenderLabel(patient.gender) }}
                  </p>
                </div>
              </div>
              <button
                class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                @click="emit('close')"
              >
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- stats  -->
            <div class="grid grid-cols-2 gap-3 border-b border-gray-200 p-6">
              <div class="rounded-lg bg-red-50 p-3">
                <div class="flex items-center gap-2">
                  <Droplets class="h-4 w-4 text-red-500" />
                  <span class="text-xs font-medium text-red-700"
                    >Groupe sanguin</span
                  >
                </div>
                <p class="mt-1 text-lg font-bold text-red-900">
                  {{ patient.bloodType || "Non renseigné" }}
                </p>
              </div>

              <div class="rounded-lg bg-blue-50 p-3">
                <div class="flex items-center gap-2">
                  <CalendarCheck class="h-4 w-4 text-blue-500" />
                  <span class="text-xs font-medium text-blue-700"
                    >Dernier RDV</span
                  >
                </div>
                <p class="mt-1 text-sm font-bold text-blue-900">
                  {{
                    patient.lastAppointment
                      ? formatShortDate(patient.lastAppointment.appointmentDate)
                      : "Aucun"
                  }}
                </p>
              </div>

              <div class="rounded-lg bg-purple-50 p-3">
                <div class="flex items-center gap-2">
                  <Activity class="h-4 w-4 text-purple-500" />
                  <span class="text-xs font-medium text-purple-700"
                    >Total consultations</span
                  >
                </div>
                <p class="mt-1 text-lg font-bold text-purple-900">
                  {{ patient.totalConsultations }}
                </p>
              </div>

              <div class="rounded-lg bg-green-50 p-3">
                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-green-500" />
                  <span class="text-xs font-medium text-green-700"
                    >Patient depuis</span
                  >
                </div>
                <p class="mt-1 text-sm font-bold text-green-900">
                  {{
                    patient.firstAppointmentDate
                      ? formatMonthYear(patient.firstAppointmentDate)
                      : "-"
                  }}
                </p>
              </div>
            </div>

            <div class="border-b border-gray-200 p-6">
              <h3
                class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500"
              >
                Coordonnées
              </h3>
              <div class="space-y-2">
                <div
                  v-if="patient.phone"
                  class="flex items-center gap-3 text-sm"
                >
                  <Phone class="h-4 w-4 text-gray-400" />
                  <span class="text-gray-700">{{ patient.phone }}</span>
                </div>
                <div
                  v-if="patient.email"
                  class="flex items-center gap-3 text-sm"
                >
                  <Mail class="h-4 w-4 text-gray-400" />
                  <span class="text-gray-700">{{ patient.email }}</span>
                </div>
                <div
                  v-if="patient.city || patient.address"
                  class="flex items-center gap-3 text-sm"
                >
                  <MapPin class="h-4 w-4 text-gray-400" />
                  <span class="text-gray-700">
                    {{
                      [patient.address, patient.city].filter(Boolean).join(", ")
                    }}
                  </span>
                </div>
                <div
                  v-if="
                    !patient.phone &&
                    !patient.email &&
                    !patient.city &&
                    !patient.address
                  "
                  class="text-sm text-gray-400"
                >
                  Aucune coordonnée disponible
                </div>
              </div>
            </div>

            <div
              v-if="patient.nextAppointment"
              class="border-b border-gray-200 p-6"
            >
              <h3
                class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500"
              >
                Prochain rendez-vous
              </h3>
              <div
                class="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm"
              >
                <Calendar class="h-4 w-4 text-blue-500" />
                <span class="font-medium text-blue-800">
                  {{ formatShortDate(patient.nextAppointment.appointmentDate) }}
                  à {{ patient.nextAppointment.startTime }}
                </span>
                <UiBadge
                  :variant="
                    patient.nextAppointment.type === 'TELECONSULTATION'
                      ? 'success'
                      : 'default'
                  "
                  class-name="text-xs ml-auto"
                >
                  {{
                    patient.nextAppointment.type === "TELECONSULTATION"
                      ? "Télé"
                      : "Cabinet"
                  }}
                </UiBadge>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 p-6">
              <UiButton
                variant="primary"
                size="sm"
                @click="emit('navigate-dossier', patient.id)"
              >
                <FolderOpen class="mr-1.5 h-4 w-4" />
                Dossier complet
              </UiButton>
              <UiButton
                variant="secondary"
                size="sm"
                @click="emit('navigate-booking', patient.id)"
              >
                <CalendarPlus class="mr-1.5 h-4 w-4" />
                Nouveau RDV
              </UiButton>
              <UiButton
                variant="secondary"
                size="sm"
                @click="emit('navigate-message', patient.id)"
              >
                <MessageSquare class="mr-1.5 h-4 w-4" />
                Message
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  X as XIcon,
  Droplets,
  CalendarCheck,
  Activity,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FolderOpen,
  CalendarPlus,
  MessageSquare,
  AlertCircle,
} from "lucide-vue-next";

interface AppointmentBrief {
  id: string;
  appointmentDate: string;
  startTime: string;
  type: string;
  status: string;
}

interface PatientDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
  height: number | null;
  weight: number | null;
  isNew: boolean;
  firstAppointmentDate: string | null;
  totalConsultations: number;
  lastAppointment: AppointmentBrief | null;
  nextAppointment: AppointmentBrief | null;
}

const props = defineProps<{
  isOpen: boolean;
  patientId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  "navigate-dossier": [id: string];
  "navigate-message": [id: string];
  "navigate-booking": [id: string];
}>();

const patient = ref<PatientDetail | null>(null);
const loading = ref(false);
const error = ref(false);

watch(
  () => props.patientId,
  async (newId) => {
    if (newId && props.isOpen) {
      await fetchPatientDetail(newId);
    }
  },
);

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.patientId) {
      await fetchPatientDetail(props.patientId);
    } else if (!isOpen) {
      patient.value = null;
      error.value = false;
    }
  },
);

const fetchPatientDetail = async (patientId: string) => {
  loading.value = true;
  error.value = false;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: PatientDetail;
    }>(`/practitioner/patients/${patientId}`);

    if (response.success) {
      patient.value = response.data;
    } else {
      error.value = true;
    }
  } catch (e) {
    console.error("Error fetching patient detail:", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const getAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const getGenderLabel = (gender: string): string => {
  const map: Record<string, string> = {
    MALE: "Homme",
    FEMALE: "Femme",
    OTHER: "Autre",
    PREFER_NOT_TO_SAY: "Non précisé",
  };
  return map[gender] || gender;
};

const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .max-w-lg,
.modal-leave-active .max-w-lg {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .max-w-lg {
  transform: scale(0.95);
}
</style>
