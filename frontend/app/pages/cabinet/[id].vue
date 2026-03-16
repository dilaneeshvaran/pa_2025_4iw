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
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-6">
        <Button variant="outline" @click="navigateTo('/search')">
          ← Retour à la recherche
        </Button>
      </div>

      <div v-if="loadingCabinet" class="py-12 text-center text-gray-500">
        Chargement des informations du cabinet...
      </div>
      <div v-else-if="!cabinet" class="py-12 text-center text-gray-500">
        Cabinet introuvable.
      </div>
      <div v-else>
        <!--cabinet header -->
        <Card class="mb-8 p-6">
          <div
            class="flex flex-col justify-between gap-4 md:flex-row md:items-start"
          >
            <div>
              <h1 class="mb-2 text-3xl font-bold text-gray-900">
                {{ cabinet.name }}
              </h1>
              <div class="mt-4 flex flex-col gap-2 text-gray-600">
                <div
                  class="flex items-center gap-2"
                  v-if="cabinet.address || cabinet.city"
                >
                  <IconMapPin class="h-5 w-5 text-[var(--color-primary)]" />
                  <span
                    >{{
                      cabinet.address
                        ? cabinet.address + (cabinet.city ? ", " : "")
                        : ""
                    }}{{ cabinet.city || "" }}</span
                  >
                </div>
                <div class="flex items-center gap-2" v-if="cabinet.phone">
                  <IconPhone class="h-5 w-5 text-[var(--color-primary)]" />
                  <span>{{ cabinet.phone }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="success" v-if="cabinet.isVerified"
                >Cabinet Vérifié</Badge
              >
            </div>
          </div>
        </Card>

        <!--practitioners list -->
        <div class="mb-6">
          <h2 class="mb-4 text-2xl font-semibold">Praticiens du cabinet</h2>
          <div
            v-if="loadingPractitioners"
            class="py-8 text-center text-gray-500"
          >
            Chargement des praticiens...
          </div>
          <div
            v-else-if="practitioners.length === 0"
            class="py-8 text-center text-gray-500"
          >
            Aucun praticien n'exerce actuellement dans ce cabinet.
          </div>
          <div v-else class="space-y-4">
            <Card
              v-for="practitioner in practitioners"
              :key="practitioner.id"
              class="p-6 transition-shadow hover:shadow-lg"
            >
              <div class="flex flex-col gap-6 sm:flex-row">
                <!-- photo -->
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

                <!-- info -->
                <div class="flex-1">
                  <div
                    class="mb-2 flex flex-col justify-between sm:flex-row sm:items-start"
                  >
                    <div>
                      <h3 class="mb-1 text-xl font-semibold">
                        {{ practitioner.title }} {{ practitioner.firstName }}
                        {{ practitioner.lastName }}
                      </h3>
                      <p class="text-gray-600">
                        {{ practitioner.specialties[0]?.name || "Généraliste" }}
                      </p>
                    </div>
                    <div class="mt-2 sm:mt-0 sm:text-right">
                      <p
                        class="text-xl font-medium text-[var(--color-primary)]"
                      >
                        {{ practitioner.baseConsultationFee.toLocaleString() }}
                        FCFA
                      </p>
                    </div>
                  </div>

                  <div class="mb-3 flex flex-wrap items-center gap-4">
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
                  </div>

                  <div class="mb-4 flex flex-wrap gap-2">
                    <Badge
                      v-if="practitioner.teleconsultationEnabled"
                      variant="success"
                    >
                      Téléconsultation
                    </Badge>
                    <Badge
                      v-if="practitioner.acceptsInsurance"
                      variant="primary"
                    >
                      Accepte l'assurance
                    </Badge>
                  </div>

                  <div class="mt-4 flex gap-3">
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
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useRuntimeConfig, navigateTo } from "#imports";
import {
  MapPin as IconMapPin,
  Phone as IconPhone,
  Star as IconStar,
} from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import Badge from "~/components/ui/Badge.vue";

const route = useRoute();
const config = useRuntimeConfig();

const cabinetId = route.params.id as string;

interface CabinetDetails {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  openHours?: any;
  isVerified: boolean;
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
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
}

const cabinet = ref<CabinetDetails | null>(null);
const practitioners = ref<Practitioner[]>([]);
const loadingCabinet = ref(true);
const loadingPractitioners = ref(true);

const loadCabinetDetails = async () => {
  loadingCabinet.value = true;
  try {
    const response = await $fetch<{ success: boolean; data: CabinetDetails }>(
      `/practitioners/cabinets/${cabinetId}`,
      { baseURL: config.public.apiBase },
    );
    if (response.success) {
      cabinet.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching cabinet details:", error);
  } finally {
    loadingCabinet.value = false;
  }
};

const loadCabinetPractitioners = async () => {
  loadingPractitioners.value = true;
  try {
    const response = await $fetch<{ success: boolean; data: Practitioner[] }>(
      `/practitioners/search?cabinetId=${cabinetId}`,
      { baseURL: config.public.apiBase },
    );
    if (response.success) {
      practitioners.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching cabinet practitioners:", error);
  } finally {
    loadingPractitioners.value = false;
  }
};

const handleReserve = (practitioner: Practitioner) => {
  navigateTo(`/practitioner/${practitioner.id}?cabinetId=${cabinetId}`);
};

onMounted(() => {
  loadCabinetDetails();
  loadCabinetPractitioners();
});

definePageMeta({
  layout: false,
});
</script>
