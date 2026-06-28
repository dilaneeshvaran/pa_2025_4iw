<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UiButton
        variant="outline"
        size="sm"
        @click="navigateTo('/practitioner/patients')"
      >
        <ArrowLeft class="mr-1.5 h-4 w-4" />
        Retour
      </UiButton>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dossier patient
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          <span v-if="patient"
            >{{ patient.firstName }} {{ patient.lastName }}</span
          >
          <span v-else>Chargement...</span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div
        class="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="i in 9"
            :key="i"
            class="h-10 rounded bg-gray-100 dark:bg-gray-800"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-950/40"
    >
      <AlertCircle class="mx-auto mb-3 h-12 w-12 text-red-400" />
      <p class="font-medium text-red-800 dark:text-red-200">{{ error }}</p>
      <UiButton variant="outline" class="mt-4" @click="fetchPatient">
        Réessayer
      </UiButton>
    </div>

    <template v-else-if="patient">
      <div class="border-b border-gray-200 dark:border-gray-800">
        <nav class="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400',
            ]"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" class="mr-2 inline-block h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- profile tab -->
      <div v-if="activeTab === 'profile'">
        <UiCard>
          <h2
            class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Informations personnelles
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoField
              label="Nom complet"
              :value="`${patient.firstName} ${patient.lastName}`"
            />
            <InfoField
              label="Age"
              :value="
                patient.dateOfBirth
                  ? calculateAge(patient.dateOfBirth) + ' ans'
                  : '-'
              "
            />
            <InfoField label="Sexe" :value="formatGender(patient.gender)" />
            <InfoField
              label="Taille"
              :value="patient.height ? `${patient.height} cm` : '-'"
            />
            <InfoField
              label="Poids"
              :value="patient.weight ? `${patient.weight} kg` : '-'"
            />
            <InfoField
              label="Groupe sanguin"
              :value="patient.bloodType || '-'"
            />
            <InfoField label="Telephone" :value="patient.phone" />
            <InfoField label="Email" :value="patient.email || '-'" />
            <InfoField label="Ville" :value="patient.city || '-'" />
            <InfoField
              label="Adresse"
              :value="patient.address || '-'"
              class="sm:col-span-2"
            />
          </div>
        </UiCard>

        <UiCard class="mt-6">
          <h2
            class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Contact d'urgence
          </h2>
          <div class="grid gap-6 sm:grid-cols-2">
            <InfoField
              label="Nom"
              :value="patient.emergencyContactName || '-'"
            />
            <InfoField
              label="Telephone"
              :value="patient.emergencyContactPhone || '-'"
            />
          </div>
        </UiCard>

        <UiCard class="mt-6">
          <h2
            class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Assurance
          </h2>
          <div class="grid gap-6 sm:grid-cols-2">
            <InfoField
              label="Assureur"
              :value="patient.insuranceProvider || '-'"
            />
            <InfoField
              label="Numero d'assurance"
              :value="patient.insuranceNumber || '-'"
            />
          </div>
        </UiCard>
      </div>

      <!-- antecedents  -->
      <div v-if="activeTab === 'antecedents'" class="space-y-6">
        <UiCard>
          <div class="mb-4 flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-red-500 dark:text-red-400" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Allergies
            </h3>
          </div>
          <div
            v-if="!patient.allergies?.length"
            class="py-4 text-center text-gray-500 dark:text-gray-400"
          >
            Aucune allergie renseignee
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in patient.allergies"
              :key="idx"
              class="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center gap-2">
            <Activity class="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Maladies chroniques
            </h3>
          </div>
          <div
            v-if="!patient.chronicConditions?.length"
            class="py-4 text-center text-gray-500 dark:text-gray-400"
          >
            Aucune maladie chronique renseignee
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in patient.chronicConditions"
              :key="idx"
              class="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center gap-2">
            <Scissors class="h-5 w-5 text-purple-500 dark:text-purple-400" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Operations chirurgicales
            </h3>
          </div>
          <div
            v-if="!patient.surgicalOperations?.length"
            class="py-4 text-center text-gray-500 dark:text-gray-400"
          >
            Aucune operation chirurgicale renseignee
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in patient.surgicalOperations"
              :key="idx"
              class="rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>
      </div>

      <!--documents  -->
      <div v-if="activeTab === 'documents'">
        <UiCard>
          <h2
            class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Documents du patient
          </h2>

          <div v-if="loadingDocs" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div class="flex items-center gap-4">
                <div
                  class="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700"
                />
                <div class="flex-1">
                  <div
                    class="mb-2 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"
                  />
                  <div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="documents.length === 0" class="py-8 text-center">
            <FileText
              class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
            />
            <p class="text-gray-500 dark:text-gray-400">
              Aucun document disponible
            </p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm dark:border-gray-800"
            >
              <div class="flex items-center gap-4">
                <div
                  :class="[
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                    getDocTypeColor(doc.type),
                  ]"
                >
                  <component :is="getDocTypeIcon(doc.type)" class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p
                      class="truncate font-medium text-gray-900 dark:text-gray-100"
                    >
                      {{ doc.title }}
                    </p>
                    <span
                      :class="[
                        'hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex',
                        getDocTypeBadgeColor(doc.type),
                      ]"
                    >
                      {{ getDocTypeLabel(doc.type) }}
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span>{{ formatDate(doc.uploadedAt) }}</span>
                    <span class="text-gray-300 dark:text-gray-600">.</span>
                    <span>{{ formatFileSize(doc.fileSize) }}</span>
                  </div>
                </div>
              </div>
              <div class="ml-4 flex flex-shrink-0 items-center gap-2">
                <button
                  v-if="isPdf(doc.mimeType)"
                  class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-orange-600 dark:text-gray-500 dark:hover:bg-gray-800"
                  title="Lire"
                  @click="viewDocument(doc)"
                >
                  <Eye class="h-5 w-5" />
                </button>
                <button
                  class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-orange-600 dark:text-gray-500 dark:hover:bg-gray-800"
                  title="Telecharger"
                  @click="downloadDocument(doc)"
                >
                  <Download class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- consultation history  -->
      <div v-if="activeTab === 'history'">
        <UiCard>
          <h2
            class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Historique des consultations
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg bg-orange-50 p-4 dark:bg-orange-950/40">
              <p class="text-sm text-orange-700 dark:text-orange-300">
                Total consultations
              </p>
              <p
                class="text-2xl font-bold text-orange-700 dark:text-orange-300"
              >
                {{ patient.totalConsultations }}
              </p>
            </div>
            <div class="rounded-lg bg-green-50 p-4 dark:bg-green-950/40">
              <p class="text-sm text-green-700 dark:text-green-300">
                Patient depuis
              </p>
              <p class="text-2xl font-bold text-green-900">
                {{
                  patient.firstAppointmentDate
                    ? formatDate(patient.firstAppointmentDate)
                    : "-"
                }}
              </p>
            </div>
          </div>

          <div v-if="patient.lastAppointment" class="mt-6">
            <h3 class="mb-3 font-medium text-gray-900 dark:text-gray-100">
              Derniere consultation
            </h3>
            <div
              class="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div class="flex items-center gap-3">
                <Calendar class="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span>{{
                  formatDate(patient.lastAppointment.appointmentDate)
                }}</span>
                <span class="text-gray-400 dark:text-gray-500">-</span>
                <span>{{ patient.lastAppointment.startTime }}</span>
                <UiBadge
                  :variant="
                    patient.lastAppointment.type === 'TELECONSULTATION'
                      ? 'success'
                      : 'default'
                  "
                >
                  {{
                    patient.lastAppointment.type === "TELECONSULTATION"
                      ? "Teleconsultation"
                      : "Cabinet"
                  }}
                </UiBadge>
              </div>
            </div>
          </div>

          <div v-if="patient.nextAppointment" class="mt-6">
            <h3 class="mb-3 font-medium text-gray-900 dark:text-gray-100">
              Prochain rendez-vous
            </h3>
            <div
              class="rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-950/40"
            >
              <div class="flex items-center gap-3">
                <Calendar class="h-5 w-5 text-green-600 dark:text-green-400" />
                <span class="text-green-800 dark:text-green-200">{{
                  formatDate(patient.nextAppointment.appointmentDate)
                }}</span>
                <span class="text-green-600 dark:text-green-400">-</span>
                <span class="text-green-800 dark:text-green-200">{{
                  patient.nextAppointment.startTime
                }}</span>
                <UiBadge
                  :variant="
                    patient.nextAppointment.type === 'TELECONSULTATION'
                      ? 'success'
                      : 'default'
                  "
                >
                  {{
                    patient.nextAppointment.type === "TELECONSULTATION"
                      ? "Teleconsultation"
                      : "Cabinet"
                  }}
                </UiBadge>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </template>

    <!-- pdf viewer modal -->
    <Teleport to="body">
      <div
        v-if="showViewer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="showViewer = false"
      >
        <div
          class="relative mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl dark:bg-gray-900"
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ viewerDoc?.title }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ viewerDoc?.fileName }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Telecharger"
                @click="viewerDoc && downloadDocument(viewerDoc)"
              >
                <Download class="h-5 w-5" />
              </button>
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                @click="showViewer = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <iframe
              v-if="viewerUrl"
              :src="viewerUrl"
              class="h-full w-full"
              frameborder="0"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  AlertCircle,
  User,
  AlertTriangle,
  Activity,
  Scissors,
  FileText,
  Eye,
  Download,
  X,
  Calendar,
  Pill,
  TestTubes,
  FileSearch,
  Award,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { formatShortDate as formatDate } from "~/utils/date";
import {
  getDocTypeLabel,
  getDocTypeColor,
  getDocTypeBadgeColor,
} from "~/utils/docType";
import type { Component } from "vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const route = useRoute();
const authStore = useAuthStore();
const config = useRuntimeConfig();

const patientId = computed(() => route.params.id as string);

type TabKey = "profile" | "antecedents" | "documents" | "history";

const tabs: { key: TabKey; label: string; icon: Component }[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "antecedents", label: "Antecedents", icon: AlertTriangle },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "history", label: "Historique", icon: Calendar },
];

const activeTab = ref<TabKey>("profile");
const loading = ref(true);
const error = ref<string | null>(null);

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
  surgicalOperations: string[];
  height: number | null;
  weight: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
  isNew: boolean;
  firstAppointmentDate: string | null;
  totalConsultations: number;
  lastAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    type: string;
    status: string;
  } | null;
  nextAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    type: string;
    status: string;
  } | null;
}

interface DocItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const patient = ref<PatientDetail | null>(null);
const documents = ref<DocItem[]>([]);
const loadingDocs = ref(false);

// pdf viewer
const showViewer = ref(false);
const viewerDoc = ref<DocItem | null>(null);
const viewerUrl = ref("");

const InfoField = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", [
        h(
          "p",
          { class: "text-sm text-gray-500 dark:text-gray-400" },
          props.label,
        ),
        h(
          "p",
          { class: "font-medium text-gray-900 dark:text-gray-100" },
          props.value,
        ),
      ]);
  },
});

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatGender = (gender: string) => {
  const genders: Record<string, string> = {
    MALE: "Homme",
    FEMALE: "Femme",
    OTHER: "Autre",
    PREFER_NOT_TO_SAY: "Non specifie",
  };
  return genders[gender] || gender;
};

const getDocTypeIcon = (type: string) => {
  const icons: Record<string, Component> = {
    PRESCRIPTION: Pill,
    LAB_RESULT: TestTubes,
    RADIOLOGY: FileSearch,
    MEDICAL_REPORT: FileText,
    CERTIFICATE: Award,
    CONSENT_FORM: FileText,
    INSURANCE: FileText,
    OTHER: FileText,
  };
  return icons[type] || FileText;
};

const isPdf = (mimeType: string) => mimeType === "application/pdf";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const fetchPatient = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: PatientDetail;
      message?: string;
    }>(`/practitioner/patients/${patientId.value}`);

    if (response.success) {
      patient.value = response.data;
    } else {
      error.value = response.message || "Patient non trouve";
    }
  } catch (err) {
    console.error("Error fetching patient:", err);
    error.value = "Erreur lors du chargement du dossier patient";
  } finally {
    loading.value = false;
  }
};

const fetchDocuments = async () => {
  loadingDocs.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DocItem[];
    }>(`/practitioner/patients/${patientId.value}/documents`);

    if (response.success) {
      documents.value = response.data;
    }
  } catch (err) {
    console.error("Error fetching documents:", err);
  } finally {
    loadingDocs.value = false;
  }
};

const downloadDocument = async (doc: DocItem) => {
  try {
    const url = `${config.public.apiBase}/documents/patient/${patientId.value}/${doc.id}/download`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    });
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error downloading document:", err);
    alert("Erreur lors du telechargement du document");
  }
};

const viewDocument = (doc: DocItem) => {
  viewerDoc.value = doc;
  const url = `${config.public.apiBase}/documents/patient/${patientId.value}/${doc.id}/view`;

  fetch(url, {
    headers: { Authorization: `Bearer ${authStore.accessToken}` },
  })
    .then((r) => r.blob())
    .then((blob) => {
      viewerUrl.value = URL.createObjectURL(blob);
      showViewer.value = true;
    })
    .catch(() => {
      alert("Erreur lors de l'ouverture du document");
    });
};

watch(activeTab, (newTab) => {
  if (
    newTab === "documents" &&
    documents.value.length === 0 &&
    !loadingDocs.value
  ) {
    fetchDocuments();
  }
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchPatient();
  } else {
    loading.value = false;
    error.value = "Non authentifie";
  }
});
</script>
