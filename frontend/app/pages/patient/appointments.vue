<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
      <p class="text-gray-600">Consultez et gérez vos rendez-vous</p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            :class="[
              'ml-2 rounded-full px-2 py-0.5 text-xs',
              activeTab === tab.key
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- normal appointment -->
    <div>
      <!-- search & sort bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="relative flex-1 sm:max-w-sm">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom ou spécialité..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <button
          @click="toggleSort"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowUpDown class="h-4 w-4" />
          {{ sortOrder === "desc" ? "Plus récents" : "Plus anciens" }}
        </button>
      </div>

      <!-- loading -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border bg-white p-6"
        >
          <div class="flex gap-4">
            <div class="h-16 w-16 rounded-full bg-gray-200"></div>
            <div class="flex-1 space-y-3">
              <div class="h-4 w-1/3 rounded bg-gray-200"></div>
              <div class="h-3 w-1/4 rounded bg-gray-200"></div>
              <div class="h-3 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- empty state -->
      <div
        v-else-if="currentAppointments.length === 0"
        class="rounded-lg border bg-white py-16 text-center"
      >
        <Calendar class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 class="mb-2 text-lg font-medium text-gray-900">
          {{ emptyMessages[activeTab].title }}
        </h3>
        <p class="mb-6 text-gray-500">
          {{ emptyMessages[activeTab].description }}
        </p>
        <UiButton
          v-if="activeTab === 'upcoming'"
          @click="navigateTo('/search')"
        >
          Prendre un rendez-vous
        </UiButton>
      </div>

      <!-- appointment list -->
      <div v-else class="space-y-4">
        <div
          v-for="apt in currentAppointments"
          :key="apt.id"
          class="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- Doctor photo -->
              <UiImageWithFallback
                :src="apt.practitioner.photo || ''"
                :alt="`${apt.practitioner.title} ${apt.practitioner.firstName} ${apt.practitioner.lastName}`"
                class-name="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />

              <!-- appointment info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ apt.practitioner.title }}
                      {{ apt.practitioner.firstName }}
                      {{ apt.practitioner.lastName }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {{ apt.practitioner.specialty || "Médecine générale" }}
                    </p>
                  </div>
                  <UiBadge :variant="getStatusVariant(apt.status)">
                    {{ getStatusLabel(apt.status) }}
                  </UiBadge>
                </div>

                <div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-4 w-4 text-gray-400" />
                    <span>{{ formatDate(apt.appointmentDate) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Clock class="h-4 w-4 text-gray-400" />
                    <span>{{ apt.startTime }} - {{ apt.endTime }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <component
                      :is="apt.type === 'TELECONSULTATION' ? Video : MapPin"
                      class="h-4 w-4 text-gray-400"
                    />
                    <span>{{
                      apt.type === "TELECONSULTATION"
                        ? "Téléconsultation"
                        : "En cabinet"
                    }}</span>
                  </div>
                </div>

                <!-- address for in person -->
                <div
                  v-if="apt.type === 'IN_PERSON' && (apt.cabinet?.address || apt.practitioner.address)"
                  class="mt-2 flex items-start gap-1.5 text-sm text-gray-500"
                >
                  <MapPin class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>
                    {{ apt.cabinet?.address || apt.practitioner.address }}
                    <template v-if="apt.cabinet?.city || apt.practitioner.city"
                      >, {{ apt.cabinet?.city || apt.practitioner.city }}</template
                    >
                    <span v-if="apt.cabinet" class="ml-1 text-xs font-medium text-orange-600">({{ apt.cabinet.name }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- action  -->
          <div
            v-if="getActions(apt).length > 0"
            class="flex gap-3 rounded-b-lg border-t bg-gray-50 px-6 py-3"
          >
            <UiButton
              v-if="isBefore48h(apt)"
              variant="secondary"
              size="sm"
              :disabled="togglingAlertMap[apt.id]"
              :class-name="apt.earlierSlotAlertEnabled ? '!bg-orange-50 !text-orange-600 border !border-orange-200 !hover:bg-orange-100' : 'text-gray-600 hover:bg-gray-100'"
              @click="toggleEarlierSlotAlert(apt)"
            >
              <Bell class="mr-1.5 h-4 w-4" :class="{ 'fill-orange-600': apt.earlierSlotAlertEnabled }" />
              {{ apt.earlierSlotAlertEnabled ? "Alerte activée" : "M'avertir si plus proche" }}
            </UiButton>
            <div class="group relative">
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="!canModify(apt)"
                @click="handleModifyClick(apt)"
              >
                <Pencil class="mr-1.5 h-4 w-4" />
                Modifier
              </UiButton>
              <div
                v-if="!canModify(apt)"
                class="pointer-events-none invisible absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:visible group-hover:opacity-100"
              >
                <div class="relative">
                  Vous pouvez modifier uniquement 24h avant
                  <div
                    class="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                  ></div>
                </div>
              </div>
            </div>
            <UiButton
              v-if="canCancel(apt)"
              variant="danger"
              size="sm"
              @click="openCancelModal(apt)"
            >
              <X class="mr-1.5 h-4 w-4" />
              Annuler
            </UiButton>
            <UiButton
              v-if="canJoin(apt)"
              size="sm"
              @click="joinTeleconsultation(apt)"
            >
              <Video class="mr-1.5 h-4 w-4" />
              Rejoindre
            </UiButton>
            <UiButton
              v-if="canReview(apt)"
              variant="secondary"
              size="sm"
              @click="openReviewModal(apt)"
            >
              <Star class="mr-1.5 h-4 w-4" />
              Laisser un avis
            </UiButton>
            <div
              v-if="apt.review"
              class="flex items-center gap-1 text-sm text-gray-500"
            >
              <span>Votre avis :</span>
              <span class="flex">
                <Star
                  v-for="i in 5"
                  :key="i"
                  class="h-4 w-4"
                  :class="i <= apt.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="pagination.totalPages > 1"
          class="flex items-center justify-center gap-2 pt-4"
        >
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            Précédent
          </UiButton>
          <span class="px-3 text-sm text-gray-600">
            Page {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showPreCallChecks"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showPreCallChecks = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Test caméra et microphone
            </h3>
            <button
              @click="showPreCallChecks = false"
              class="rounded-lg p-1 hover:bg-gray-100"
            >
              <X class="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div class="overflow-hidden rounded-lg bg-black">
              <video
                ref="preCallVideoRef"
                autoplay
                muted
                playsinline
                class="h-48 w-full object-cover"
              />
            </div>
            <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  :style="{ width: micLevel + '%' }"
                  class="h-full rounded-full bg-green-500 transition-all"
                />
              </div>
              <span class="text-xs text-gray-500">Volume micro</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallStatus.camera
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Camera
                  :class="
                    preCallStatus.camera ? 'text-green-600' : 'text-red-600'
                  "
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallStatus.camera ? "Caméra OK" : "Caméra indisponible"
                }}</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg border p-3"
                :class="
                  preCallStatus.microphone
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                "
              >
                <Mic
                  :class="
                    preCallStatus.microphone ? 'text-green-600' : 'text-red-600'
                  "
                  class="h-5 w-5"
                />
                <span class="text-sm">{{
                  preCallStatus.microphone ? "Micro OK" : "Micro indisponible"
                }}</span>
              </div>
            </div>
            <div class="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p class="text-sm text-orange-800">
                <strong>Conseil :</strong> Utilisez un casque ou des écouteurs
                pour une meilleure qualité audio.
              </p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <UiButton variant="secondary" @click="stopPreCallTest"
              >Fermer</UiButton
            >
            <UiButton @click="runPreCallTest">Relancer le test</UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- teleconsultation room modal -->
    <Teleport to="body">
      <div
        v-if="showTeleconsultationRoom"
        class="fixed inset-0 z-50 flex flex-col bg-gray-900"
      >
        <TeleconsultationRoom
          :appointment-id="activeRoomAppointmentId!"
          :session="activeSession!"
          @close="closeTeleconsultationRoom"
        />
      </div>
    </Teleport>

    <!-- cancel modal -->
    <Teleport to="body">
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeCancelModal"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Annuler le rendez-vous
            </h3>
          </div>

          <p class="mb-4 text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler votre rendez-vous avec
            <strong>
              {{ selectedAppointment?.practitioner.title }}
              {{ selectedAppointment?.practitioner.firstName }}
              {{ selectedAppointment?.practitioner.lastName }}
            </strong>
            le
            <strong>{{
              formatDate(selectedAppointment?.appointmentDate || "")
            }}</strong>
            à
            <strong>{{ selectedAppointment?.startTime }}</strong> ?
          </p>

          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Raison (optionnelle)
            </label>
            <textarea
              v-model="cancelReason"
              rows="3"
              placeholder="Indiquez la raison de l'annulation..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              class-name="flex-1"
              @click="closeCancelModal"
              :disabled="cancelling"
            >
              Non, garder
            </UiButton>
            <UiButton
              variant="danger"
              class-name="flex-1"
              @click="confirmCancel"
              :disabled="cancelling"
            >
              {{ cancelling ? "Annulation..." : "Oui, annuler" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- review modal -->
    <Teleport to="body">
      <div
        v-if="showReviewModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeReviewModal"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100"
            >
              <Star class="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Laisser un avis
              </h3>
              <p class="text-sm text-gray-500">
                {{ reviewAppointment?.practitioner.title }}
                {{ reviewAppointment?.practitioner.firstName }}
                {{ reviewAppointment?.practitioner.lastName }}
              </p>
            </div>
          </div>

          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              Note *
            </label>
            <div class="flex gap-1">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                class="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none"
                @mouseenter="reviewHover = i"
                @mouseleave="reviewHover = 0"
                @click="reviewRating = i"
              >
                <Star
                  class="h-8 w-8 transition-colors"
                  :class="
                    i <= (reviewHover || reviewRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  "
                />
              </button>
            </div>
          </div>

          <div class="mb-5">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Commentaire (optionnel)
            </label>
            <textarea
              v-model="reviewComment"
              rows="3"
              maxlength="1000"
              placeholder="Partagez votre expérience..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            ></textarea>
            <p class="mt-1 text-right text-xs text-gray-400">
              {{ reviewComment.length }}/1000
            </p>
          </div>

          <p v-if="reviewError" class="mb-3 text-sm text-red-600">
            {{ reviewError }}
          </p>

          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              class-name="flex-1"
              @click="closeReviewModal"
              :disabled="submittingReview"
            >
              Annuler
            </UiButton>
            <UiButton
              class-name="flex-1"
              :disabled="submittingReview || reviewRating === 0"
              @click="submitReview"
            >
              {{ submittingReview ? "Publication..." : "Publier l'avis" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- modify modal -->
    <Teleport to="body">
      <div
        v-if="showModifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="closeModifyModal"
      >
        <div
          class="mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        >
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
            Modifier votre rendez-vous avec
            <strong>
              {{ selectedAppointment?.practitioner.title }}
              {{ selectedAppointment?.practitioner.firstName }}
              {{ selectedAppointment?.practitioner.lastName }}
            </strong>
          </p>

          <!-- loading slots -->
          <div
            v-if="loadingModifySlots"
            class="flex items-center justify-center py-8"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"
            ></div>
            <span class="ml-3 text-sm text-gray-600"
              >Chargement des disponibilités...</span
            >
          </div>

          <!-- available slots -->
          <div
            v-else-if="modifyAvailableSlots.length > 0"
            class="mb-4 space-y-4"
          >
            <!-- date picker -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700"
                >Sélectionnez une date</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="day in modifyAvailableSlots"
                  :key="day.date"
                  type="button"
                  :class="[
                    'rounded-lg border-2 px-3 py-2 text-sm transition-all',
                    modifyDate === day.date
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="selectModifyDate(day.date)"
                >
                  <div class="font-medium">
                    {{ formatModifyDateShort(day.date) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ day.slots.length }} créneaux
                  </div>
                </button>
              </div>
            </div>

            <!-- time picker -->
            <div v-if="modifyDate && modifyDateSlots.length > 0">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Sélectionnez un créneau
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="time in modifyDateSlots"
                  :key="time"
                  type="button"
                  :class="[
                    'rounded-lg border-2 px-4 py-2 text-sm transition-all',
                    modifyTime === time
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="modifyTime = time"
                >
                  {{ time }}
                </button>
              </div>
            </div>
          </div>

          <!-- no slots -->
          <div v-else class="mb-4 py-6 text-center text-gray-500">
            <Calendar class="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p class="text-sm">
              Aucune disponibilité dans les 14 prochains jours
            </p>
          </div>

          <p v-if="modifyError" class="mb-3 text-sm text-red-600">
            {{ modifyError }}
          </p>

          <div class="flex gap-3">
            <UiButton
              variant="secondary"
              class-name="flex-1"
              @click="closeModifyModal"
              :disabled="modifying"
            >
              Annuler
            </UiButton>
            <UiButton
              class-name="flex-1"
              @click="confirmModify"
              :disabled="modifying || !modifyDate || !modifyTime"
            >
              {{ modifying ? "Modification..." : "Confirmer" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Pencil,
  X,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Camera,
  Mic,
  Star,
  Bell,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { formatDateLong as formatDate } from "~/utils/date";
import { getStatusVariant, getStatusLabel } from "~/utils/status";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
});

const authStore = useAuthStore();

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string | null;
  photo: string | null;
  address: string | null;
  city: string | null;
  cancellationNotice?: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason: string | null;
  consultationFee: number;
  earlierSlotAlertEnabled: boolean;
  practitioner: Practitioner;
  cabinet?: {
    id: string;
    name: string;
    address: string;
    city: string | null;
  } | null;
  teleconsultationSession?: {
    id: string;
    roomId: string;
    roomName: string;
    status: string;
    duration: number | null;
    startedAt: string | null;
    endedAt: string | null;
    connectionQuality: string | null;
  } | null;
  review?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

const route = useRoute();
const activeTab = ref<"upcoming" | "past" | "cancelled">("upcoming");
const loading = ref(true);
const appointments = ref<Appointment[]>([]);
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

// sort & search
const sortOrder = ref<"asc" | "desc">("asc");
const searchQuery = ref("");

// tab counts are always visible
const tabCounts = ref<{
  upcoming: number;
  past: number;
  cancelled: number;
  teleconsultations: number;
}>({
  upcoming: 0,
  past: 0,
  cancelled: 0,
  teleconsultations: 0,
});

// review modal
const showReviewModal = ref(false);
const reviewAppointment = ref<Appointment | null>(null);
const reviewRating = ref(0);
const reviewHover = ref(0);
const reviewComment = ref("");
const submittingReview = ref(false);
const reviewError = ref("");

const openReviewModal = (apt: Appointment) => {
  reviewAppointment.value = apt;
  reviewRating.value = apt.review?.rating ?? 0;
  reviewComment.value = apt.review?.comment ?? "";
  reviewError.value = "";
  showReviewModal.value = true;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  reviewAppointment.value = null;
  reviewRating.value = 0;
  reviewHover.value = 0;
  reviewComment.value = "";
  reviewError.value = "";
};

const submitReview = async () => {
  if (!reviewAppointment.value || reviewRating.value === 0) return;
  submittingReview.value = true;
  reviewError.value = "";
  try {
    const tsRestClient = useTsRestClient()
    const response = await tsRestClient.createReview({
      body: {
        appointmentId: reviewAppointment.value.id,
        rating: reviewRating.value,
        comment: reviewComment.value || undefined,
      },
    });

    if (response.status !== 201) {
      throw new Error(response.body.message || "Erreur lors de la publication de l'avis");
    }

    // update local appointment to show the review without refetching
    const idx = appointments.value.findIndex(
      (a) => a.id === reviewAppointment.value!.id
    );
    if (idx !== -1) {
      appointments.value[idx] = {
        ...appointments.value[idx],
        review: {
          id: response.body.data?.id || "",
          rating: reviewRating.value,
          comment: reviewComment.value || null,
          createdAt: new Date().toISOString(),
        },
      };
    }
    closeReviewModal();
  } catch (e: unknown) {
    const fetchErr = e as { data?: { message?: string }; message?: string };
    reviewError.value =
      fetchErr?.data?.message ??
      fetchErr?.message ??
      "Erreur lors de la publication de l'avis";
  } finally {
    submittingReview.value = false;
  }
};

const canReview = (apt: Appointment): boolean =>
  apt.status === "COMPLETED" && !apt.review;

//cancel
const showCancelModal = ref(false);
const selectedAppointment = ref<Appointment | null>(null);
const cancelReason = ref("");
const cancelling = ref(false);

// modify modal
const showModifyModal = ref(false);
const modifyDate = ref("");
const modifyTime = ref("");
const modifyError = ref("");
const modifying = ref(false);
const loadingModifySlots = ref(false);
const modifyAvailableSlots = ref<{ date: string; slots: string[] }[]>([]);

interface AvailableSlotDay {
  date: string;
  slots: string[];
}

const modifyDateSlots = computed(() => {
  const day = modifyAvailableSlots.value.find(
    (d) => d.date === modifyDate.value,
  );
  return day?.slots || [];
});

// teleconsultation state
const loadingTeleconsultations = ref(false);
const upcomingTeleconsultations = ref<Appointment[]>([]);
const pastTeleconsultations = ref<Appointment[]>([]);
const showPreCallChecks = ref(false);
const showTeleconsultationRoom = ref(false);
const activeRoomAppointmentId = ref<string | null>(null);
const activeSession = ref<{
  id: string;
  roomId: string;
  roomName: string;
  status: string;
  duration: number | null;
  startedAt: string | null;
  endedAt: string | null;
  connectionQuality: string | null;
  patient?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  practitioner?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
} | null>(null);
const preCallVideoRef = ref<HTMLVideoElement | null>(null);
const micLevel = ref(0);
const preCallStatus = ref({
  camera: null as boolean | null,
  microphone: null as boolean | null,
  network: null as boolean | null,
  browser: null as boolean | null,
});
let preCallStream: MediaStream | null = null;
let micAnalyserInterval: ReturnType<typeof setInterval> | null = null;

const selectModifyDate = (date: string) => {
  modifyDate.value = date;
  modifyTime.value = "";
};

const formatModifyDateShort = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const tabs = computed(() => [
  {
    key: "upcoming" as const,
    label: "À venir",
    count: tabCounts.value.upcoming,
  },
  {
    key: "past" as const,
    label: "Passés",
    count: tabCounts.value.past,
  },
  {
    key: "cancelled" as const,
    label: "Annulés",
    count: tabCounts.value.cancelled,
  },
]);

const emptyMessages: Record<
  "upcoming" | "past" | "cancelled",
  { title: string; description: string }
> = {
  upcoming: {
    title: "Aucun rendez-vous à venir",
    description:
      "Vous n'avez pas de rendez-vous prévu. Recherchez un praticien pour en prendre un.",
  },
  past: {
    title: "Aucun rendez-vous passé",
    description: "Votre historique de rendez-vous apparaîtra ici.",
  },
  cancelled: {
    title: "Aucun rendez-vous annulé",
    description: "Vos rendez-vous annulés apparaîtront ici.",
  },
};

const currentAppointments = computed(() => {
  if (!searchQuery.value.trim()) return appointments.value;
  const query = searchQuery.value.toLowerCase();
  return appointments.value.filter((apt) => {
    const name =
      `${apt.practitioner.title} ${apt.practitioner.firstName} ${apt.practitioner.lastName}`.toLowerCase();
    const specialty = (apt.practitioner.specialty || "").toLowerCase();
    return name.includes(query) || specialty.includes(query);
  });
});

const toggleSort = () => {
  sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  fetchAppointments(1);
};

const canModify = (apt: Appointment): boolean => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const cancellationNotice = apt.practitioner?.cancellationNotice || 24;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMs = appointmentUTC - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= cancellationNotice;
};

const canCancel = (apt: Appointment): boolean => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  return appointmentUTC > now;
};

const canJoin = (apt: Appointment): boolean => {
  if (apt.type !== "TELECONSULTATION") return false;
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMinutes = (appointmentUTC - now) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60; // 15 min before, up to 1h after start
};


const isBefore48h = (apt: Appointment): boolean => {
  if (
    apt.status === "CANCELLED" ||
    apt.status === "COMPLETED" ||
    apt.status === "NO_SHOW"
  )
    return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMs = appointmentUTC - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 48;
};

const togglingAlertMap = ref<Record<string, boolean>>({});

const toggleEarlierSlotAlert = async (apt: Appointment) => {
  if (togglingAlertMap.value[apt.id]) return;
  togglingAlertMap.value[apt.id] = true;
  const targetState = !apt.earlierSlotAlertEnabled;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Appointment;
      message: string;
    }>(`/appointments/${apt.id}/earlier-slot-alert`, {
      method: "PATCH",
      body: { enabled: targetState },
    });

    if (response.success) {
      apt.earlierSlotAlertEnabled =
        response.data?.earlierSlotAlertEnabled ?? targetState;
    }
  } catch (error: unknown) {
    console.error("Error toggling alert:", error);
    const errorMessage =
      typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { message?: string } }).data?.message ||
          "Erreur lors de la modification de l'alerte"
        : error instanceof Error
          ? error.message
          : "Erreur lors de la modification de l'alerte";
    alert(errorMessage);
  } finally {
    togglingAlertMap.value[apt.id] = false;
  }
};

const getActions = (apt: Appointment): string[] => {
  const actions: string[] = [];
  if (canModify(apt)) actions.push("modify");
  if (canCancel(apt)) actions.push("cancel");
  if (canJoin(apt)) actions.push("join");
  if (canReview(apt)) actions.push("review");
  if (apt.review) actions.push("reviewed");
  return actions;
};

const canJoinTeleconsultation = (apt: Appointment): boolean => {
  if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") return false;
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMinutes = (appointmentUTC - now) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -60;
};

const isTeleconsultationSoon = (apt: Appointment): boolean => {
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const diffMinutes = (appointmentUTC - now) / (1000 * 60);
  return diffMinutes > 15 && diffMinutes <= 120; // within 2 hours but not yet joinable
};

const getTimeUntilJoin = (apt: Appointment): string => {
  const now = Date.now();
  const aptDate = new Date(apt.appointmentDate);
  const parts = apt.startTime.split(":").map(Number);
  const appointmentUTC = Date.UTC(
    aptDate.getUTCFullYear(),
    aptDate.getUTCMonth(),
    aptDate.getUTCDate(),
    parts[0] || 0,
    parts[1] || 0,
    0,
    0
  );
  const joinTime = appointmentUTC - 15 * 60 * 1000;
  const diffMs = joinTime - now;
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h${mins > 0 ? mins + "min" : ""}`;
  }
  return `${diffMinutes} min`;
};


const joinTeleconsultation = async (apt: Appointment) => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        id: string;
        roomId: string;
        roomName: string;
        status: string;
        duration: number | null;
        startedAt: string | null;
        endedAt: string | null;
        connectionQuality: string | null;
        patient?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
        practitioner?: {
          id: string;
          userId: string;
          firstName: string;
          lastName: string;
        };
      };
    }>(`/teleconsultations/appointment/${apt.id}`);
    if (response.success && response.data) {
      activeRoomAppointmentId.value = apt.id;
      activeSession.value = {
        id: response.data.id,
        roomId: response.data.roomId,
        roomName: response.data.roomName,
        status: response.data.status,
        duration: response.data.duration,
        startedAt: response.data.startedAt,
        endedAt: response.data.endedAt,
        connectionQuality: response.data.connectionQuality,
        patient: response.data.patient,
        practitioner: response.data.practitioner,
      };
      showTeleconsultationRoom.value = true;
    }
  } catch (e) {
    console.error("Failed to join teleconsultation:", e);
  }
};

const closeTeleconsultationRoom = () => {
  showTeleconsultationRoom.value = false;
  activeRoomAppointmentId.value = null;
  activeSession.value = null;
  fetchAppointments(pagination.value.page);
};

const fetchTeleconsultations = async () => {
  loadingTeleconsultations.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { upcoming: Appointment[]; past: Appointment[] };
    }>("/teleconsultations/patient");
    if (response.success && response.data) {
      upcomingTeleconsultations.value = response.data.upcoming;
      pastTeleconsultations.value = response.data.past;
    }
  } catch (e) {
    console.error("Failed to fetch teleconsultations:", e);
  } finally {
    loadingTeleconsultations.value = false;
  }
};

const runPreCallTest = async () => {
  // check browser web rtc support
  preCallStatus.value.browser = !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    window.RTCPeerConnection
  );

  try {
    preCallStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    preCallStatus.value.camera = true;
    preCallStatus.value.microphone = true;

    if (preCallVideoRef.value) {
      preCallVideoRef.value.srcObject = preCallStream;
    }

    // mic level
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(preCallStream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    micAnalyserInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      micLevel.value = Math.min(100, Math.round((avg / 128) * 100));
    }, 100);
  } catch {
    preCallStatus.value.camera = false;
    preCallStatus.value.microphone = false;
  }

  // network
  if ("connection" in navigator) {
    const conn = (
      navigator as unknown as { connection?: { downlink?: number } }
    ).connection;
    preCallStatus.value.network = !!(
      conn &&
      conn.downlink &&
      conn.downlink > 1
    );
  } else {
    preCallStatus.value.network = navigator.onLine;
  }
};

const stopPreCallTest = () => {
  if (preCallStream) {
    preCallStream.getTracks().forEach((t) => t.stop());
    preCallStream = null;
  }
  if (micAnalyserInterval) {
    clearInterval(micAnalyserInterval);
    micAnalyserInterval = null;
  }
  micLevel.value = 0;
  showPreCallChecks.value = false;
};

watch(showPreCallChecks, (val) => {
  if (val) {
    nextTick(() => runPreCallTest());
  } else {
    stopPreCallTest();
  }
});

const fetchAppointments = async (page = 1) => {
  loading.value = true;
  try {
    const statusMap: Record<string, string> = {
      upcoming: "upcoming",
      past: "past",
      cancelled: "cancelled",
    };
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Appointment[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(
      `/appointments/patient?status=${statusMap[activeTab.value]}&limit=10&page=${page}&sort=${sortOrder.value}`,
    );
    if (response.success) {
      appointments.value = response.data;
      pagination.value = response.pagination;
      // update count for active tab
      tabCounts.value[activeTab.value] = response.pagination.total;
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
  } finally {
    loading.value = false;
  }
};

const fetchAllTabCounts = async () => {
  const statuses: Array<"upcoming" | "past" | "cancelled"> = [
    "upcoming",
    "past",
    "cancelled",
  ];
  try {
    const results = await Promise.all(
      statuses.map((s) =>
        useAuthenticatedFetch<{
          success: boolean;
          pagination: { total: number };
        }>(`/appointments/patient?status=${s}&limit=1&page=1`),
      ),
    );
    statuses.forEach((s, i) => {
      if (results[i]?.success) {
        tabCounts.value[s] = results[i].pagination.total;
      }
    });
  } catch (error) {
    console.error("Error fetching tab counts:", error);
  }
};

const changePage = (page: number) => {
  fetchAppointments(page);
};

const openCancelModal = (apt: Appointment) => {
  selectedAppointment.value = apt;
  cancelReason.value = "";
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  selectedAppointment.value = null;
};

const confirmCancel = async () => {
  if (!selectedAppointment.value) return;
  cancelling.value = true;
  try {
    await useAuthenticatedFetch(
      `/appointments/${selectedAppointment.value.id}/cancel`,
      {
        method: "PATCH",
        body: { reason: cancelReason.value || undefined },
      },
    );
    closeCancelModal();
    fetchAppointments(pagination.value.page);
    fetchAllTabCounts();
  } catch (error: unknown) {
    console.error("Error cancelling:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "data" in error
          ? (error as { data: { message?: string } }).data.message ||
            "Erreur lors de l'annulation"
          : "Erreur lors de l'annulation";
    alert(errorMessage);
  } finally {
    cancelling.value = false;
  }
};

const handleModifyClick = (apt: Appointment) => {
  if (!canModify(apt)) {
    // show popup for mobile/touch devices only bcoz we got hover on pc bro
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      alert(
        "Vous pouvez modifier votre rendez-vous uniquement 24 heures avant la date prévue.",
      );
    }
    return;
  }
  openModifyModal(apt);
};

const openModifyModal = async (apt: Appointment) => {
  selectedAppointment.value = apt;
  modifyDate.value = "";
  modifyTime.value = "";
  modifyError.value = "";
  modifyAvailableSlots.value = [];
  showModifyModal.value = true;

  // fetch available slots for the practitioner
  loadingModifySlots.value = true;
  try {
    const config = useRuntimeConfig();
    const response = await $fetch<{
      success: boolean;
      data: AvailableSlotDay[];
    }>(`/practitioners/${apt.practitioner.id}/available-slots?days=14`, {
      baseURL: config.public.apiBase,
    });
    if (response.success && response.data) {
      // filter out past time slots for today
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      modifyAvailableSlots.value = response.data
        .filter((day) => day.date >= todayStr)
        .map((day) => {
          if (day.date === todayStr) {
            const futureSlots = day.slots.filter((slot) => {
              const parts = slot.split(":");
              const h = parseInt(parts[0] || "0", 10);
              const m = parseInt(parts[1] || "0", 10);
              return (
                h > now.getHours() ||
                (h === now.getHours() && m > now.getMinutes())
              );
            });
            return { ...day, slots: futureSlots };
          }
          return day;
        })
        .filter((day) => day.slots.length > 0);
    }
  } catch (err) {
    console.error("Error fetching modify slots:", err);
    modifyError.value = "Erreur lors du chargement des disponibilités";
  } finally {
    loadingModifySlots.value = false;
  }
};

const closeModifyModal = () => {
  showModifyModal.value = false;
  selectedAppointment.value = null;
  modifyError.value = "";
};

const confirmModify = async () => {
  if (!selectedAppointment.value || !modifyDate.value || !modifyTime.value)
    return;
  modifying.value = true;
  modifyError.value = "";
  try {
    await useAuthenticatedFetch(
      `/appointments/${selectedAppointment.value.id}`,
      {
        method: "PATCH",
        body: {
          appointmentDate: modifyDate.value,
          startTime: modifyTime.value,
        },
      },
    );
    closeModifyModal();
    fetchAppointments(pagination.value.page);
    fetchAllTabCounts();
  } catch (error: unknown) {
    if (error instanceof Error) {
      modifyError.value = error.message;
    } else if (typeof error === "object" && error !== null && "data" in error) {
      modifyError.value =
        (error as { data?: { message?: string } }).data?.message ||
        "Erreur lors de la modification";
    } else {
      modifyError.value = "Erreur lors de la modification";
    }
  } finally {
    modifying.value = false;
  }
};

watch(activeTab, () => {
  fetchAppointments(1);
});

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    // redirect teleconsultations tab to the dedicated page
    const tabParam = route.query.tab as string;
    if (tabParam === "past" || tabParam === "cancelled") {
      activeTab.value = tabParam;
    }
    if (tabParam === "teleconsultations") {
      const appointmentId = route.query.appointmentId as string;
      if (appointmentId) {
        navigateTo(`/patient/teleconsultations?appointmentId=${appointmentId}`);
      } else {
        navigateTo("/patient/teleconsultations");
      }
      return;
    }

    await Promise.all([fetchAllTabCounts(), fetchAppointments(1)]);
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopPreCallTest();
});
</script>
