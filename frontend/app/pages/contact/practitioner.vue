<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8">
    <div class="mx-auto max-w-3xl">
      <div class="mb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg
            class="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour à l'accueil
        </NuxtLink>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <!-- not selected type yet -->
        <div v-if="!selectedType">
          <h3 class="mb-6 text-2xl font-bold text-gray-900">Je suis...</h3>
          <div class="space-y-4">
            <!-- healthcare professional -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-blue-600 hover:bg-blue-50"
              @click="selectedType = 'healthcare'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-600"
                >
                  <svg
                    class="h-6 w-6 text-blue-600 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="mb-1 text-lg font-semibold text-gray-900">
                    Je suis soignant et souhaite en savoir plus
                  </h3>
                  <p class="text-gray-600">
                    Découvrez comment MediCôte peut simplifier la gestion de
                    votre cabinet
                  </p>
                </div>
              </div>
            </button>

            <!-- client -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-green-600 hover:bg-green-50"
              @click="selectedType = 'client'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-600"
                >
                  <svg
                    class="h-6 w-6 text-green-600 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="mb-1 text-lg font-semibold text-gray-900">
                    Je suis client et j'ai besoin d'aide
                  </h3>
                  <p class="text-gray-600">
                    Vous utilisez déjà MediCôte et vous avez une question
                  </p>
                </div>
              </div>
            </button>

            <!-- patient -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-orange-600 hover:bg-orange-50"
              @click="selectedType = 'patient'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 transition-colors group-hover:bg-orange-600"
                >
                  <svg
                    class="h-6 w-6 text-orange-600 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="mb-1 text-lg font-semibold text-gray-900">
                    Je suis patient et souhaite prendre RDV
                  </h3>
                  <p class="text-gray-600">
                    Trouvez un praticien et prenez rendez-vous en ligne
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- healthcare professional form -->
        <div v-else-if="selectedType === 'healthcare'">
          <button
            class="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
            @click="selectedType = null"
          >
            <svg
              class="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour
          </button>

          <form class="space-y-6" @submit.prevent="handleSubmit">
            <div>
              <h3 class="mb-4 text-xl font-bold text-gray-900">
                Informations de contact
              </h3>
              <div class="space-y-4">
                <!-- request type -->
                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700"
                    for="requestType"
                  >
                    Objet de la demande *
                  </label>
                  <select
                    id="requestType"
                    v-model="formData.requestType"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="DEMO">Démonstration</option>
                    <option value="INFO">Information</option>
                    <option value="SUPPORT">Support</option>
                  </select>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      class="mb-2 block text-sm font-medium text-gray-700"
                      for="firstName"
                    >
                      Prénom *
                    </label>
                    <input
                      id="firstName"
                      v-model="formData.firstName"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label
                      class="mb-2 block text-sm font-medium text-gray-700"
                      for="lastName"
                    >
                      Nom *
                    </label>
                    <input
                      id="lastName"
                      v-model="formData.lastName"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700"
                    for="email"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700"
                    for="phone"
                  >
                    Téléphone portable *
                  </label>
                  <input
                    id="phone"
                    v-model="formData.phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="border-t pt-6">
              <h3 class="mb-4 text-xl font-bold text-gray-900">
                Informations professionnelles
              </h3>
              <div class="space-y-4">
                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700"
                    for="postalCode"
                  >
                    Code postal du cabinet *
                  </label>
                  <input
                    id="postalCode"
                    v-model="formData.postalCode"
                    type="text"
                    placeholder="Ex: 00225"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div
                  v-click-outside="() => (showSpecialtyDropdown = false)"
                  class="relative"
                >
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700"
                    for="specialty"
                  >
                    Spécialité *
                  </label>
                  <div class="relative">
                    <input
                      id="specialty"
                      v-model="specialtySearch"
                      type="text"
                      placeholder="Rechercher une spécialité..."
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                      @focus="showSpecialtyDropdown = true"
                      @input="showSpecialtyDropdown = true"
                    />
                    <svg
                      class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  <div
                    v-if="showSpecialtyDropdown && !isSubmitting"
                    class="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
                  >
                    <div v-if="filteredSpecialties.length > 0" class="p-2">
                      <!-- if search term, show flat list -->
                      <template v-if="specialtySearch">
                        <button
                          v-for="specialty in filteredSpecialties"
                          :key="specialty"
                          type="button"
                          class="w-full rounded px-4 py-2 text-left transition-colors hover:bg-blue-50"
                          @click="handleSpecialtySelect(specialty)"
                        >
                          {{ specialty }}
                        </button>
                      </template>

                      <!-- if no search term, show grouped list -->
                      <template v-else>
                        <div
                          v-for="[letter, specs] in groupedSpecialties"
                          :key="letter"
                        >
                          <div
                            class="sticky top-0 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                          >
                            {{ letter }}
                          </div>
                          <button
                            v-for="specialty in specs"
                            :key="specialty"
                            type="button"
                            class="w-full px-4 py-2 text-left transition-colors hover:bg-blue-50"
                            @click="handleSpecialtySelect(specialty)"
                          >
                            {{ specialty }}
                          </button>
                        </div>
                      </template>
                    </div>
                    <div v-else class="p-4 text-center text-gray-600">
                      Aucune spécialité trouvée
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- submit section -->
            <div class="border-t pt-6">
              <p class="mb-4 text-sm text-gray-600">* Champs obligatoires</p>
              <p class="mb-6 text-sm text-gray-600">
                <a href="#" class="text-blue-600 hover:underline">
                  En savoir plus sur vos données personnelles
                </a>
              </p>

              <!-- error message -->
              <div
                v-if="errorMessage"
                class="mb-4 rounded-lg bg-red-50 p-4 text-red-800"
              >
                {{ errorMessage }}
              </div>

              <!-- success message -->
              <div
                v-if="successMessage"
                class="mb-4 rounded-lg bg-green-50 p-4 text-green-800"
              >
                {{ successMessage }}
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full rounded-lg bg-blue-600 px-4 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span v-if="isSubmitting">Envoi en cours...</span>
                <span v-else>Envoyer ma demande</span>
              </button>
            </div>
          </form>
        </div>

        <!-- client Type -->
        <div v-else-if="selectedType === 'client'">
          <button
            class="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
            @click="selectedType = null"
          >
            <svg
              class="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour
          </button>
          <div class="text-center">
            <h3 class="mb-4 text-2xl font-bold text-gray-900">
              Support Client
            </h3>
            <p class="text-gray-600">
              Pour toute assistance, veuillez contacter notre support à
              <a href="mailto:support@medicote.ci" class="text-blue-600">
                support@medicote.ci
              </a>
            </p>
          </div>
        </div>

        <!-- patient Type -->
        <div v-else-if="selectedType === 'patient'">
          <button
            class="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
            @click="selectedType = null"
          >
            <svg
              class="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour
          </button>
          <div class="text-center">
            <h3 class="mb-4 text-2xl font-bold text-gray-900">
              Prendre rendez-vous
            </h3>
            <p class="mb-6 text-gray-600">
              Pour prendre rendez-vous avec un praticien, veuillez créer un
              compte patient.
            </p>
            <NuxtLink
              to="/auth/register"
              class="inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
            >
              Créer un compte patient
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedType = ref<"healthcare" | "client" | "patient" | null>(null);
const specialtySearch = ref("");
const showSpecialtyDropdown = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const formData = ref({
  requestType: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  postalCode: "",
  specialty: "",
});

const specialties = [
  "Allergologue",
  "Anesthésiste",
  "Cardiologue",
  "Chirurgien-dentiste",
  "Chirurgien général",
  "Chirurgien orthopédiste",
  "Chirurgien pédiatrique",
  "Dermatologue",
  "Endocrinologue",
  "Gastro-entérologue",
  "Gériatre",
  "Gynécologue",
  "Hématologue",
  "Infirmier(ère)",
  "Kinésithérapeute",
  "Médecin généraliste",
  "Néphrologue",
  "Neurologue",
  "Nutritionniste",
  "Oncologue",
  "Ophtalmologue",
  "ORL (Oto-rhino-laryngologiste)",
  "Ostéopathe",
  "Pédiatre",
  "Pharmacien(ne)",
  "Pneumologue",
  "Psychiatre",
  "Psychologue",
  "Radiologue",
  "Rhumatologue",
  "Sage-femme",
  "Urologue",
].sort();

const filteredSpecialties = computed(() => {
  if (!specialtySearch.value) {
    return specialties;
  }
  return specialties.filter((s) =>
    s.toLowerCase().includes(specialtySearch.value.toLowerCase()),
  );
});

const groupedSpecialties = computed(() => {
  const grouped = new Map<string, string[]>();
  specialties.forEach((specialty) => {
    const firstLetter = specialty.charAt(0).toUpperCase();
    if (!grouped.has(firstLetter)) {
      grouped.set(firstLetter, []);
    }
    grouped.get(firstLetter)!.push(specialty);
  });
  return Array.from(grouped.entries()).sort();
});

function handleSpecialtySelect(specialty: string) {
  specialtySearch.value = specialty;
  formData.value.specialty = specialty;
  showSpecialtyDropdown.value = false;
}

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";
  isSubmitting.value = true;

  try {
    // ensure specialty is set from search
    if (!formData.value.specialty && specialtySearch.value) {
      formData.value.specialty = specialtySearch.value;
    }

    const config = useRuntimeConfig();
    await $fetch("/contact-requests", {
      method: "POST",
      baseURL: config.public.apiBase,
      body: formData.value,
    });

    successMessage.value =
      "Votre demande a été envoyée avec succès. Nous vous contacterons bientôt.";

    // reset form
    formData.value = {
      requestType: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postalCode: "",
      specialty: "",
    };
    specialtySearch.value = "";

    // redirect to home after 3 seconds
    setTimeout(() => {
      navigateTo("/");
    }, 3000);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    errorMessage.value =
      err?.data?.message || "Une erreur est survenue lors de l'envoi";
  } finally {
    isSubmitting.value = false;
  }
}

// click outside directive for dropdown
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    const clickHandler = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value();
      }
    };
    (
      el as HTMLElement & { clickOutsideEvent?: (event: Event) => void }
    ).clickOutsideEvent = clickHandler;
    document.addEventListener("click", clickHandler);
  },
  unmounted(el: HTMLElement) {
    const clickHandler = (
      el as HTMLElement & { clickOutsideEvent?: (event: Event) => void }
    ).clickOutsideEvent;
    if (clickHandler) {
      document.removeEventListener("click", clickHandler);
    }
  },
};

definePageMeta({
  layout: "default",
  middleware: "guest",
});
</script>
