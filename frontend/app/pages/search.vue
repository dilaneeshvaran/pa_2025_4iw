<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card class="mb-6">
        <div class="relative">
          <div
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <IconSearch class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Rechercher un praticien, une spécialité..."
            class="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20"
            @input="debouncedSearch"
          />
        </div>
      </Card>

      <!-- Tabs + view toggle -->
      <div class="mb-6 flex items-center justify-between border-b border-gray-200">
        <nav class="-mb-px flex gap-6" aria-label="Tabs">
          <button
            :class="[
              activeTab === 'practitioners'
                ? 'border-[var(--color-primary)] font-bold text-[var(--color-primary)]'
                : 'border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm transition-colors',
            ]"
            @click="activeTab = 'practitioners'"
          >
            Praticiens
          </button>
          <button
            :class="[
              activeTab === 'cabinets'
                ? 'border-[var(--color-primary)] font-bold text-[var(--color-primary)]'
                : 'border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm transition-colors',
            ]"
            @click="activeTab = 'cabinets'"
          >
            Cabinets
          </button>
        </nav>

        <!-- List / Map toggle -->
        <div class="mb-px flex overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            :class="[
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-gray-500 hover:bg-gray-50',
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
            ]"
            @click="viewMode = 'list'"
          >
            <IconList class="h-4 w-4" />
            Liste
          </button>
          <button
            :class="[
              viewMode === 'map'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-gray-500 hover:bg-gray-50',
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
            ]"
            @click="viewMode = 'map'"
          >
            <IconMap class="h-4 w-4" />
            Carte
          </button>
        </div>
      </div>

      <!-- ── PRACTITIONERS TAB ── -->
      <div v-if="activeTab === 'practitioners'">
        <!-- MAP VIEW -->
        <div v-if="viewMode === 'map'" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p class="mb-3 text-sm text-gray-500">
            <template v-if="loading">Chargement...</template>
            <template v-else>
              {{ pagination.total }} praticien{{ pagination.total > 1 ? "s" : "" }} trouvé{{ pagination.total > 1 ? "s" : "" }}
              <span v-if="geoFilters.active" class="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <IconLocate class="h-3 w-3" /> Recherche géolocalisée
              </span>
            </template>
          </p>
          <ClientOnly>
            <PractitionersMap
              :practitioners="practitioners"
              :cabinets="cabinets"
              :loading="loading"
              @locate="onMapLocate"
            />
            <template #fallback>
              <div class="flex h-[560px] items-center justify-center rounded-lg bg-gray-100">
                <p class="text-gray-400">Chargement de la carte...</p>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- LIST VIEW -->
        <div v-else class="grid gap-6 lg:grid-cols-4">
          <aside class="lg:col-span-1">
            <Card>
              <div class="mb-6 flex items-center gap-2">
                <IconFilter class="h-5 w-5 text-[var(--color-primary)]" />
                <h3 class="text-lg font-semibold">Filtres</h3>
              </div>

              <div class="mb-6">
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Spécialité
                </label>
                <select
                  v-model="filters.specialtyId"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                >
                  <option value="">Toutes</option>
                  <option
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    :value="specialty.id"
                  >
                    {{ specialty.name }}
                  </option>
                </select>
              </div>

              <div class="mb-6">
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Cabinet
                </label>
                <select
                  v-model="filters.cabinetId"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                >
                  <option value="">Tous les cabinets</option>
                  <option
                    v-for="cabinet in cabinets"
                    :key="cabinet.id"
                    :value="cabinet.id"
                  >
                    {{ cabinet.name }}
                    {{ cabinet.city ? `(${cabinet.city})` : "" }}
                  </option>
                </select>
              </div>

              <div class="mb-6">
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Localisation
                </label>
                <input
                  v-model="filters.city"
                  type="text"
                  placeholder="Ville..."
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  @input="debouncedSearch"
                />
              </div>

              <div class="mb-6 space-y-3">
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    v-model="filters.teleconsultationEnabled"
                    type="checkbox"
                    class="h-4 w-4 rounded text-[var(--color-primary)]"
                    @change="searchPractitioners"
                  />
                  <span class="text-sm">Téléconsultation</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    v-model="filters.availableToday"
                    type="checkbox"
                    class="h-4 w-4 rounded text-[var(--color-primary)]"
                    @change="searchPractitioners"
                  />
                  <span class="text-sm">Disponible aujourd'hui</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    v-model="filters.acceptsInsurance"
                    type="checkbox"
                    class="h-4 w-4 rounded text-[var(--color-primary)]"
                    @change="searchPractitioners"
                  />
                  <span class="text-sm">Accepte l'assurance</span>
                </label>
              </div>

              <div class="mb-6">
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Prix maximum (FCFA)
                </label>
                <input
                  v-model.number="filters.maxPrice"
                  type="range"
                  min="0"
                  max="50000"
                  step="5000"
                  class="w-full"
                  @input="debouncedSearch"
                />
                <div class="mt-1 flex justify-between text-sm text-gray-600">
                  <span>0</span>
                  <span>{{ filters.maxPrice?.toLocaleString() || "50,000" }} FCFA</span>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Note minimum
                </label>
                <select
                  v-model.number="filters.minRating"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  @change="searchPractitioners"
                >
                  <option :value="0">Toutes</option>
                  <option :value="3">3+ ⭐</option>
                  <option :value="4">4+ ⭐</option>
                  <option :value="4.5">4.5+ ⭐</option>
                </select>
              </div>
            </Card>
          </aside>

          <div class="lg:col-span-3">
            <div class="mb-4 flex items-center justify-between">
              <p class="text-gray-600">
                <template v-if="loading">Chargement...</template>
                <template v-else>
                  {{ pagination.total }} praticien{{ pagination.total > 1 ? "s" : "" }}
                  trouvé{{ pagination.total > 1 ? "s" : "" }}
                </template>
              </p>
            </div>

            <div v-if="loading" class="space-y-4">
              <Card v-for="i in 3" :key="i" class="animate-pulse">
                <div class="flex gap-6">
                  <div class="h-24 w-24 flex-shrink-0 rounded-full bg-gray-200" />
                  <div class="flex-1 space-y-3">
                    <div class="h-4 w-1/3 rounded bg-gray-200" />
                    <div class="h-3 w-1/4 rounded bg-gray-200" />
                    <div class="flex gap-2">
                      <div class="h-6 w-20 rounded-full bg-gray-200" />
                      <div class="h-6 w-20 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div v-else-if="practitioners.length === 0" class="py-12 text-center">
              <p class="text-lg text-gray-500">
                Aucun praticien trouvé avec ces critères.
              </p>
            </div>

            <div v-else class="space-y-4">
              <Card
                v-for="practitioner in practitioners"
                :key="practitioner.id"
                class="transition-shadow hover:shadow-lg"
              >
                <div class="flex gap-6">
                  <div
                    class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-200"
                  >
                    <img
                      v-if="practitioner.photo"
                      :src="practitioner.photo"
                      :alt="`${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400"
                    >
                      {{ practitioner.firstName.charAt(0)
                      }}{{ practitioner.lastName.charAt(0) }}
                    </div>
                  </div>

                  <div class="flex-1">
                    <div class="mb-2 flex items-start justify-between">
                      <div>
                        <h3 class="mb-1 text-xl font-semibold">
                          {{ practitioner.title }} {{ practitioner.firstName }}
                          {{ practitioner.lastName }}
                        </h3>
                        <p class="text-gray-600">
                          {{ practitioner.specialties[0]?.name || "Généraliste" }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xl font-medium text-[var(--color-primary)]">
                          {{ practitioner.baseConsultationFee.toLocaleString() }}
                          FCFA
                        </p>
                      </div>
                    </div>

                    <div class="mb-3 flex items-center gap-4">
                      <div
                        v-if="practitioner.averageRating"
                        class="flex items-center gap-1"
                      >
                        <IconStar class="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span class="font-medium">{{ practitioner.averageRating }}</span>
                        <span class="text-sm text-gray-600">({{ practitioner.totalReviews }})</span>
                      </div>
                      <div class="flex items-center gap-1 text-sm text-gray-600">
                        <IconMapPin class="h-4 w-4" />
                        {{ practitioner.city }}
                      </div>
                    </div>

                    <div class="mb-4 flex flex-wrap gap-2">
                      <Badge v-if="practitioner.teleconsultationEnabled" variant="success">
                        Téléconsultation
                      </Badge>
                      <Badge v-if="practitioner.availableToday" variant="warning">
                        Disponible aujourd'hui
                      </Badge>
                      <Badge v-if="practitioner.acceptsInsurance" variant="primary">
                        Accepte l'assurance
                      </Badge>
                    </div>

                    <div class="flex gap-3">
                      <Button
                        variant="secondary"
                        @click="navigateTo(`/practitioner/${practitioner.id}`)"
                      >
                        Voir le profil
                      </Button>
                      <Button @click="handleReserve(practitioner)">
                        Réserver
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div
              v-if="pagination.totalPages > 1"
              class="mt-6 flex justify-center gap-2"
            >
              <Button
                variant="outline"
                :disabled="pagination.page === 1"
                @click="changePage(pagination.page - 1)"
              >
                Précédent
              </Button>
              <span class="flex items-center px-4 text-sm text-gray-600">
                Page {{ pagination.page }} sur {{ pagination.totalPages }}
              </span>
              <Button
                variant="outline"
                :disabled="pagination.page === pagination.totalPages"
                @click="changePage(pagination.page + 1)"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CABINETS TAB ── -->
      <div v-else>
        <!-- MAP VIEW -->
        <div v-if="viewMode === 'map'" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p class="mb-3 text-sm text-gray-500">
            {{ cabinets.length }} cabinet{{ cabinets.length > 1 ? "s" : "" }}
            trouvé{{ cabinets.length > 1 ? "s" : "" }}
          </p>
          <ClientOnly>
            <PractitionersMap
              :practitioners="[]"
              :cabinets="cabinets"
              :loading="loading"
              @locate="onMapLocate"
            />
            <template #fallback>
              <div class="flex h-[560px] items-center justify-center rounded-lg bg-gray-100">
                <p class="text-gray-400">Chargement de la carte...</p>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- LIST VIEW -->
        <div v-else class="space-y-4">
          <div class="mb-4 flex items-center justify-between">
            <p class="text-gray-600">
              {{ cabinets.length }} cabinet{{ cabinets.length > 1 ? "s" : "" }}
              trouvé{{ cabinets.length > 1 ? "s" : "" }}
            </p>
          </div>

          <div v-if="cabinets.length === 0" class="py-12 text-center">
            <p class="text-lg text-gray-500">Aucun cabinet trouvé.</p>
          </div>

          <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="cabinet in cabinets"
              :key="cabinet.id"
              class="flex flex-col justify-between transition-shadow hover:shadow-lg"
            >
              <div>
                <h3 class="mb-2 text-xl font-semibold">{{ cabinet.name }}</h3>
                <div class="mb-2 flex items-center gap-1 text-sm text-gray-600">
                  <IconMapPin class="h-4 w-4" />
                  {{ cabinet.city || "Ville non renseignée" }}
                </div>
                <p class="mb-4 text-sm text-gray-500">
                  {{ cabinet.address || "" }}
                </p>
              </div>

              <div
                class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"
              >
                <span class="text-sm font-medium text-gray-600">
                  {{ cabinet.practitionersCount }} praticien{{
                    cabinet.practitionersCount > 1 ? "s" : ""
                  }}
                </span>
                <Button
                  variant="outline"
                  @click="navigateTo(`/cabinet/${cabinet.id}`)"
                >
                  Voir le cabinet
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  Search as IconSearch,
  Filter as IconFilter,
  Star as IconStar,
  MapPin as IconMapPin,
  List as IconList,
  Map as IconMap,
  Locate as IconLocate,
} from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import Badge from "~/components/ui/Badge.vue";
const config = useRuntimeConfig();

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

interface Cabinet {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  practitionersCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  photo?: string;
  city: string;
  baseConsultationFee: number;
  teleconsultationFee: number | null;
  teleconsultationEnabled: boolean;
  averageRating: number | null;
  totalReviews: number;
  acceptsInsurance: boolean;
  availableToday?: boolean;
  latitude: number | null;
  longitude: number | null;
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
  cabinets: Array<{ id: string; name: string; city?: string | null }>;
}

const activeTab = ref<"practitioners" | "cabinets">("practitioners");
const viewMode = ref<"list" | "map">("list");

const filters = reactive({
  search: "",
  specialtyId: "",
  cabinetId: "",
  city: "",
  teleconsultationEnabled: false,
  availableToday: false,
  acceptsInsurance: false,
  minPrice: 0,
  maxPrice: 50000,
  minRating: 0,
  page: 1,
  limit: 20,
});

const geoFilters = reactive({
  active: false,
  latitude: 0,
  longitude: 0,
  radiusKm: 10,
});

const practitioners = ref<Practitioner[]>([]);
const specialties = ref<Specialty[]>([]);
const cabinets = ref<Cabinet[]>([]);
const loading = ref(false);
const pagination = reactive({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
});

let debounceTimeout: NodeJS.Timeout | null = null;

const debouncedSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => searchPractitioners(), 500);
};

const searchPractitioners = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();

    if (filters.search) queryParams.append("search", filters.search);
    if (filters.specialtyId) queryParams.append("specialtyId", filters.specialtyId);
    if (filters.cabinetId) queryParams.append("cabinetId", filters.cabinetId);
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.teleconsultationEnabled)
      queryParams.append("teleconsultationEnabled", "true");
    if (filters.availableToday) queryParams.append("availableToday", "true");
    if (filters.acceptsInsurance) queryParams.append("acceptsInsurance", "true");
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());
    if (filters.minRating) queryParams.append("minRating", filters.minRating.toString());
    queryParams.append("page", filters.page.toString());
    queryParams.append("limit", filters.limit.toString());

    if (geoFilters.active) {
      queryParams.append("latitude", geoFilters.latitude.toString());
      queryParams.append("longitude", geoFilters.longitude.toString());
      queryParams.append("radiusKm", geoFilters.radiusKm.toString());
    }

    const response = await $fetch<{
      success: boolean;
      data: Practitioner[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/practitioners/search?${queryParams.toString()}`, {
      baseURL: config.public.apiBase,
    });

    if (response.success) {
      practitioners.value = response.data;
      pagination.total = response.pagination.total;
      pagination.page = response.pagination.page;
      pagination.limit = response.pagination.limit;
      pagination.totalPages = response.pagination.totalPages;
    }
  } catch (error) {
    console.error("Error searching practitioners:", error);
  } finally {
    loading.value = false;
  }
};

const onMapLocate = (lat: number, lng: number, radius: number) => {
  geoFilters.active = true;
  geoFilters.latitude = lat;
  geoFilters.longitude = lng;
  geoFilters.radiusKm = radius;
  filters.page = 1;
  searchPractitioners();
};

const loadSpecialties = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Specialty[] }>(
      "/practitioners/specialties",
      { baseURL: config.public.apiBase },
    );
    if (response.success) specialties.value = response.data;
  } catch (error) {
    console.error("Error loading specialties:", error);
  }
};

const loadCabinets = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Cabinet[] }>(
      "/practitioners/cabinets",
      { baseURL: config.public.apiBase },
    );
    if (response.success) cabinets.value = response.data;
  } catch (error) {
    console.error("Error loading cabinets:", error);
  }
};

const changePage = (page: number) => {
  filters.page = page;
  searchPractitioners();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleReserve = (practitioner: Practitioner) => {
  navigateTo(`/practitioner/${practitioner.id}`);
};

onMounted(() => {
  loadSpecialties();
  loadCabinets();
  searchPractitioners();
});

definePageMeta({
  layout: "default",
});
</script>
