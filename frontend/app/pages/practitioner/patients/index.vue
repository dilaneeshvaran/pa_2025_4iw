<template>
  <div class="space-y-6">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="mb-1 text-2xl font-bold text-gray-900">Patients</h1>
        <p class="text-gray-600">
          {{
            loading
              ? "Chargement..."
              : `${total} patient${total !== 1 ? "s" : ""}`
          }}
        </p>
      </div>
      <!-- view changer -->
      <div
        class="flex items-center gap-2 rounded-lg border border-gray-200 p-1"
      >
        <button
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'card'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100',
          ]"
          @click="viewMode = 'card'"
        >
          <LayoutGrid class="h-4 w-4" />
          Cartes
        </button>
        <button
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'list'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100',
          ]"
          @click="viewMode = 'list'"
        >
          <List class="h-4 w-4" />
          Liste
        </button>
      </div>
    </div>

    <UiCard>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >Rechercher</label
          >
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom, téléphone ou email..."
              class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              @input="debouncedSearch"
            />
            <button
              v-if="searchQuery"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
              @click="clearSearch"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="w-full lg:w-48">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >Filtre</label
          >
          <select
            v-model="filterValue"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="resetAndFetch"
          >
            <option value="all">Tous les patients</option>
            <option value="new">Nouveaux patients</option>
            <option value="withUpcoming">Avec RDV à venir</option>
            <option value="withoutUpcoming">Sans RDV à venir</option>
          </select>
        </div>

        <div class="w-full lg:w-40">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >Genre</label
          >
          <select
            v-model="genderFilter"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="resetAndFetch"
          >
            <option value="">Tous</option>
            <option value="MALE">Homme</option>
            <option value="FEMALE">Femme</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div class="w-full lg:w-52">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >Trier par</label
          >
          <select
            v-model="sortValue"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            @change="resetAndFetch"
          >
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
            <option value="lastVisit-desc">Dernière visite (récente)</option>
            <option value="lastVisit-asc">Dernière visite (ancienne)</option>
            <option value="nextAppointment-asc">Prochain RDV (proche)</option>
            <option value="totalConsultations-desc">
              Consultations (plus)
            </option>
            <option value="totalConsultations-asc">
              Consultations (moins)
            </option>
          </select>
        </div>
      </div>
    </UiCard>

    <!-- loading -->
    <div v-if="loading" class="space-y-4">
      <div
        v-if="viewMode === 'card'"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="animate-pulse rounded-lg border border-gray-200 bg-white p-5"
        >
          <div class="mb-4 flex items-center gap-3">
            <div class="h-12 w-12 rounded-full bg-gray-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-2/3 rounded bg-gray-200" />
              <div class="h-3 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
          <div class="h-3 w-full rounded bg-gray-200" />
          <div class="mt-4 flex gap-2">
            <div class="h-8 w-20 rounded bg-gray-200" />
            <div class="h-8 w-20 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div v-else class="animate-pulse space-y-2">
        <div
          v-for="i in 6"
          :key="i"
          class="h-16 rounded-lg border border-gray-200 bg-white"
        />
      </div>
    </div>

    <!-- empty state -->
    <UiCard v-else-if="patients.length === 0">
      <div class="py-12 text-center">
        <Users class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p class="text-lg font-medium text-gray-900">Aucun patient trouvé</p>
        <p class="mt-1 text-gray-500">
          {{
            searchQuery || filterValue !== "all" || genderFilter
              ? "Essayez de modifier vos filtres de recherche"
              : "Vos patients apparaîtront ici après leur premier rendez-vous"
          }}
        </p>
      </div>
    </UiCard>

    <!-- card view -->
    <div
      v-else-if="viewMode === 'card'"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="patient in patients"
        :key="patient.id"
        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
        @click="openPatientDetail(patient.id)"
      >
        <div class="mb-3 flex items-start gap-3">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
          >
            <span class="text-sm font-semibold text-orange-600">
              {{ patient.firstName.charAt(0) }}{{ patient.lastName.charAt(0) }}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-semibold text-gray-900">
                {{ patient.firstName }} {{ patient.lastName }}
              </p>
              <UiBadge
                v-if="patient.isNew"
                variant="success"
                class-name="text-xs"
              >
                Nouveau
              </UiBadge>
            </div>
            <p class="text-sm text-gray-500">
              {{ getAge(patient.dateOfBirth) }} ans
            </p>
          </div>
        </div>

        <div class="mb-4 rounded-md bg-gray-50 px-3 py-2">
          <div
            v-if="patient.nextAppointment"
            class="flex items-center gap-2 text-sm"
          >
            <Calendar class="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
            <span class="text-gray-700">
              Prochain :
              {{ formatShortDate(patient.nextAppointment.appointmentDate) }},
              {{ patient.nextAppointment.startTime }}
            </span>
          </div>
          <div v-else class="flex items-center gap-2 text-sm text-gray-500">
            <CalendarX class="h-3.5 w-3.5 flex-shrink-0" />
            <span>Aucun RDV prévu</span>
          </div>
        </div>

        <div class="flex gap-2" @click.stop>
          <UiButton
            variant="secondary"
            size="sm"
            @click="
              navigateTo(`/practitioner/patients/${patient.id}/medical-record`)
            "
          >
            <FolderOpen class="mr-1 h-3.5 w-3.5" />
            Dossier
          </UiButton>
          <UiButton
            variant="secondary"
            size="sm"
            @click="goToMessages(patient)"
          >
            <MessageSquare class="mr-1 h-3.5 w-3.5" />
            Message
          </UiButton>
        </div>
      </div>
    </div>

    <!-- list view -->
    <UiCard v-else class="overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Patient
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Âge
              </th>
              <th
                class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell"
              >
                Prochain RDV
              </th>
              <th
                class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell"
              >
                Consultations
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="patient in patients"
              :key="patient.id"
              class="cursor-pointer transition-colors hover:bg-gray-50"
              @click="openPatientDetail(patient.id)"
            >
              <td class="whitespace-nowrap px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
                  >
                    <span class="text-xs font-semibold text-orange-600">
                      {{ patient.firstName.charAt(0)
                      }}{{ patient.lastName.charAt(0) }}
                    </span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-gray-900">
                        {{ patient.firstName }} {{ patient.lastName }}
                      </p>
                      <UiBadge
                        v-if="patient.isNew"
                        variant="success"
                        class-name="text-xs"
                      >
                        Nouveau
                      </UiBadge>
                    </div>
                    <p class="text-xs text-gray-500">{{ patient.phone }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {{ getAge(patient.dateOfBirth) }} ans
              </td>
              <td class="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                <div
                  v-if="patient.nextAppointment"
                  class="flex items-center gap-1.5 text-sm"
                >
                  <Calendar class="h-3.5 w-3.5 text-orange-500" />
                  <span class="text-gray-700">
                    {{
                      formatShortDate(patient.nextAppointment.appointmentDate)
                    }}, {{ patient.nextAppointment.startTime }}
                  </span>
                </div>
                <span v-else class="text-sm text-gray-500"
                  >Aucun RDV prévu</span
                >
              </td>
              <td class="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                <span class="text-sm text-gray-600">{{
                  patient.totalConsultations
                }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right" @click.stop>
                <div class="flex items-center justify-end gap-2">
                  <UiButton
                    variant="ghost"
                    size="sm"
                    title="Dossier"
                    @click="
                      navigateTo(
                        `/practitioner/patients/${patient.id}/medical-record`,
                      )
                    "
                  >
                    <FolderOpen class="h-4 w-4" />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    title="Message"
                    @click="goToMessages(patient)"
                  >
                    <MessageSquare class="h-4 w-4" />
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <p class="text-sm text-gray-600">
        Page {{ currentPage }} sur {{ totalPages }} - {{ total }} résultat{{
          total !== 1 ? "s" : ""
        }}
      </p>
      <div class="flex gap-2">
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="mr-1 h-4 w-4" />
          Précédent
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Suivant
          <ChevronRight class="ml-1 h-4 w-4" />
        </UiButton>
      </div>
    </div>

    <!-- detail modal -->
    <PatientDetailModal
      :is-open="isModalOpen"
      :patient-id="selectedPatientId"
      @close="closeModal"
      @navigate-dossier="
        (id: string) =>
          navigateTo(`/practitioner/patients/${id}/medical-record`)
      "
      @navigate-message="goToMessageById"
      @navigate-booking="openBooking"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Users,
  Search,
  X,
  LayoutGrid,
  List,
  Calendar,
  CalendarX,
  FolderOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import PatientDetailModal from "~/components/PatientDetailModal.vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

interface AppointmentBrief {
  id: string;
  appointmentDate: string;
  startTime: string;
  type: string;
  status: string;
}

interface PatientItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
  city: string | null;
  bloodType: string | null;
  isNew: boolean;
  firstAppointmentDate: string | null;
  totalConsultations: number;
  nextAppointment: AppointmentBrief | null;
  lastAppointment: AppointmentBrief | null;
}

const viewMode = ref<"card" | "list">("card");
const loading = ref(true);
const patients = ref<PatientItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(0);
const searchQuery = ref("");
const filterValue = ref("all");
const genderFilter = ref("");
const sortValue = ref("name-asc");

const isModalOpen = ref(false);
const selectedPatientId = ref<string | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchPatients();
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = "";
  currentPage.value = 1;
  fetchPatients();
};

const resetAndFetch = () => {
  currentPage.value = 1;
  fetchPatients();
};

const fetchPatients = async () => {
  loading.value = true;
  try {
    const [sortBy = "name", sortOrder = "asc"] = sortValue.value.split("-");
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: "18",
      sortBy: sortBy,
      sortOrder: sortOrder,
      filter: filterValue.value,
    });
    if (searchQuery.value.trim()) {
      params.set("search", searchQuery.value.trim());
    }
    if (genderFilter.value) {
      params.set("gender", genderFilter.value);
    }

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        patients: PatientItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/practitioner/patients?${params.toString()}`);

    if (response.success) {
      patients.value = response.data.patients;
      total.value = response.data.total;
      totalPages.value = response.data.totalPages;
      currentPage.value = response.data.page;
    }
  } catch (error) {
    console.error("Error fetching patients:", error);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
  fetchPatients();
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

const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const openPatientDetail = (patientId: string) => {
  selectedPatientId.value = patientId;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedPatientId.value = null;
};

const goToMessages = (_patient: PatientItem) => {
  navigateTo("/practitioner/messages");
};

const goToMessageById = (_patientId: string) => {
  navigateTo("/practitioner/messages");
};

const openBooking = (_patientId: string) => {
  navigateTo("/practitioner/agenda");
};

onMounted(() => {
  fetchPatients();
});
</script>
