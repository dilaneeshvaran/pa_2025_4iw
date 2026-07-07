<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"
          />
          <p class="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>

      <!-- error State -->
      <Card v-else-if="error" class="text-center">
        <div class="py-8">
          <IconAlertCircle class="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 class="mb-2 text-xl font-semibold text-gray-900">Erreur</h3>
          <p class="text-gray-600">{{ error }}</p>
          <Button class="mt-4" @click="navigateTo('/search')">
            Retour à la recherche
          </Button>
        </div>
      </Card>

      <!-- doctor profile  -->
      <template v-else-if="practitioner">
        <Card class="mb-6">
          <div class="flex flex-col gap-6 md:flex-row">
            <!-- avatar -->
            <div class="flex-shrink-0">
              <div class="h-32 w-32 overflow-hidden rounded-full bg-gray-200">
                <img
                  v-if="practitioner.photo"
                  :src="practitioner.photo"
                  :alt="`${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-green-100 text-3xl font-bold text-green-700"
                >
                  {{ practitioner.firstName?.charAt(0)
                  }}{{ practitioner.lastName?.charAt(0) }}
                </div>
              </div>
            </div>

            <div class="flex-1">
              <div
                class="mb-3 flex flex-col items-start justify-between gap-4 md:flex-row md:items-start"
              >
                <div>
                  <div class="mb-2 flex items-center gap-2">
                    <h1 class="text-3xl font-bold">
                      {{ practitioner.title }} {{ practitioner.firstName }}
                      {{ practitioner.lastName }}
                    </h1>
                    <IconCheckCircle
                      v-if="practitioner.licenseVerified"
                      class="h-6 w-6 text-[var(--color-success)]"
                    />
                  </div>
                  <p class="mb-2 text-xl text-gray-600">
                    {{
                      practitioner.specialties?.[0]?.name ||
                      "Médecin généraliste"
                    }}
                  </p>
                  <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-1">
                      <IconStar
                        class="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                      <span class="text-lg font-medium">{{
                        practitioner.averageRating?.toFixed(1) || "N/A"
                      }}</span>
                      <span class="text-gray-600"
                        >({{ practitioner.totalReviews }} avis)</span
                      >
                    </div>
                    <div class="flex items-center gap-1 text-gray-600">
                      <IconMapPin class="h-5 w-5" />
                      {{ practitioner.city }}
                    </div>
                    <div
                      v-if="practitioner.yearsOfExperience"
                      class="flex items-center gap-1 text-gray-600"
                    >
                      <IconBriefcase class="h-5 w-5" />
                      {{ practitioner.yearsOfExperience }} ans d'expérience
                    </div>
                  </div>
                </div>
                <Button @click="goToAvailability">
                  Réserver une consultation
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <!-- tabs -->
        <div class="tabs-section mb-6">
          <div class="flex gap-2 border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'px-6 py-3 font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-show="activeTab === 'about'" class="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 class="mb-4 text-xl font-semibold">Biographie</h3>
            <p class="leading-relaxed text-gray-700">
              {{ practitioner.bio || "Aucune biographie disponible." }}
            </p>
          </Card>

          <!-- education/qualifications -->
          <Card>
            <div class="mb-4 flex items-center gap-2">
              <IconGraduationCap class="h-5 w-5 text-[var(--color-primary)]" />
              <h3 class="text-xl font-semibold">Formation</h3>
            </div>
            <ul v-if="practitioner.qualifications?.length" class="space-y-2">
              <li
                v-for="edu in practitioner.qualifications"
                :key="edu.id"
                class="flex items-start gap-2 text-gray-700"
              >
                <IconCheckCircle
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-success)]"
                />
                <span>
                  {{ edu.degree }} - {{ edu.institution }} ({{
                    edu.yearObtained
                  }})
                </span>
              </li>
            </ul>
            <p v-else class="text-gray-600">Aucune formation renseignée.</p>
          </Card>

          <!-- languages -->
          <Card>
            <div class="mb-4 flex items-center gap-2">
              <IconGlobe class="h-5 w-5 text-[var(--color-primary)]" />
              <h3 class="text-xl font-semibold">Langues parlées</h3>
            </div>
            <div
              v-if="practitioner.languages?.length"
              class="flex flex-wrap gap-2"
            >
              <Badge
                v-for="(lang, index) in practitioner.languages"
                :key="index"
                variant="primary"
              >
                {{ lang }}
              </Badge>
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <Badge variant="primary">Français</Badge>
            </div>
          </Card>

          <!-- pricing -->
          <Card>
            <div class="mb-4 flex items-center gap-2">
              <IconDollarSign class="h-5 w-5 text-[var(--color-primary)]" />
              <h3 class="text-xl font-semibold">Tarifs</h3>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Consultation au cabinet</span>
                <span class="text-lg font-medium">
                  {{ practitioner.baseConsultationFee.toLocaleString() }} FCFA
                </span>
              </div>
              <div
                v-if="
                  practitioner.teleconsultationEnabled &&
                  practitioner.teleconsultationFee
                "
                class="flex items-center justify-between"
              >
                <span class="text-gray-700">Téléconsultation</span>
                <span class="text-lg font-medium">
                  {{ practitioner.teleconsultationFee.toLocaleString() }} FCFA
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Durée de consultation</span>
                <span class="text-lg font-medium">
                  {{ practitioner.consultationDuration }} min
                </span>
              </div>
            </div>
          </Card>

          <!-- clinic photos -->
          <Card v-if="practitioner.photos?.length" class="md:col-span-2">
            <h3 class="mb-4 text-xl font-semibold">Photos du cabinet</h3>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
              <img
                v-for="(photo, i) in practitioner.photos"
                :key="i"
                :src="photo"
                :alt="`Cabinet ${i + 1}`"
                class="h-48 w-full rounded-lg object-cover"
              />
            </div>
          </Card>

          <!-- other info -->
          <Card class="md:col-span-2">
            <h3 class="mb-4 text-xl font-semibold">
              Informations complémentaires
            </h3>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="flex items-center gap-2">
                <IconCheckCircle
                  v-if="practitioner.acceptsInsurance"
                  class="h-5 w-5 text-[var(--color-success)]"
                />
                <IconX v-else class="h-5 w-5 text-gray-400" />
                <span class="text-gray-700">Assurance acceptée</span>
              </div>
              <div class="flex items-center gap-2">
                <IconCheckCircle
                  v-if="practitioner.acceptsNewPatients"
                  class="h-5 w-5 text-[var(--color-success)]"
                />
                <IconX v-else class="h-5 w-5 text-gray-400" />
                <span class="text-gray-700">Accepte nouveaux patients</span>
              </div>
              <div class="flex items-center gap-2">
                <IconCheckCircle
                  v-if="practitioner.teleconsultationEnabled"
                  class="h-5 w-5 text-[var(--color-success)]"
                />
                <IconX v-else class="h-5 w-5 text-gray-400" />
                <span class="text-gray-700">Téléconsultation disponible</span>
              </div>
            </div>
          </Card>
        </div>

        <!-- availability tab -->
        <div v-show="activeTab === 'availability'">
          <Card>
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-xl font-semibold">Créneaux disponibles</h3>
              <span class="text-sm text-gray-500">7 prochains jours</span>
            </div>

            <!-- loading state -->
            <div v-if="loadingSlots" class="flex justify-center py-8">
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"
              />
            </div>

            <!-- slots content -->
            <div v-else-if="filteredAvailableSlots.length" class="space-y-4">
              <div
                v-for="day in filteredAvailableSlots"
                :key="day.date"
                class="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-shadow hover:shadow-md"
              >
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[var(--color-primary)] text-white"
                    >
                      <span class="text-xs font-medium uppercase">{{
                        formatDayShort(day.date)
                      }}</span>
                      <span class="text-lg font-bold">{{
                        formatDayNumber(day.date)
                      }}</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900">
                        {{ formatDateFull(day.date) }}
                      </h4>
                      <p class="text-sm text-gray-500">
                        {{ day.slots.length }} créneau{{
                          day.slots.length > 1 ? "x" : ""
                        }}
                        disponible{{ day.slots.length > 1 ? "s" : "" }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- morning slots -->
                <div
                  class="max-h-48 overflow-y-auto rounded-lg border border-gray-100 p-2"
                >
                  <div v-if="getMorningSlots(day.slots).length" class="mb-3">
                    <p class="mb-2 text-xs font-medium uppercase text-gray-500">
                      Matin
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="slot in getMorningSlots(day.slots)"
                        :key="slot"
                        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-[var(--color-primary)] hover:bg-orange-50 hover:text-[var(--color-primary)]"
                        @click="selectTimeSlot(day.date, slot)"
                      >
                        {{ slot }}
                      </button>
                    </div>
                  </div>

                  <!-- afternoon slots -->
                  <div v-if="getAfternoonSlots(day.slots).length">
                    <p class="mb-2 text-xs font-medium uppercase text-gray-500">
                      Après-midi
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="slot in getAfternoonSlots(day.slots)"
                        :key="slot"
                        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-[var(--color-primary)] hover:bg-orange-50 hover:text-[var(--color-primary)]"
                        @click="selectTimeSlot(day.date, slot)"
                      >
                        {{ slot }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- voir plus button -->
              <div class="mt-4 text-center">
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-orange-50"
                  @click="openBookingModalFromAvailability"
                >
                  <IconCalendar class="h-4 w-4" />
                  Voir plus de disponibilités
                </button>
              </div>
            </div>

            <!-- no slots -->
            <div v-else class="py-8 text-center">
              <IconCalendar class="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p class="text-gray-600">
                Aucun créneau disponible pour les prochains jours.
              </p>
              <p class="mt-2 text-sm text-gray-500">
                Veuillez contacter directement le praticien pour plus
                d'informations.
              </p>
              <button
                class="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-orange-50"
                @click="openBookingModalFromAvailability"
              >
                <IconCalendar class="h-4 w-4" />
                Voir plus de disponibilités
              </button>
            </div>
          </Card>
        </div>

        <!-- reviews tab -->
        <div v-show="activeTab === 'reviews'">
          <div class="space-y-4">
            <!-- Charte de confiance pour les utilisateurs connectés -->
            <div
              v-if="authStore.isAuthenticated"
              class="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-gray-800 shadow-sm"
            >
              <IconCheckCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p class="font-semibold text-green-900">
                  Charte de confiance - Avis vérifiés
                </p>
                <p class="mt-1 text-sm leading-relaxed text-gray-700">
                  Tous les avis présentés sur MediCôte proviennent de patients vérifiés. Pour pouvoir rédiger un avis, vous devez avoir préalablement effectué et validé une consultation (rendez-vous) avec ce praticien.
                </p>
              </div>
            </div>

            <Card>
              <div class="flex items-center gap-6">
                <div class="text-center">
                  <div
                    class="mb-1 text-5xl font-bold text-[var(--color-primary)]"
                  >
                    {{ practitioner.averageRating?.toFixed(1) || "N/A" }}
                  </div>
                  <div class="mb-1 flex gap-0.5">
                    <IconStar
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'h-5 w-5',
                        i <= Math.floor(practitioner.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300',
                      ]"
                    />
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ practitioner.totalReviews }} avis
                  </div>
                </div>
              </div>
            </Card>

            <!-- individual reviews -->
            <Card v-for="review in reviews" :key="review.id">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 font-medium text-orange-700"
                >
                  {{ review.patientName.charAt(0) }}
                </div>
                <div class="flex-1">
                  <div class="mb-2 flex items-center justify-between">
                    <h4 class="text-lg font-semibold">
                      {{ review.patientName }}
                    </h4>
                    <span class="text-sm text-gray-600">{{
                      formatDate(review.date)
                    }}</span>
                  </div>
                  <div class="mb-2 flex gap-0.5">
                    <IconStar
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'h-4 w-4',
                        i <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300',
                      ]"
                    />
                  </div>
                  <p class="text-gray-700">{{ review.comment }}</p>
                </div>
              </div>
            </Card>

            <!-- no reviews -->
            <Card v-if="!reviews.length">
              <div class="py-8 text-center">
                <IconStar class="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p class="text-gray-600">Aucun avis pour le moment.</p>
              </div>
            </Card>
          </div>
        </div>

        <div v-show="activeTab === 'location'">
          <Card>
            <h3 class="mb-4 text-xl font-semibold">Localisation</h3>
            <div class="mb-4">
              <div class="mb-2 flex items-start gap-2">
                <IconMapPin class="mt-1 h-5 w-5 text-[var(--color-primary)]" />
                <div>
                  <p class="font-medium">
                    {{ practitioner.clinicName || "Cabinet médical" }}
                  </p>
                  <p class="text-gray-700">{{ practitioner.address }}</p>
                  <p class="text-gray-700">{{ practitioner.city }}</p>
                </div>
              </div>
            </div>
            <ClientOnly v-if="practitioner.latitude && practitioner.longitude">
              <PractitionersMap :practitioners="[practitioner]" />
              <template #fallback>
                <div class="flex h-96 items-center justify-center rounded-lg bg-gray-100">
                  <p class="text-gray-400">Chargement de la carte...</p>
                </div>
              </template>
            </ClientOnly>
            <div
              v-else
              class="flex h-96 items-center justify-center rounded-lg bg-gray-200"
            >
              <div class="text-center text-gray-600">
                <IconMapPin class="mx-auto mb-2 h-12 w-12" />
                <p>{{ practitioner.city }}</p>
                <p class="mt-2 text-sm">
                  Localisation non disponible pour ce praticien
                </p>
              </div>
            </div>
          </Card>
        </div>
      </template>
    </div>

    <!-- booking modal -->
    <BookingModal
      :is-open="isBookingModalOpen"
      :practitioner="practitioner"
      :cabinet-id="route.query.cabinetId as string"
      :preselected-date="preselectedDate"
      :preselected-time="preselectedTime"
      @close="isBookingModalOpen = false"
      @success="fetchAvailableSlots"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";

import { useRoute, navigateTo } from "#app";
import { useAuthStore } from "~/stores/auth";
import { formatDateLong as formatDate } from "~/utils/date";
import {
  parsePractitionerProfileTab,
  type PractitionerProfileTab,
} from "~/utils/practitionerProfile";
import {
  Star as IconStar,
  MapPin as IconMapPin,
  CheckCircle2 as IconCheckCircle,
  GraduationCap as IconGraduationCap,
  Globe as IconGlobe,
  DollarSign as IconDollarSign,
  Calendar as IconCalendar,
  AlertCircle as IconAlertCircle,
  X as IconX,
  Briefcase as IconBriefcase,
} from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import Badge from "~/components/ui/Badge.vue";
import BookingModal from "~/components/BookingModal.vue";
import PractitionersMap from "~/components/PractitionersMap.vue";

interface PractitionerDetail {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  bio: string | null;
  clinicName: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  baseConsultationFee: number;
  teleconsultationFee: number | null;
  teleconsultationEnabled: boolean;
  averageRating: number | null;
  totalReviews: number;
  acceptsInsurance: boolean;
  acceptsNewPatients: boolean;
  licenseNumber: string;
  licenseVerified: boolean;
  yearsOfExperience: number | null;
  consultationDuration: number;
  specialties: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  qualifications: Array<{
    id: string;
    degree: string;
    institution: string;
    yearObtained: number;
  }>;
  languages: string[];
  photos: string[];
  photo?: string;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    patient?: {
      firstName?: string;
      lastName?: string;
    };
  }>;
}

interface AvailableSlot {
  date: string;
  slots: string[];
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const route = useRoute();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const toast = useAppToast();
const { trackEvent } = useAnalytics();

const practitionerId = computed(() => route.params.id as string);

const practitioner = ref<PractitionerDetail | null>(null);
const availableSlots = ref<AvailableSlot[]>([]);
const reviews = ref<Review[]>([]);
const loading = ref(true);
const loadingSlots = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<PractitionerProfileTab>(
  parsePractitionerProfileTab(route.query.tab),
);
const isBookingModalOpen = ref(false);
const preselectedDate = ref<string | null>(null);
const preselectedTime = ref<string | null>(null);

const tabs: {
  id: "about" | "availability" | "reviews" | "location";
  label: string;
}[] = [
  { id: "about", label: "À propos" },
  { id: "availability", label: "Disponibilités" },
  { id: "reviews", label: "Avis" },
  { id: "location", label: "Localisation" },
];

const fetchPractitioner = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await $fetch<ApiResponse<PractitionerDetail>>(
      `/practitioners/${practitionerId.value}`,
      {
        baseURL: config.public.apiBase,
      },
    );

    if (response.success && response.data) {
      practitioner.value = response.data;

      // this is temporary until replace with real reviews
      if (response.data.reviews) {
        reviews.value = response.data.reviews.map((r) => ({
          id: r.id,
          patientName: `${r.patient?.firstName || "Patient"} ${r.patient?.lastName || "Anonyme"}`,
          rating: r.rating,
          date: r.createdAt,
          comment: r.comment,
        }));
      }
    } else {
      error.value = "Impossible de charger les informations du praticien.";
    }
  } catch (err: unknown) {
    console.error("Error fetching practitioner:", err);
    error.value =
      (err as Error).message || "Une erreur est survenue lors du chargement.";
  } finally {
    loading.value = false;
  }
};

const fetchAvailableSlots = async () => {
  try {
    loadingSlots.value = true;

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 7);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    const ey = endDate.getFullYear();
    const em = String(endDate.getMonth() + 1).padStart(2, "0");
    const ed = String(endDate.getDate()).padStart(2, "0");
    const endDateStr = `${ey}-${em}-${ed}`;

    const response = await $fetch<ApiResponse<AvailableSlot[]>>(
      `/practitioners/${practitionerId.value}/available-slots`,
      {
        baseURL: config.public.apiBase,
        params: {
          startDate: todayStr,
          endDate: endDateStr,
          days: 7,
        },
        headers: {
          "x-timezone-offset": new Date().getTimezoneOffset().toString(),
        },
      },
    );

    if (response.success && response.data) {
      availableSlots.value = response.data;
    }
  } catch (err: unknown) {
    console.error("Error fetching available slots:", err);
  } finally {
    loadingSlots.value = false;
  }
};

const fetchReviews = async () => {
  try {
    const tsRestClient = useTsRestClient()
    const response = await tsRestClient.getPractitionerReviews({
      params: { practitionerId: practitionerId.value },
    })

    if (response.status === 200 && response.body.success) {
      reviews.value = response.body.data.map((r) => ({
        id: r.id,
        patientName: `${r.patient?.firstName || 'Patient'} ${r.patient?.lastName || 'Anonyme'}`,
        rating: r.rating,
        date: r.createdAt as string,
        comment: r.comment || '',
      }))
    }
  } catch (err: unknown) {
    console.error("Error fetching reviews via ts-rest:", err)
  }
};

const goToAvailability = () => {
  activeTab.value = "availability";
  if (!availableSlots.value.length && !loadingSlots.value) {
    fetchAvailableSlots();
  }
  document
    .querySelector(".tabs-section")
    ?.scrollIntoView({ behavior: "smooth" });
};

const selectTimeSlot = (date: string, time: string) => {
  if (!authStore.isAuthenticated) {
    let returnUrl = `${route.path}?bookDate=${date}&bookTime=${time}`;
    if (route.query.cabinetId) {
      returnUrl += `&cabinetId=${route.query.cabinetId}`;
    }
    navigateTo(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
    return;
  }

  if (authStore.user?.role !== "PATIENT") {
    toast.error("Seuls les patients peuvent réserver des rendez-vous.");
    return;
  }

  // open booking modal with pre selected date and time
  preselectedDate.value = date;
  preselectedTime.value = time;
  isBookingModalOpen.value = true;
};

const openBookingModalFromAvailability = () => {
  if (authStore.isAuthenticated && authStore.user?.role !== "PATIENT") {
    toast.error("Seuls les patients peuvent réserver des rendez-vous.");
    return;
  }
  preselectedDate.value = null;
  preselectedTime.value = null;
  isBookingModalOpen.value = true;
};

// filter slots to exclude past dates and times
const filteredAvailableSlots = computed(() => {
  const now = new Date();
  // Local for Paris demo so today slot filtering matches the clock on screen
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return availableSlots.value
    .filter((day) => day.date >= todayStr)
    .map((day) => {
      if (day.date === todayStr) {
        const futureSlots = day.slots.filter((slot) => {
          const parts = slot.split(":");
          const hour = parseInt(parts[0] || "0", 10);
          const minute = parseInt(parts[1] || "0", 10);
          return (
            hour > currentHour ||
            (hour === currentHour && minute > currentMinute)
          );
        });
        return { ...day, slots: futureSlots };
      }
      return day;
    })
    .filter((day) => day.slots.length > 0);
});

const getMorningSlots = (slots: string[]) => {
  return slots.filter((slot) => {
    const hour = parseInt(slot.split(":")[0] || "0", 10);
    return hour < 12;
  });
};

const getAfternoonSlots = (slots: string[]) => {
  return slots.filter((slot) => {
    const hour = parseInt(slot.split(":")[0] || "0", 10);
    return hour >= 12;
  });
};

const formatDayShort = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3);
};

const formatDayNumber = (dateString: string) => {
  const date = new Date(dateString);
  return date.getDate();
};

const formatDateFull = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === "availability" && !availableSlots.value.length) {
    fetchAvailableSlots();
  }
  if (newTab === "reviews") {
    fetchReviews();
  }
});

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = parsePractitionerProfileTab(tab);
    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab;
    }
  },
);

onMounted(async () => {
  // init auth state from localStorage
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  await fetchPractitioner();

  if (practitioner.value) {
    trackEvent("practitioner_viewed");
  }

  if (activeTab.value === "availability") {
    await fetchAvailableSlots();
  }

  if (route.query.bookDate && route.query.bookTime) {
    if (authStore.isAuthenticated) {
      isBookingModalOpen.value = true;
    }
  }
});

definePageMeta({
  layout: "default",
});
</script>

<style scoped></style>
