<template>
  <div class="relative overflow-hidden bg-white">
    <div class="absolute inset-0 z-0 opacity-30">
      <div class="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-200 to-orange-100 blur-3xl"></div>
      <div class="absolute top-[600px] -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-green-100 to-emerald-50 blur-3xl"></div>
    </div>

    <section class="relative z-10 flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center md:py-24" aria-label="Présentation">
      <div class="mx-auto max-w-4xl space-y-8">
        <h1 class="text-5xl font-extrabold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
          Bienvenue sur <span class="text-orange-500">Medi</span><span class="text-green-600">côte</span>
        </h1>

        <p class="mx-auto max-w-2xl text-xl italic font-medium text-orange-600 md:text-2xl">
          « À côté des patients, nous sommes là à vos côtés »
        </p>

        <p class="mx-auto max-w-3xl text-lg text-gray-600 md:text-xl">
          Votre réseau de professionnels de santé de confiance en Côte d'Ivoire. Prenez rendez-vous en ligne, consultez en télémédecine et gérez votre dossier médical de manière sécurisée.
        </p>

        <Card class="mx-auto mt-12 max-w-3xl p-6 shadow-xl border border-gray-100 bg-white/90 backdrop-blur">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="relative">
              <Input
                v-model="specialty"
                :icon="SearchIcon"
                placeholder="Spécialité, praticien..."
                class-name="w-full"
                aria-label="Recherche par spécialité ou praticien"
              />
            </div>
            <div class="relative">
              <Input
                v-model="location"
                :icon="MapPin"
                placeholder="Ville, quartier..."
                class-name="w-full"
                aria-label="Recherche par ville ou quartier"
              />
            </div>
            <Button @click="handleSearch" class="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center justify-center">
              <SearchIcon class="mr-2 h-5 w-5" />
              Rechercher
            </Button>
          </div>
        </Card>

        <div class="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/auth/register"
            class="rounded-lg bg-orange-500 px-8 py-3.5 text-lg font-semibold text-white shadow-md transition-all hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Créer un compte patient
          </NuxtLink>

          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/auth/login"
            class="rounded-lg border-2 border-green-600 px-8 py-3 text-lg font-semibold text-green-600 transition-all hover:bg-green-50 hover:-translate-y-0.5 active:translate-y-0"
          >
            Se connecter
          </NuxtLink>

          <div
            v-else
            class="rounded-lg border border-green-300 bg-green-50 px-6 py-4 text-green-800 flex items-center gap-3 shadow-sm"
          >
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>Vous êtes connecté(e) en tant que <strong>{{ authStore.user?.email }}</strong></span>
            <NuxtLink
              :to="dashboardPath"
              class="ml-4 inline-flex items-center gap-1.5 rounded bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
            >
              Tableau de bord
              <ArrowRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 bg-gray-50/80 border-y border-gray-100 py-16" aria-labelledby="stats-heading">
      <h2 id="stats-heading" class="sr-only">Statistiques de MediCôte</h2>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          <div class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100/50">
            <div class="text-4xl font-extrabold text-orange-500 md:text-5xl">100+</div>
            <p class="mt-2 text-sm font-semibold text-gray-800">Praticiens vérifiés</p>
            <p class="text-xs text-gray-500">Inscrits à l'Ordre National</p>
          </div>
          <div class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100/50">
            <div class="text-4xl font-extrabold text-green-600 md:text-5xl">10k+</div>
            <p class="mt-2 text-sm font-semibold text-gray-800">Patients inscrits</p>
            <p class="text-xs text-gray-500">Partout en Côte d'Ivoire</p>
          </div>
          <div class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100/50">
            <div class="text-4xl font-extrabold text-orange-500 md:text-5xl">50k+</div>
            <p class="mt-2 text-sm font-semibold text-gray-800">RDV & Téléconsultations</p>
            <p class="text-xs text-gray-500">Réalisés avec succès</p>
          </div>
          <div class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100/50">
            <div class="text-4xl font-extrabold text-green-600 md:text-5xl">98%</div>
            <p class="mt-2 text-sm font-semibold text-gray-800">Satisfaction</p>
            <p class="text-xs text-gray-500">Des patients et soignants</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 py-16" aria-labelledby="specialties-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="specialties-heading" class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Rechercher par spécialité populaire
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          Accédez directement aux professionnels de santé les plus consultés.
        </p>

        <div class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <button
            v-for="spec in popularSpecialties"
            :key="spec.name"
            @click="searchSpecialty(spec.name)"
            class="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-orange-500 hover:shadow-md hover:-translate-y-1 group"
          >
            <span class="text-4xl mb-4 group-hover:scale-110 transition-transform">{{ spec.icon }}</span>
            <span class="font-semibold text-gray-900 group-hover:text-orange-500 text-sm md:text-base">{{ spec.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="relative z-10 bg-gray-50/50 py-16" aria-labelledby="workflow-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 id="workflow-heading" class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Comment fonctionne MediCôte ?
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            Une plateforme simple, fluide et sécurisée pour vous accompagner au quotidien.
          </p>
        </div>

        <div class="mt-12 grid gap-12 lg:grid-cols-2">
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <User class="h-6 w-6" />
              </span>
              <h3 class="text-2xl font-bold text-gray-900">Espace Patient</h3>
            </div>
            <p class="text-gray-500">Prenez soin de votre santé et de celle de vos proches en quelques clics.</p>
            
            <ol class="space-y-6 list-none pl-0">
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Recherchez un soignant</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Filtrez les professionnels par spécialité, ville ou quartier (Cocody, Yopougon, Marcory...).</p>
                </div>
              </li>
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Choisissez votre rendez-vous</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Sélectionnez le créneau qui vous convient, en consultation physique au cabinet ou en téléconsultation.</p>
                </div>
              </li>
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Suivi et historique sécurisés</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Accédez à votre historique médical, recevez vos ordonnances et échangez via la messagerie sécurisée.</p>
                </div>
              </li>
            </ol>
            <div class="pt-4" v-if="!authStore.isAuthenticated">
              <NuxtLink
                to="/auth/register"
                class="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Commencer mon parcours patient
                <ArrowRight class="h-4 w-4" />
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                <Stethoscope class="h-6 w-6" />
              </span>
              <h3 class="text-2xl font-bold text-gray-900">Espace Praticien</h3>
            </div>
            <p class="text-gray-500">Digitalisez votre activité, optimisez votre agenda et développez la téléconsultation.</p>
            
            <ol class="space-y-6 list-none pl-0">
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Demande d'adhésion en ligne</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Renseignez vos informations professionnelles et téléchargez vos diplômes / autorisations d'exercer.</p>
                </div>
              </li>
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Vérification de vos credentials</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Nos administrateurs valident votre profil auprès des instances officielles ivoiriennes sous 24h.</p>
                </div>
              </li>
              <li class="flex gap-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Activation et prise en main</h4>
                  <p class="text-sm text-gray-500 mt-0.5">Ouvrez votre agenda en ligne, gérez vos salles d'attente virtuelles et proposez des téléconsultations de qualité.</p>
                </div>
              </li>
            </ol>
            <div class="pt-4">
              <NuxtLink
                to="/contact/practitioner"
                class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Rejoindre le réseau de soignants
                <ArrowRight class="h-4 w-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 py-16" aria-labelledby="cta-heading" v-if="!authStore.isAuthenticated">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 shadow-lg text-white text-center md:text-left md:flex md:items-center md:justify-between gap-8">
          <div class="space-y-4">
            <h2 id="cta-heading" class="text-3xl font-extrabold tracking-tight">
              Vous êtes professionnel de santé ?
            </h2>
            <p class="text-orange-50 text-lg max-w-2xl">
              Rejoignez MediCôte pour mieux gérer vos rendez-vous, proposer des téléconsultations sécurisées à vos patients, et optimiser le fonctionnement de votre cabinet médical.
            </p>
          </div>
          <div class="mt-6 md:mt-0 shrink-0">
            <NuxtLink
              to="/contact/practitioner"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-orange-600 font-bold hover:bg-orange-50 transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Faire une demande d'inscription
              <ArrowRight class="h-5 w-5" />
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

const authStore = useAuthStore();
const specialty = ref("");
const location = ref("");

// compute dashboard path based on user role
const dashboardPath = computed(() => {
  switch (authStore.user?.role) {
    case "PATIENT":
      return "/patient/dashboard";
    case "PRACTITIONER":
      return "/practitioner/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/patient/dashboard";
  }
});

const handleSearch = () => {
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

const popularSpecialties = [
  { name: "Généraliste", icon: "⚕️" },
  { name: "Pédiatre", icon: "👶" },
  { name: "Gynécologue", icon: "🤰" },
  { name: "Cardiologue", icon: "❤️" },
  { name: "Dentiste", icon: "🦷" },
  { name: "Dermatologue", icon: "🧴" },
];

onMounted(() => {
  authStore.initAuth();
});

definePageMeta({
  layout: "default",
});
</script>
