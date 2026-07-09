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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dossier patient</h1>
        <p class="text-gray-600 dark:text-gray-400">
          <span v-if="patient"
            >{{ patient.firstName }} {{ patient.lastName }}</span
          >
          <span v-else>Chargement...</span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div class="mb-4 h-6 w-1/3 rounded bg-gray-200" />
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 9" :key="i" class="h-10 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 p-6 text-center"
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
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
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
          <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
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
          <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
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
          <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Assurance</h2>
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
            <AlertTriangle class="h-5 w-5 text-red-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Allergies</h3>
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
              class="rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center gap-2">
            <Activity class="h-5 w-5 text-orange-500" />
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
              class="rounded-full bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center gap-2">
            <Scissors class="h-5 w-5 text-purple-500" />
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
              class="rounded-full bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300"
            >
              {{ item }}
            </span>
          </div>
        </UiCard>
      </div>

      <!--documents  -->
      <div v-if="activeTab === 'documents'">
        <UiCard>
          <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Documents</h2>
            <UiButton size="sm" @click="openUploadModal" class="flex items-center gap-1.5">
              <Plus class="h-4 w-4" />
              Envoyer un document
            </UiButton>
          </div>

          <div class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              v-for="scope in documentScopes"
              :key="scope.key"
              :class="[
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                activeDocumentScope === scope.key
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ]"
              @click="activeDocumentScope = scope.key"
            >
              {{ scope.label }}
              <span class="ml-1 text-xs">({{ getScopeCount(scope.key) }})</span>
            </button>
          </div>

          <div class="mb-6 border-b border-gray-200 dark:border-gray-800">
            <nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Filtres documents">
              <button
                v-for="filter in documentTypeFilters"
                :key="filter.key"
                :class="[
                  'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors',
                  activeDocumentTypeFilter === filter.key
                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
                ]"
                @click="activeDocumentTypeFilter = filter.key"
              >
                {{ filter.label }}
                <span class="ml-1.5 text-xs">({{ getTypeCount(filter.key) }})</span>
              </button>
            </nav>
          </div>

          <div v-if="loadingDocs" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="animate-pulse rounded-lg border border-gray-200 dark:border-gray-800 p-4"
            >
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 rounded-lg bg-gray-200" />
                <div class="flex-1">
                  <div class="mb-2 h-4 w-1/3 rounded bg-gray-200" />
                  <div class="h-3 w-1/4 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="filteredDocuments.length === 0" class="py-8 text-center">
            <FileText class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p class="text-gray-500 dark:text-gray-400">
              {{
                activeDocumentScope === "patient"
                  ? "Aucun document du patient disponible"
                  : "Aucun document envoyé disponible"
              }}
            </p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4 transition-shadow hover:shadow-sm"
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
                    <p class="truncate font-medium text-gray-900 dark:text-gray-100">
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
                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(doc.uploadedAt) }}</span>
                    <span class="text-gray-300">.</span>
                    <span>{{ formatFileSize(doc.fileSize) }}</span>
                  </div>
                </div>
              </div>
              <div class="ml-4 flex flex-shrink-0 items-center gap-2">
                <button
                  v-if="isPdf(doc.mimeType)"
                  class="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-orange-600"
                  title="Lire"
                  @click="viewDocument(doc)"
                >
                  <Eye class="h-5 w-5" />
                </button>
                <button
                  class="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-orange-600"
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
          <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historique des consultations
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4">
              <p class="text-sm text-orange-700 dark:text-orange-300">Total consultations</p>
              <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {{ patient.totalConsultations }}
              </p>
            </div>
            <div class="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
              <p class="text-sm text-green-700 dark:text-green-300">Patient depuis</p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-200">
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
            <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div class="flex items-center gap-3">
                <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>{{
                  formatDate(patient.lastAppointment.appointmentDate)
                }}</span>
                <span class="text-gray-500 dark:text-gray-400">-</span>
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
            <h3 class="mb-3 font-medium text-gray-900 dark:text-gray-100">Prochain rendez-vous</h3>
            <div class="rounded-lg border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-950/30 p-4">
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
          class="relative mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white dark:bg-gray-900 shadow-2xl"
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ viewerDoc?.title }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ viewerDoc?.fileName }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Telecharger"
                @click="viewerDoc && downloadDocument(viewerDoc)"
              >
                <Download class="h-5 w-5" />
              </button>
              <button
                class="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                @click="showViewer = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-hidden relative">
            <div
              v-if="viewerLoading"
              class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
            >
              <svg
                class="mb-3 h-10 w-10 animate-spin text-orange-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p class="text-sm text-gray-500 dark:text-gray-400">Chargement du document...</p>
            </div>
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

    <!-- upload document modal -->
    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="showUploadModal = false"
      >
        <div class="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between border-b pb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Envoyer un document
            </h3>
            <button
              class="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="showUploadModal = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="handleUpload" class="space-y-4">
            <div v-if="uploadError" class="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {{ uploadError }}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de document *
              </label>
              <select
                v-model="newDocType"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                required
              >
                <option value="PRESCRIPTION">Ordonnance</option>
                <option value="LAB_RESULT">Examen de laboratoire</option>
                <option value="RADIOLOGY">Radiographie / Imagerie</option>
                <option value="MEDICAL_REPORT">Rapport médical</option>
                <option value="CERTIFICATE">Certificat médical</option>
                <option value="CONSENT_FORM">Formulaire de consentement</option>
                <option value="INSURANCE">Document d'assurance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre du document *
              </label>
              <input
                v-model="newDocTitle"
                type="text"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                placeholder="Ex: Ordonnance Paracétamol"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (facultatif)
              </label>
              <textarea
                v-model="newDocDescription"
                rows="3"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                placeholder="Ajouter des notes ou consignes pour le patient..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichier *
              </label>
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                @change="handleFileChange"
                required
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Formats acceptés : PDF, JPEG, PNG, WEBP, DOC, DOCX. Max 10 Mo.
              </p>
            </div>

            <div class="mt-6 flex justify-end gap-3 border-t pt-4">
              <UiButton
                type="button"
                variant="outline"
                :disabled="uploading"
                @click="showUploadModal = false"
              >
                Annuler
              </UiButton>
              <UiButton
                type="submit"
                :disabled="uploading"
                class="flex items-center gap-1.5"
              >
                <span v-if="uploading">Envoi...</span>
                <span v-else>Envoyer</span>
              </UiButton>
            </div>
          </form>
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
  Plus,
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
  origin: "PATIENT" | "SENT";
  sentByCurrentPractitioner: boolean;
}

type DocumentScope = "patient" | "sent";
type DocumentTypeFilter =
  | "all"
  | "prescriptions"
  | "exams"
  | "certificates"
  | "others";

const documentScopes: { key: DocumentScope; label: string }[] = [
  { key: "patient", label: "Documents du patient" },
  { key: "sent", label: "Documents envoyés" },
];

const documentTypeFilters: { key: DocumentTypeFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "prescriptions", label: "Ordonnances" },
  { key: "exams", label: "Examens" },
  { key: "certificates", label: "Certificats" },
  { key: "others", label: "Autres" },
];

const documentTypeGroups: Record<DocumentTypeFilter, string[]> = {
  all: [],
  prescriptions: ["PRESCRIPTION"],
  exams: ["LAB_RESULT", "RADIOLOGY"],
  certificates: ["CERTIFICATE", "MEDICAL_REPORT"],
  others: ["CONSENT_FORM", "INSURANCE", "OTHER"],
};

const patient = ref<PatientDetail | null>(null);
const documents = ref<DocItem[]>([]);
const loadingDocs = ref(false);
const activeDocumentScope = ref<DocumentScope>("patient");
const activeDocumentTypeFilter = ref<DocumentTypeFilter>("all");

// pdf viewer
const showViewer = ref(false);
const viewerDoc = ref<DocItem | null>(null);
const viewerUrl = ref("");
const viewerLoading = ref(false);

// document upload
const showUploadModal = ref(false);
const uploading = ref(false);
const uploadError = ref("");
const newDocTitle = ref("");
const newDocType = ref("PRESCRIPTION");
const newDocDescription = ref("");
const newDocFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const scopeDocuments = computed(() =>
  documents.value.filter((doc) =>
    activeDocumentScope.value === "patient"
      ? doc.origin === "PATIENT"
      : doc.origin === "SENT",
  ),
);

const filteredDocuments = computed(() => {
  const selectedTypes = documentTypeGroups[activeDocumentTypeFilter.value];
  if (selectedTypes.length === 0) return scopeDocuments.value;
  return scopeDocuments.value.filter((doc) => selectedTypes.includes(doc.type));
});

const getScopeCount = (scope: DocumentScope) =>
  documents.value.filter((doc) =>
    scope === "patient" ? doc.origin === "PATIENT" : doc.origin === "SENT",
  ).length;

const getTypeCount = (filter: DocumentTypeFilter) => {
  const selectedTypes = documentTypeGroups[filter];
  if (selectedTypes.length === 0) return scopeDocuments.value.length;
  return scopeDocuments.value.filter((doc) => selectedTypes.includes(doc.type))
    .length;
};

const openUploadModal = () => {
  newDocTitle.value = "";
  newDocType.value = "PRESCRIPTION";
  newDocDescription.value = "";
  newDocFile.value = null;
  uploadError.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  showUploadModal.value = true;
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    newDocFile.value = target.files[0];
    if (!newDocTitle.value && target.files[0]) {
      const name = target.files[0].name;
      const lastDotIndex = name.lastIndexOf(".");
      newDocTitle.value = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
    }
  }
};

const handleUpload = async () => {
  if (!newDocTitle.value) {
    uploadError.value = "Le titre est requis";
    return;
  }
  if (!newDocFile.value) {
    uploadError.value = "Veuillez sélectionner un fichier";
    return;
  }

  uploading.value = true;
  uploadError.value = "";

  try {
    const formData = new FormData();
    formData.append("title", newDocTitle.value);
    formData.append("type", newDocType.value);
    if (newDocDescription.value) {
      formData.append("description", newDocDescription.value);
    }
    formData.append("file", newDocFile.value);

    const response = await fetch(`${config.public.apiBase}/documents/patient/${patientId.value}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Erreur lors de l'envoi du document.");
    }

    showUploadModal.value = false;
    await fetchDocuments();
  } catch (err: unknown) {
    console.error("Upload error:", err);
    uploadError.value =
      err instanceof Error
        ? err.message
        : "Une erreur est survenue lors de l'envoi du document.";
  } finally {
    uploading.value = false;
  }
};

const InfoField = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", [
        h("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, props.label),
        h("p", { class: "font-medium text-gray-900 dark:text-gray-100" }, props.value),
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
      activeDocumentTypeFilter.value = "all";
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
  viewerUrl.value = "";
  viewerLoading.value = true;
  showViewer.value = true;
  const url = `${config.public.apiBase}/documents/patient/${patientId.value}/${doc.id}/view`;

  fetch(url, {
    headers: { Authorization: `Bearer ${authStore.accessToken}` },
  })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then((blob) => {
      viewerUrl.value = URL.createObjectURL(blob);
    })
    .catch(() => {
      showViewer.value = false;
      alert("Erreur lors de l'ouverture du document");
    })
    .finally(() => {
      viewerLoading.value = false;
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
