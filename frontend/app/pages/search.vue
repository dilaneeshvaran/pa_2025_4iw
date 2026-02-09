<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <NuxtLink
            to="/"
            class="text-2xl font-bold text-[var(--color-primary)]"
          >
            MediCôte
          </NuxtLink>
          <div class="flex items-center gap-4">
            <!-- authenticated  -->
            <template v-if="authStore.isAuthenticated">
              <NuxtLink
                :to="
                  authStore.user?.role === 'PATIENT'
                    ? '/patient/dashboard'
                    : '/'
                "
                class="text-sm font-medium text-gray-700 hover:text-[var(--color-primary)]"
              >
                Mon tableau de bord
              </NuxtLink>
              <Button variant="outline" @click="handleLogout">
                Déconnexion
              </Button>
            </template>
            <!-- not authenticated -->
            <template v-else>
              <Button variant="secondary" @click="navigateTo('/auth/login')">
                Connexion
              </Button>
              <Button @click="navigateTo('/auth/register')">
                Créer un compte
              </Button>
            </template>
          </div>
        </div>
      </div>
    </header>

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

      <div class="grid gap-6 lg:grid-cols-4">
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
                <span
                  >{{
                    filters.maxPrice?.toLocaleString() || "50,000"
                  }}
                  FCFA</span
                >
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
                {{ pagination.total }} praticien{{
                  pagination.total > 1 ? "s" : ""
                }}
                trouvé{{ pagination.total > 1 ? "s" : "" }}
              </template>
            </p>
          </div>

          <div v-if="loading" class="space-y-4">
            <Card v-for="i in 3" :key="i" class="animate-pulse">
              <div class="flex gap-6">
                <div
                  class="h-24 w-24 flex-shrink-0 rounded-full bg-gray-200"
                ></div>
                <div class="flex-1 space-y-3">
                  <div class="h-4 w-1/3 rounded bg-gray-200"></div>
                  <div class="h-3 w-1/4 rounded bg-gray-200"></div>
                  <div class="flex gap-2">
                    <div class="h-6 w-20 rounded-full bg-gray-200"></div>
                    <div class="h-6 w-20 rounded-full bg-gray-200"></div>
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
                      <p
                        class="text-xl font-medium text-[var(--color-primary)]"
                      >
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
                      <IconStar
                        class="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                      <span class="font-medium">{{
                        practitioner.averageRating
                      }}</span>
                      <span class="text-sm text-gray-600"
                        >({{ practitioner.totalReviews }})</span
                      >
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-600">
                      <IconMapPin class="h-4 w-4" />
                      {{ practitioner.city }}
                    </div>
                  </div>

                  <div class="mb-4 flex flex-wrap gap-2">
                    <Badge
                      v-if="practitioner.teleconsultationEnabled"
                      variant="success"
                    >
                      Téléconsultation
                    </Badge>
                    <Badge v-if="practitioner.availableToday" variant="warning">
                      Disponible aujourd'hui
                    </Badge>
                    <Badge
                      v-if="practitioner.acceptsInsurance"
                      variant="primary"
                    >
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  Search as IconSearch,
  Filter as IconFilter,
  Star as IconStar,
  MapPin as IconMapPin,
} from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import Badge from "~/components/ui/Badge.vue";
import { useAuthStore } from "~/stores/auth";

const config = useRuntimeConfig();
const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push("/");
};

interface Specialty {
  id: string;
  name: string;
  description?: string;
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
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
}

const filters = reactive({
  search: "",
  specialtyId: "",
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

const practitioners = ref<Practitioner[]>([]);
const specialties = ref<Specialty[]>([]);
const loading = ref(false);
const pagination = reactive({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
});

let debounceTimeout: NodeJS.Timeout | null = null;

const debouncedSearch = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    searchPractitioners();
  }, 500);
};

const searchPractitioners = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();

    if (filters.search) queryParams.append("search", filters.search);
    if (filters.specialtyId)
      queryParams.append("specialtyId", filters.specialtyId);
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.teleconsultationEnabled)
      queryParams.append("teleconsultationEnabled", "true");
    if (filters.availableToday) queryParams.append("availableToday", "true");
    if (filters.acceptsInsurance)
      queryParams.append("acceptsInsurance", "true");
    if (filters.maxPrice)
      queryParams.append("maxPrice", filters.maxPrice.toString());
    if (filters.minRating)
      queryParams.append("minRating", filters.minRating.toString());
    queryParams.append("page", filters.page.toString());
    queryParams.append("limit", filters.limit.toString());

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

const loadSpecialties = async () => {
  try {
    const response = await $fetch<{
      success: boolean;
      data: Specialty[];
    }>("/practitioners/specialties", {
      baseURL: config.public.apiBase,
    });
    if (response.success) {
      specialties.value = response.data;
    }
  } catch (error) {
    console.error("Error loading specialties:", error);
  }
};

const changePage = (page: number) => {
  filters.page = page;
  searchPractitioners();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleReserve = (practitioner: Practitioner) => {
  // go to practitioner profile page
  // user is asked to login when clicking on available slots if not already logedin
  navigateTo(`/practitioner/${practitioner.id}`);
};

onMounted(() => {
  authStore.initAuth();
  loadSpecialties();
  searchPractitioners();
});

definePageMeta({
  layout: false,
});
</script>
