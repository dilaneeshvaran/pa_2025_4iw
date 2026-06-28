<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Mes documents
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Documents reçus de vos praticiens et de leur personnel
      </p>
    </div>

    <!-- search + view toggle -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="relative flex-1 sm:max-w-md">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un document..."
          class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-gray-700"
          @input="debouncedSearch"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500"
          @click="clearSearch"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <div
        class="flex items-center gap-2 rounded-lg border border-gray-200 p-1 dark:border-gray-800"
      >
        <button
          :class="[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'card'
              ? 'bg-orange-500 text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
          ]"
          @click="viewMode = 'card'"
        >
          <LayoutGrid class="inline-block h-4 w-4" />
        </button>
        <button
          :class="[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'list'
              ? 'bg-orange-500 text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
          ]"
          @click="viewMode = 'list'"
        >
          <List class="inline-block h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- tabs -->
    <div class="border-b border-gray-200 dark:border-gray-800">
      <nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-orange-600 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400',
          ]"
          @click="switchTab(tab.key)"
        >
          <component :is="tab.icon" class="mr-1.5 inline-block h-4 w-4" />
          {{ tab.label }}
          <span
            :class="[
              'ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              activeTab === tab.key
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            ]"
          >
            {{ getTabCount(tab.key) }}
          </span>
        </button>
      </nav>
    </div>

    <!-- loading -->
    <div v-if="loading" class="space-y-4">
      <div
        v-if="viewMode === 'card'"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="animate-pulse rounded-xl border border-gray-200 p-5 dark:border-gray-800"
        >
          <div class="mb-3 h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="mb-4 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-800"
        >
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div class="flex-1">
              <div
                class="mb-2 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"
              />
              <div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- empty state -->
    <div
      v-else-if="documents.length === 0"
      class="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center dark:border-gray-800"
    >
      <FileText
        class="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-600"
      />
      <p class="text-lg font-medium text-gray-500 dark:text-gray-400">
        Aucun document
      </p>
      <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
        {{
          searchQuery
            ? "Aucun document ne correspond à votre recherche"
            : "Vos documents reçus apparaîtront ici"
        }}
      </p>
    </div>

    <!-- card vew -->
    <div
      v-else-if="viewMode === 'card'"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="group rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md dark:border-gray-800"
      >
        <div class="mb-3 flex items-start justify-between">
          <div
            :class="[
              'flex h-10 w-10 items-center justify-center rounded-lg',
              getDocTypeColor(doc.type),
            ]"
          >
            <component :is="getDocTypeIcon(doc.type)" class="h-5 w-5" />
          </div>
          <span
            :class="[
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              getDocTypeBadgeColor(doc.type),
            ]"
          >
            {{ getDocTypeLabel(doc.type) }}
          </span>
        </div>

        <h3
          class="mb-1 line-clamp-2 font-medium text-gray-900 dark:text-gray-100"
        >
          {{ doc.title }}
        </h3>
        <p
          v-if="doc.practitioner"
          class="mb-2 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ doc.practitioner.title }} {{ doc.practitioner.firstName }}
          {{ doc.practitioner.lastName }}
        </p>
        <p
          v-if="doc.description"
          class="mb-3 line-clamp-2 text-sm text-gray-400 dark:text-gray-500"
        >
          {{ doc.description }}
        </p>

        <div
          class="mb-4 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500"
        >
          <span>{{ formatDate(doc.uploadedAt) }}</span>
          <span>·</span>
          <span>{{ formatFileSize(doc.fileSize) }}</span>
        </div>

        <div class="flex gap-2">
          <button
            v-if="isPdf(doc.mimeType)"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            @click="viewDocument(doc)"
          >
            <Eye class="h-4 w-4" />
            Lire
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            @click="downloadDocument(doc.id, doc.fileName)"
          >
            <Download class="h-4 w-4" />
            Télécharger
          </button>
        </div>
      </div>
    </div>

    <!-- list view -->
    <div v-else class="space-y-2">
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
            <div
              class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span v-if="doc.practitioner">
                {{ doc.practitioner.title }} {{ doc.practitioner.lastName }}
              </span>
              <span
                v-if="doc.practitioner"
                class="text-gray-300 dark:text-gray-600"
                >·</span
              >
              <span>{{ formatDate(doc.uploadedAt) }}</span>
              <span class="text-gray-300 dark:text-gray-600">·</span>
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
            title="Télécharger"
            @click="downloadDocument(doc.id, doc.fileName)"
          >
            <Download class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- pagination -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex items-center justify-center gap-2 pt-4"
    >
      <UiButton
        size="sm"
        variant="outline"
        :disabled="pagination.page <= 1"
        @click="fetchDocuments(pagination.page - 1)"
      >
        Précédent
      </UiButton>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        Page {{ pagination.page }} / {{ pagination.totalPages }}
      </span>
      <UiButton
        size="sm"
        variant="outline"
        :disabled="pagination.page >= pagination.totalPages"
        @click="fetchDocuments(pagination.page + 1)"
      >
        Suivant
      </UiButton>
    </div>

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
                title="Télécharger"
                @click="
                  viewerDoc &&
                  downloadDocument(viewerDoc.id, viewerDoc.fileName)
                "
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
  Search,
  X,
  LayoutGrid,
  List,
  FileText,
  Download,
  Eye,
  Pill,
  TestTubes,
  FileSearch,
  Award,
  FolderOpen,
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
  layout: "patient",
  middleware: "patient-only",
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

type TabKey = "all" | "prescriptions" | "exams" | "certificates" | "others";

const tabs: { key: TabKey; label: string; icon: Component }[] = [
  { key: "all", label: "Tous", icon: FolderOpen },
  { key: "prescriptions", label: "Ordonnances", icon: Pill },
  { key: "exams", label: "Examens", icon: TestTubes },
  { key: "certificates", label: "Certificats", icon: Award },
  { key: "others", label: "Autres", icon: FileText },
];

const activeTab = ref<TabKey>("all");
const viewMode = ref<"card" | "list">("card");
const searchQuery = ref("");
const loading = ref(true);

interface DocItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  practitioner: {
    firstName: string;
    lastName: string;
    title: string;
  } | null;
}

const documents = ref<DocItem[]>([]);
const counts = ref({
  all: 0,
  prescriptions: 0,
  exams: 0,
  certificates: 0,
  others: 0,
});
const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
});

// PDF Viewer
const showViewer = ref(false);
const viewerDoc = ref<DocItem | null>(null);
const viewerUrl = ref("");

const getTabCount = (key: TabKey) => counts.value[key] ?? 0;

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

const fetchDocuments = async (page = 1) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pagination.limit),
      type: activeTab.value,
    });
    if (searchQuery.value) {
      params.set("search", searchQuery.value);
    }

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DocItem[];
      counts: typeof counts.value;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/documents/received?${params.toString()}`);

    if (response.success) {
      documents.value = response.data;
      counts.value = response.counts;
      Object.assign(pagination, response.pagination);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
  } finally {
    loading.value = false;
  }
};

const switchTab = (tab: TabKey) => {
  activeTab.value = tab;
  fetchDocuments(1);
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchDocuments(1);
  }, 400);
};

const clearSearch = () => {
  searchQuery.value = "";
  fetchDocuments(1);
};

const downloadDocument = async (docId: string, fileName: string) => {
  try {
    const url = `${config.public.apiBase}/documents/${docId}/download`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` },
    });
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading document:", error);
    alert("Erreur lors du téléchargement du document");
  }
};

const viewDocument = (doc: DocItem) => {
  viewerDoc.value = doc;
  viewerUrl.value = `${config.public.apiBase}/documents/${doc.id}/view`;

  // for authenticated view, create blob url
  // blob url means the file will loaded in memory and not cached by browser
  // so  will be deleted when revoked or page closed
  fetch(viewerUrl.value, {
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

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchDocuments();
  } else {
    loading.value = false;
  }
});
</script>
