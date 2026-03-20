<template>
  <div class="space-y-6">
    <div
      class="flex flex-col justify-between gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div class="flex flex-1 flex-col gap-4 sm:flex-row">
        <div class="w-full sm:w-64">
          <label class="mb-1 block text-xs font-medium text-gray-500"
            >Rechercher un patient</label
          >
          <UiInput
            v-model="filters.search"
            placeholder="Nom du patient..."
            class="w-full"
            @input="handleSearch"
          />
        </div>
        <div class="w-full sm:w-48">
          <label class="mb-1 block text-xs font-medium text-gray-500"
            >Statut</label
          >
          <select
            v-model="filters.status"
            @change="fetchInvoices(1)"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="COMPLETED">Payé</option>
            <option value="PENDING">En attente</option>
            <option value="REFUNDED">Remboursé</option>
          </select>
        </div>
      </div>
      <div>
        <UiButton class="w-full sm:w-auto" @click="openCreateInvoiceModal">
          Créer une facture
        </UiButton>
      </div>
    </div>

    <UiCard class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                N° Facture
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Patient
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Type
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Montant
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Statut
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-if="loading" class="animate-pulse">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                Chargement des factures...
              </td>
            </tr>
            <tr v-else-if="invoices.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                Aucune facture trouvée.
              </td>
            </tr>
            <tr
              v-for="invoice in invoices"
              :key="invoice.id"
              class="hover:bg-gray-50"
            >
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{
                  new Date(invoice.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
              >
                {{ invoice.invoiceNumber }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ invoice.patientName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{
                  invoice.appointmentType === "TELECONSULTATION"
                    ? "Téléconsultation"
                    : "Cabinet"
                }}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
              >
                {{ invoice.amount.toLocaleString("fr-FR") }}
                {{ invoice.currency }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  :class="getStatusClass(invoice.status)"
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                >
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
              >
                <button
                  v-if="invoice.invoice"
                  @click="
                    downloadPdf(invoice.invoice.id, invoice.invoiceNumber)
                  "
                  class="text-orange-600 hover:text-orange-600 focus:outline-none"
                  title="Télécharger"
                >
                  <Download class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
      >
        <div
          class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm text-gray-700">
              Affichage de la page
              <span class="font-medium">{{ currentPage }}</span> sur
              <span class="font-medium">{{ totalPages }}</span>
            </p>
          </div>
          <div>
            <nav
              class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                @click="fetchInvoices(currentPage - 1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span class="sr-only">Précédent</span>
                <ChevronLeft class="h-5 w-5" />
              </button>
              <button
                @click="fetchInvoices(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span class="sr-only">Suivant</span>
                <ChevronRight class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- create invoice modal (select unpaid appointment) -->
    <Teleport to="body">
      <div
        v-if="showSelectAppointmentModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showSelectAppointmentModal = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            Sélectionner un rendez-vous à facturer
          </h3>

          <div
            v-if="loadingAppointments"
            class="animate-pulse py-10 text-center text-sm text-gray-500"
          >
            Chargement des rendez-vous...
          </div>
          <div
            v-else-if="unpaidAppointments.length === 0"
            class="py-10 text-center text-sm text-gray-500"
          >
            Aucun rendez-vous en attente de facturation.
          </div>
          <div v-else class="max-h-96 space-y-3 overflow-y-auto">
            <button
              v-for="apt in unpaidAppointments"
              :key="apt.id"
              class="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-orange-500 hover:bg-orange-50"
              @click="proceedToInvoiceDetails(apt)"
            >
              <div>
                <p class="font-medium text-gray-900">
                  {{ apt.patient.firstName }} {{ apt.patient.lastName }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>{{
                    new Date(apt.appointmentDate).toLocaleDateString("fr-FR")
                  }}</span>
                  <span>à {{ apt.startTime }}</span>
                </div>
              </div>
              <div class="text-xs">
                <span
                  class="inline-flex rounded-full bg-gray-100 px-2 font-semibold text-gray-800"
                >
                  {{
                    apt.type === "TELECONSULTATION"
                      ? "Téléconsultation"
                      : "Cabinet"
                  }}
                </span>
                <span
                  v-if="apt.status === 'COMPLETED'"
                  class="ml-2 inline-flex rounded-full bg-green-100 px-2 font-semibold text-green-800"
                  >Terminé</span
                >
                <span
                  v-else
                  class="ml-2 inline-flex rounded-full bg-orange-100 px-2 font-semibold text-orange-800"
                  >Passé</span
                >
              </div>
            </button>
          </div>

          <div class="mt-6 flex justify-end">
            <UiButton
              variant="outline"
              @click="showSelectAppointmentModal = false"
            >
              Fermer
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- create invoice details modal -->
    <CreateInvoiceModal
      :is-open="showInvoiceDetailsModal"
      :appointment="selectedAppointment"
      :practitioner-id="practitionerId"
      @close="showInvoiceDetailsModal = false"
      @success="onInvoiceCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Download, ChevronLeft, ChevronRight } from "lucide-vue-next";
import CreateInvoiceModal from "./CreateInvoiceModal.vue";

const props = defineProps<{
  practitionerId?: string;
}>();

const loading = ref(true);
const invoices = ref<any[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
let searchTimeout: any = null;

const showSelectAppointmentModal = ref(false);
const loadingAppointments = ref(false);
const unpaidAppointments = ref<any[]>([]);

const showInvoiceDetailsModal = ref(false);
const selectedAppointment = ref<any>(null);

const filters = ref({
  search: "",
  status: "all",
});

const fetchInvoices = async (page = 1) => {
  try {
    loading.value = true;
    currentPage.value = page;

    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      status: filters.value.status,
    });

    if (filters.value.search) {
      query.append("search", filters.value.search);
    }
    if (props.practitionerId) {
      query.append("practitionerId", props.practitionerId);
    }

    const {
      data,
      total,
      totalPages: pages,
    } = await useAuthenticatedFetch<any>(
      `/payments/practitioner/invoices?${query.toString()}`,
    );
    invoices.value = data;
    totalItems.value = total;
    totalPages.value = pages;
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchInvoices(1);
  }, 500);
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "REFUNDED":
      return "bg-gray-100 text-gray-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Payé";
    case "PENDING":
      return "En attente";
    case "REFUNDED":
      return "Remboursé";
    case "FAILED":
      return "Échoué";
    case "CANCELLED":
      return "Annulé";
    default:
      return status;
  }
};

const openCreateInvoiceModal = async () => {
  showSelectAppointmentModal.value = true;
  loadingAppointments.value = true;
  unpaidAppointments.value = [];

  try {
    const query = new URLSearchParams()
    if (props.practitionerId) {
      query.append('practitionerId', props.practitionerId)
    }
    
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any[];
    }>(`/payments/practitioner/unpaid-appointments?${query.toString()}`);
    if (response.success) {
      unpaidAppointments.value = response.data;
    }
  } catch (error) {
    console.error("Failed to load unpaid appointments:", error);
  } finally {
    loadingAppointments.value = false;
  }
};

const proceedToInvoiceDetails = (appointment: any) => {
  selectedAppointment.value = appointment;
  showSelectAppointmentModal.value = false;
  showInvoiceDetailsModal.value = true;
};

const onInvoiceCreated = (invoice: any) => {
  showInvoiceDetailsModal.value = false;
  // refresh the list immediately
  fetchInvoices(1);
};

const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
  try {
    const query = new URLSearchParams()
    if (props.practitionerId) {
      query.append('practitionerId', props.practitionerId)
    }

    const response = await useAuthenticatedFetch<Blob>(
      `/payments/practitioner/invoices/${invoiceId}/download?${query.toString()}`,
      {
        responseType: "blob",
      },
    );

    // create blob from binary in response with file type detail to triger download
    const url = window.URL.createObjectURL(
      new Blob([response as Blob], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `facture-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Erreur lors du téléchargement de la facture");
  }
};

watch(() => props.practitionerId, () => {
  fetchInvoices(1);
});

onMounted(() => {
  fetchInvoices(1);
});
</script>
