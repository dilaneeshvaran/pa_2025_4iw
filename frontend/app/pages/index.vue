<template>
  <div class="relative overflow-hidden bg-gray-50/50 dark:bg-gray-950">
    <div class="absolute inset-0 z-0 opacity-40">
      <div class="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-200/20 to-orange-100/10 blur-3xl"></div>
      <div class="absolute top-[600px] -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-green-100/20 to-emerald-50/10 blur-3xl"></div>
    </div>

    <!-- hero section -->
    <section class="relative z-10 flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center md:py-24" aria-label="Présentation">
      <div class="mx-auto max-w-4xl space-y-8">
        <h1 class="font-display text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
          Bienvenue sur <span class="text-orange-500">Medi</span><span class="text-green-600 dark:text-green-400">côte</span>
        </h1>

        <p class="mx-auto max-w-2xl font-display text-lg italic font-semibold text-orange-600 dark:text-orange-400 md:text-xl">
          « À côté des patients, nous sommes là à vos côtés »
        </p>

        <p class="mx-auto max-w-3xl text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
          Votre réseau de professionnels de santé de confiance en Côte d'Ivoire. Prenez rendez-vous en ligne, consultez en télémédecine et gérez votre dossier médical de manière sécurisée.
        </p>

        <Card class-name="mx-auto mt-12 max-w-3xl p-5 border border-black/[0.06] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur">
          <div class="grid gap-3 md:grid-cols-3">
            <div class="relative">
              <Input
                v-model="specialty"
                :icon="SearchIcon"
                placeholder="Spécialité, praticien..."
                class-name="w-full h-11"
                aria-label="Recherche par spécialité ou praticien"
              />
            </div>
            <div class="relative">
              <Input
                v-model="location"
                :icon="MapPin"
                placeholder="Ville, quartier..."
                class-name="w-full h-11"
                aria-label="Recherche par ville ou quartier"
              />
            </div>
            <Button
              @click="handleSearch"
              variant="primary"
              class-name="w-full h-11 text-sm font-bold tracking-wide transition-all"
            >
              <SearchIcon class="mr-2 h-4 w-4" :stroke-width="2" />
              Rechercher
            </Button>
          </div>
        </Card>

        <div class="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/auth/register"
            class="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D96F00] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#B85E00] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98]"
          >
            Créer un compte patient
          </NuxtLink>

          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/auth/login"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E5E3DC] dark:border-gray-700 bg-white dark:bg-gray-900 text-[#1B2321] dark:text-gray-100 px-8 py-3 text-base font-semibold transition-all duration-300 hover:bg-orange-50/40 dark:hover:bg-orange-500/10 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 active:scale-[0.98]"
          >
            Se connecter
          </NuxtLink>

          <div
            v-else
            class="rounded-lg border border-green-200/55 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/20 px-5 py-3 text-sm text-green-800 dark:text-green-200 flex items-center gap-3 shadow-[0_1px_2px_rgba(26,21,16,0.05)]"
          >
            <span class="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Vous êtes connecté(e) en tant que <strong class="font-semibold">{{ authStore.user?.email }}</strong></span>
            <NuxtLink
              :to="dashboardPath"
              class="ml-4 inline-flex items-center gap-1.5 rounded bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 active:scale-[0.98]"
            >
              Tableau de bord
              <ArrowRight class="h-3.5 w-3.5" :stroke-width="1.75" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- stats section -->
    <section class="relative z-10 bg-white dark:bg-gray-900 border-y border-black/[0.05] dark:border-gray-800 py-12" aria-labelledby="stats-heading">
      <h2 id="stats-heading" class="sr-only">Statistiques de MediCôte</h2>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
          <div class="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-black/[0.04] dark:border-gray-800">
            <div class="font-display text-3xl font-bold text-orange-500 md:text-4xl tabular-nums">100+</div>
            <p class="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">Praticiens vérifiés</p>
            <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Inscrits à l'Ordre National</p>
          </div>
          <div class="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-black/[0.04] dark:border-gray-800">
            <div class="font-display text-3xl font-bold text-green-600 dark:text-green-400 md:text-4xl tabular-nums">10k+</div>
            <p class="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">Patients inscrits</p>
            <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Partout en Côte d'Ivoire</p>
          </div>
          <div class="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-black/[0.04] dark:border-gray-800">
            <div class="font-display text-3xl font-bold text-orange-500 md:text-4xl tabular-nums">50k+</div>
            <p class="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">RDV & Téléconsultations</p>
            <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Réalisés avec succès</p>
          </div>
          <div class="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-black/[0.04] dark:border-gray-800">
            <div class="font-display text-3xl font-bold text-green-600 dark:text-green-400 md:text-4xl tabular-nums">98%</div>
            <p class="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">Satisfaction</p>
            <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Des patients et soignants</p>
          </div>
        </div>
      </div>
    </section>

    <!-- popular specialties section -->
    <section class="relative z-10 py-16" aria-labelledby="specialties-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="specialties-heading" class="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
          Rechercher par spécialité populaire
        </h2>
        <p class="mx-auto mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Accédez directement aux professionnels de santé les plus consultés.
        </p>

        <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            v-for="spec in popularSpecialties"
            :key="spec.name"
            type="button"
            :aria-label="`Rechercher un praticien : ${spec.name}`"
            @click="searchSpecialty(spec.name)"
            class="flex flex-col items-center justify-center p-5 rounded-lg border border-black/[0.06] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_1px_2px_rgba(26,21,16,0.04)] transition-all hover:border-orange-500 hover:shadow-md active:scale-[0.98] group"
          >
            <span :class="['mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110', spec.accent]">
              <SpecialtyIcon :name="spec.icon" class="h-6 w-6" />
            </span>
            <span class="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-500 text-xs md:text-sm">{{ spec.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- how it works section -->
    <section class="relative z-10 bg-white dark:bg-gray-900 border-y border-black/[0.05] dark:border-gray-800 py-16" aria-labelledby="workflow-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 id="workflow-heading" class="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Comment fonctionne MediCôte ?
          </h2>
          <p class="mx-auto mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Une plateforme simple, fluide et sécurisée pour vous accompagner au quotidien.
          </p>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <!-- Patient workflow -->
          <div class="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-lg border border-black/[0.06] dark:border-gray-800 space-y-5">
            <div class="flex items-center gap-2.5">
              <span class="text-orange-500">
                <User class="h-5 w-5" :stroke-width="2" />
              </span>
              <h3 class="font-display text-lg font-bold text-gray-900 dark:text-gray-100">Espace Patient</h3>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">Prenez soin de votre santé et de celle de vos proches en quelques clics.</p>
            
            <ol class="space-y-4 list-none pl-0">
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold text-xs tabular-nums">
                  1
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Recherchez un soignant</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Filtrez les professionnels par spécialité, ville ou quartier (Cocody, Yopougon, Marcory...).</p>
                </div>
              </li>
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold text-xs tabular-nums">
                  2
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Choisissez votre rendez-vous</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sélectionnez le créneau qui vous convient, en consultation physique au cabinet ou en téléconsultation.</p>
                </div>
              </li>
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold text-xs tabular-nums">
                  3
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Suivi et historique sécurisés</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Accédez à votre historique médical, recevez vos ordonnances et échangez via la messagerie sécurisée.</p>
                </div>
              </li>
            </ol>
            <div class="pt-2" v-if="!authStore.isAuthenticated">
              <NuxtLink
                to="/auth/register"
                class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#D96F00] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#B85E00] hover:shadow-md transition-all duration-300"
              >
                Commencer mon parcours patient
                <ArrowRight class="h-3.5 w-3.5" :stroke-width="2" />
              </NuxtLink>
            </div>
          </div>

          <!-- Practitioner workflow -->
          <div class="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-lg border border-black/[0.06] dark:border-gray-800 space-y-5">
            <div class="flex items-center gap-2.5">
              <span class="text-green-600 dark:text-green-400">
                <Stethoscope class="h-5 w-5" :stroke-width="2" />
              </span>
              <h3 class="font-display text-lg font-bold text-gray-900 dark:text-gray-100">Espace Praticien</h3>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">Digitalisez votre activité, optimisez votre agenda et développez la téléconsultation.</p>
            
            <ol class="space-y-4 list-none pl-0">
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs tabular-nums">
                  1
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Demande d'adhésion en ligne</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Renseignez vos informations professionnelles et téléchargez vos diplômes / autorisations d'exercer.</p>
                </div>
              </li>
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs tabular-nums">
                  2
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Vérification de vos justificatifs</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Nos administrateurs valident votre profil auprès des instances officielles ivoiriennes sous 24h.</p>
                </div>
              </li>
              <li class="flex gap-3.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs tabular-nums">
                  3
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Activation et prise en main</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ouvrez votre agenda en ligne, gérez vos salles d'attente virtuelles et proposez des téléconsultations de qualité.</p>
                </div>
              </li>
            </ol>
            <div class="pt-2">
              <NuxtLink
                to="/contact/practitioner"
                class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#00804A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#006B3D] hover:shadow-md transition-all duration-300"
              >
                Rejoindre le réseau de soignants
                <ArrowRight class="h-3.5 w-3.5" :stroke-width="2" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- cta section -->
    <section class="relative z-10 py-16" aria-labelledby="cta-heading" v-if="!authStore.isAuthenticated">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-lg bg-[#00804A] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,128,74,0.15)] text-white text-center md:text-left md:flex md:items-center md:justify-between gap-8">
          <div class="space-y-4">
            <h2 id="cta-heading" class="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Vous êtes professionnel de santé ?
            </h2>
            <p class="text-green-100/90 text-sm max-w-2xl leading-relaxed">
              Rejoignez MediCôte pour mieux gérer vos rendez-vous, proposer des téléconsultations sécurisées à vos patients, et optimiser le fonctionnement de votre cabinet médical.
            </p>
          </div>
          <div class="mt-6 md:mt-0 shrink-0">
            <NuxtLink
              to="/contact/practitioner"
              class="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#D96F00] px-6 py-3.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(217,111,0,0.25)] hover:bg-[#B85E00] active:scale-[0.98] transition-all"
            >
              Faire une demande d'inscription
              <ArrowRight class="h-4.5 w-4.5" :stroke-width="2" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { Search as SearchIcon, MapPin, ArrowRight, User, Stethoscope } from "lucide-vue-next";
import Card from "~/components/ui/Card.vue";
import Input from "~/components/ui/Input.vue";
import Button from "~/components/ui/Button.vue";
import SpecialtyIcon, { type SpecialtyIconName } from "~/components/ui/SpecialtyIcon.vue";
import { getDashboardPath } from "~/utils/authNavigation";

const authStore = useAuthStore();
const { trackEvent } = useAnalytics();
const specialty = ref("");
const location = ref("");

const dashboardPath = computed(() => getDashboardPath(authStore.currentRole));

const handleSearch = () => {
  trackEvent("search_submitted");

  const query: Record<string, string> = {};

  if (specialty.value) {
    query.search = specialty.value;
  }

  if (location.value) {
    query.city = location.value;
  }

  navigateTo({
    path: "/search",
    query,
  });
};

const searchSpecialty = (name: string) => {
  specialty.value = name;
  handleSearch();
};

const greenAccent = "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
const orangeAccent = "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";

const popularSpecialties: { name: string; icon: SpecialtyIconName; accent: string }[] = [
  { name: "Généraliste", icon: "stethoscope", accent: greenAccent },
  { name: "Pédiatre", icon: "baby", accent: orangeAccent },
  { name: "Gynécologue", icon: "venus", accent: greenAccent },
  { name: "Cardiologue", icon: "heart-pulse", accent: orangeAccent },
  { name: "Dentiste", icon: "tooth", accent: greenAccent },
  { name: "Dermatologue", icon: "dermatoscope", accent: orangeAccent },
];

onMounted(() => {
  authStore.initAuth();
});

definePageMeta({
  layout: "default",
  middleware: "guest",
});
</script>
