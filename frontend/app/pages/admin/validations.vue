<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900">
      Demandes d'inscription professionnelle
    </h1>
    <p class="mb-6 text-gray-600">
      Gérez les demandes d'inscription des praticiens et cabinets
    </p>

    <div class="mb-6 border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          class="whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors"
          :class="
            activeTab === 'pending'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          "
          @click="activeTab = 'pending'"
        >
          En attente
          <span
            v-if="pendingCount > 0"
            class="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
          >
            {{ pendingCount }}
          </span>
        </button>
        <button
          class="whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors"
          :class="
            activeTab === 'approved'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          "
          @click="activeTab = 'approved'"
        >
          Approuvés
        </button>
        <button
          class="whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors"
          :class="
            activeTab === 'rejected'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          "
          @click="activeTab = 'rejected'"
        >
          Rejetés
        </button>
      </nav>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-4">
      <select
        v-model="filterType"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Tous les types</option>
        <option value="PRACTITIONER">Praticien</option>
        <option value="CABINET">Cabinet</option>
      </select>
      <input
        v-model="filterSpecialty"
        type="text"
        placeholder="Filtrer par spécialité..."
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <button
        class="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
        @click="
          filterType = '';
          filterSpecialty = '';
        "
      >
        Réinitialiser
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 p-4 text-red-800">
      {{ fetchError }}
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Nom
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Type
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Spécialité / Cabinet
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Date de soumission
            </th>
            <th
              v-if="activeTab !== 'pending'"
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Date de traitement
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="filteredRequests.length === 0">
            <td
              :colspan="activeTab !== 'pending' ? 6 : 5"
              class="px-6 py-8 text-center text-gray-500"
            >
              Aucune demande trouvée
            </td>
          </tr>
          <tr
            v-for="req in filteredRequests"
            :key="req.id"
            class="hover:bg-gray-50"
          >
            <td class="whitespace-nowrap px-6 py-4">
              <div class="font-medium text-gray-900">
                {{ req.firstName }} {{ req.lastName }}
              </div>
              <div class="text-sm text-gray-500">{{ req.email }}</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="
                  req.requestType === 'PRACTITIONER'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-purple-100 text-purple-800'
                "
              >
                {{
                  req.requestType === "PRACTITIONER" ? "Praticien" : "Cabinet"
                }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
              {{
                req.requestType === "PRACTITIONER"
                  ? req.specialty || "-"
                  : req.cabinetName || "-"
              }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
              {{ formatDate(req.createdAt) }}
            </td>
            <td
              v-if="activeTab !== 'pending'"
              class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
            >
              {{ req.processedAt ? formatDate(req.processedAt) : "-" }}
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="flex items-center gap-2">
                <button
                  class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  @click="viewDetails(req)"
                >
                  Détails
                </button>
                <template v-if="activeTab === 'pending'">
                  <button
                    class="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                    :disabled="processingId === req.id"
                    @click="approveRequest(req.id)"
                  >
                    {{ processingId === req.id ? "..." : "Approuver" }}
                  </button>
                  <button
                    class="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                    @click="openRejectModal(req)"
                  >
                    Rejeter
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- details modal -->
    <div
      v-if="showDetailsModal && selectedRequest"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showDetailsModal = false"
    >
      <div
        class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Détails de la demande</h2>
          <button
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="showDetailsModal = false"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <span class="text-sm font-medium text-gray-500">Nom</span>
              <p class="text-gray-900">
                {{ selectedRequest.firstName }} {{ selectedRequest.lastName }}
              </p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Type</span>
              <p class="text-gray-900">
                {{
                  selectedRequest.requestType === "PRACTITIONER"
                    ? "Praticien"
                    : "Cabinet"
                }}
              </p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Email</span>
              <p class="text-gray-900">{{ selectedRequest.email }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Téléphone</span>
              <p class="text-gray-900">{{ selectedRequest.phone }}</p>
            </div>
          </div>

          <!-- practitioner fields -->
          <template v-if="selectedRequest.requestType === 'PRACTITIONER'">
            <div class="border-t pt-4">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                Informations professionnelles
              </h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <span class="text-sm font-medium text-gray-500"
                    >N° d'Ordre (ONMCI)</span
                  >
                  <p class="text-gray-900">
                    {{ selectedRequest.orderNumber || "-" }}
                  </p>
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-500"
                    >Spécialité</span
                  >
                  <p class="text-gray-900">
                    {{ selectedRequest.specialty || "-" }}
                  </p>
                </div>
                <div class="md:col-span-2">
                  <span class="text-sm font-medium text-gray-500"
                    >Adresse du cabinet</span
                  >
                  <p class="text-gray-900">
                    {{ selectedRequest.clinicAddress || "-" }}
                  </p>
                </div>
              </div>
            </div>
            <div class="border-t pt-4">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                Documents
              </h3>
              <div class="space-y-2">
                <div
                  v-if="selectedRequest.identityDocumentPath"
                  class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span class="text-sm text-gray-700"
                    >Carte d'identité / Passeport</span
                  >
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    @click="
                      downloadDocument(
                        selectedRequest.id,
                        'identityDocumentPath',
                      )
                    "
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Télécharger
                  </button>
                </div>
                <div
                  v-if="selectedRequest.diplomaPath"
                  class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span class="text-sm text-gray-700">Diplôme d'État</span>
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    @click="downloadDocument(selectedRequest.id, 'diplomaPath')"
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Télécharger
                  </button>
                </div>
                <div
                  v-if="selectedRequest.orderAttestationPath"
                  class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span class="text-sm text-gray-700"
                    >Attestation de l'Ordre</span
                  >
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    @click="
                      downloadDocument(
                        selectedRequest.id,
                        'orderAttestationPath',
                      )
                    "
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- cabinet fields -->
          <template v-if="selectedRequest.requestType === 'CABINET'">
            <div class="border-t pt-4">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                Informations du cabinet
              </h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <span class="text-sm font-medium text-gray-500"
                    >Nom du cabinet</span
                  >
                  <p class="text-gray-900">
                    {{ selectedRequest.cabinetName || "-" }}
                  </p>
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-500">RCCM</span>
                  <p class="text-gray-900">
                    {{ selectedRequest.cabinetRccm || "-" }}
                  </p>
                </div>
                <div class="md:col-span-2">
                  <span class="text-sm font-medium text-gray-500">Adresse</span>
                  <p class="text-gray-900">
                    {{ selectedRequest.cabinetAddress || "-" }}
                  </p>
                </div>
              </div>
            </div>
            <div class="border-t pt-4">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">
                Responsable administratif
              </h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <span class="text-sm font-medium text-gray-500">Nom</span>
                  <p class="text-gray-900">
                    {{ selectedRequest.adminContactName || "-" }}
                  </p>
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-500">Email</span>
                  <p class="text-gray-900">
                    {{ selectedRequest.adminContactEmail || "-" }}
                  </p>
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-500"
                    >Téléphone</span
                  >
                  <p class="text-gray-900">
                    {{ selectedRequest.adminContactPhone || "-" }}
                  </p>
                </div>
              </div>
            </div>
            <div class="border-t pt-4">
              <h3 class="mb-3 text-lg font-semibold text-gray-900">Document</h3>
              <div
                v-if="selectedRequest.cabinetRegDocPath"
                class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span class="text-sm text-gray-700"
                  >RCCM / Document d'enregistrement</span
                >
                <button
                  type="button"
                  class="flex items-center gap-1 rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  @click="
                    downloadDocument(selectedRequest.id, 'cabinetRegDocPath')
                  "
                >
                  <svg
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Télécharger
                </button>
              </div>
            </div>
          </template>

          <!-- rejection reason  -->
          <div
            v-if="
              selectedRequest.status === 'REJECTED' &&
              selectedRequest.rejectionReason
            "
            class="border-t pt-4"
          >
            <h3 class="mb-2 text-lg font-semibold text-red-700">
              Motif du rejet
            </h3>
            <p class="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {{ selectedRequest.rejectionReason }}
            </p>
          </div>

          <div class="border-t pt-4 text-sm text-gray-500">
            <p>Soumis le {{ formatDate(selectedRequest.createdAt) }}</p>
            <p v-if="selectedRequest.processedAt">
              Traité le {{ formatDate(selectedRequest.processedAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- reject modal -->
    <div
      v-if="showRejectModal && rejectTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showRejectModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-xl font-bold text-gray-900">Rejeter la demande</h2>
        <p class="mb-4 text-sm text-gray-600">
          Demande de
          <strong
            >{{ rejectTarget.firstName }} {{ rejectTarget.lastName }}</strong
          >
        </p>
        <form @submit.prevent="submitReject">
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              Motif du rejet *
              <span class="text-gray-400">(min. 10 caractères)</span>
            </label>
            <textarea
              v-model="rejectionReason"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Expliquez la raison du rejet..."
              required
              minlength="10"
            />
          </div>
          <div
            v-if="rejectError"
            class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {{ rejectError }}
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="showRejectModal = false"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="processingId === rejectTarget.id"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {{
                processingId === rejectTarget.id
                  ? "En cours..."
                  : "Confirmer le rejet"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- success toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

interface ContactRequest {
  id: string;
  requestType: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty?: string | null;
  cabinetName?: string | null;
  cabinetAddress?: string | null;
  cabinetRccm?: string | null;
  adminContactName?: string | null;
  adminContactEmail?: string | null;
  adminContactPhone?: string | null;
  orderNumber?: string | null;
  clinicAddress?: string | null;
  identityDocumentPath?: string | null;
  diplomaPath?: string | null;
  orderAttestationPath?: string | null;
  cabinetRegDocPath?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

const activeTab = ref<"pending" | "approved" | "rejected">("pending");
const filterType = ref("");
const filterSpecialty = ref("");
const loading = ref(true);
const fetchError = ref("");
const requests = ref<ContactRequest[]>([]);
const pendingCount = ref(0);
const processingId = ref<string | null>(null);
const toastMessage = ref("");

const showDetailsModal = ref(false);
const selectedRequest = ref<ContactRequest | null>(null);

const showRejectModal = ref(false);
const rejectTarget = ref<ContactRequest | null>(null);
const rejectionReason = ref("");
const rejectError = ref("");

const filteredRequests = computed(() => {
  let statusFilter: string;
  if (activeTab.value === "pending") statusFilter = "PENDING";
  else if (activeTab.value === "approved") statusFilter = "APPROVED";
  else statusFilter = "REJECTED";

  let list = requests.value.filter((r) => r.status === statusFilter);

  // show only practitioner and cabinet types (not other = demo/info/support)
  list = list.filter(
    (r) => r.requestType === "PRACTITIONER" || r.requestType === "CABINET",
  );

  if (filterType.value) {
    list = list.filter((r) => r.requestType === filterType.value);
  }

  if (filterSpecialty.value) {
    const search = filterSpecialty.value.toLowerCase();
    list = list.filter((r) => {
      const field =
        r.requestType === "PRACTITIONER" ? r.specialty : r.cabinetName;
      return field?.toLowerCase().includes(search);
    });
  }

  return list;
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function viewDetails(req: ContactRequest) {
  selectedRequest.value = req;
  showDetailsModal.value = true;
}

function openRejectModal(req: ContactRequest) {
  rejectTarget.value = req;
  rejectionReason.value = "";
  rejectError.value = "";
  showRejectModal.value = true;
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function fetchRequests() {
  loading.value = true;
  fetchError.value = "";

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ContactRequest[];
    }>("/contact-requests");
    requests.value = response.data || [];
    pendingCount.value = requests.value.filter(
      (r) =>
        r.status === "PENDING" &&
        (r.requestType === "PRACTITIONER" || r.requestType === "CABINET"),
    ).length;
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des demandes";
  } finally {
    loading.value = false;
  }
}

async function approveRequest(id: string) {
  processingId.value = id;
  try {
    await useAuthenticatedFetch(`/contact-requests/${id}/approve`, {
      method: "POST",
    });
    showToast("Demande approuvée - compte créé et email envoyé");
    await fetchRequests();
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    showToast(err?.data?.message || "Erreur lors de l'approbation");
  } finally {
    processingId.value = null;
  }
}

async function submitReject() {
  if (!rejectTarget.value) return;
  if (rejectionReason.value.length < 10) {
    rejectError.value = "Le motif doit contenir au moins 10 caractères.";
    return;
  }

  processingId.value = rejectTarget.value.id;
  rejectError.value = "";

  try {
    await useAuthenticatedFetch(
      `/contact-requests/${rejectTarget.value.id}/reject`,
      {
        method: "POST",
        body: { rejectionReason: rejectionReason.value },
      },
    );
    showRejectModal.value = false;
    showToast("Demande rejetée - email de notification envoyé");
    await fetchRequests();
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    rejectError.value = err?.data?.message || "Erreur lors du rejet";
  } finally {
    processingId.value = null;
  }
}

onMounted(() => {
  fetchRequests();
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

function downloadDocument(requestId: string, field: string) {
  const token = authStore.accessToken;
  const base = (config.public.apiBase as string).replace(/\/$/, "");
  const url = `${base}/contact-requests/${requestId}/documents/${field}?token=${encodeURIComponent(token ?? "")}`;
  window.open(url, "_blank", "noopener");
}
</script>
