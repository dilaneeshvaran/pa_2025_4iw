<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 px-4 py-8">
    <div class="mx-auto max-w-3xl">
      <div class="mb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
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

      <div class="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg md:p-8">
        <!-- select type -->
        <div v-if="!selectedType">
          <h3 class="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Je suis...</h3>
          <div class="space-y-4">
            <!-- healthcare professional -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 text-left transition-all hover:border-orange-600 hover:bg-orange-50"
              @click="selectedType = 'healthcare'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 transition-colors group-hover:bg-orange-500"
                >
                  <svg
                    class="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white"
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
                  <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Je suis soignant et souhaite en savoir plus
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Découvrez comment MediCôte peut simplifier la gestion de
                    votre cabinet
                  </p>
                </div>
              </div>
            </button>

            <!-- client -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 text-left transition-all hover:border-green-600 hover:bg-green-50"
              @click="selectedType = 'client'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 transition-colors group-hover:bg-green-600"
                >
                  <svg
                    class="h-6 w-6 text-green-600 dark:text-green-400 group-hover:text-white"
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
                  <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Je suis client et j'ai besoin d'aide
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Vous utilisez déjà MediCôte et vous avez une question
                  </p>
                </div>
              </div>
            </button>

            <!-- patient -->
            <button
              class="group w-full rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 text-left transition-all hover:border-orange-600 hover:bg-orange-50"
              @click="selectedType = 'patient'"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 transition-colors group-hover:bg-orange-600"
                >
                  <svg
                    class="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white"
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
                  <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Je suis patient et souhaite prendre RDV
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Trouvez un praticien et prenez rendez-vous en ligne
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!--   choose sub-type for healthcare professional -->
        <div v-else-if="selectedType === 'healthcare'">
          <button
            class="mb-4 inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
            @click="
              selectedType = null;
              registrationType = null;
            "
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

          <!-- sub type toggle  -->
          <div v-if="!registrationType">
            <h3 class="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Type d'inscription
            </h3>
            <div class="grid gap-4 md:grid-cols-2">
              <button
                class="group rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 text-left transition-all hover:border-orange-600 hover:bg-orange-50"
                @click="registrationType = 'PRACTITIONER'"
              >
                <div
                  class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 transition-colors group-hover:bg-orange-500"
                >
                  <svg
                    class="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white"
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
                <h4 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Praticien individuel
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Inscription en tant que médecin, dentiste, spécialiste...
                </p>
              </button>

              <button
                class="group rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 text-left transition-all hover:border-purple-600 hover:bg-purple-50"
                @click="registrationType = 'CABINET'"
              >
                <div
                  class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 transition-colors group-hover:bg-purple-600"
                >
                  <svg
                    class="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:text-white"
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
                <h4 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Cabinet / Structure sanitaire
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Inscription d'un cabinet médical, clinique ou centre de santé
                </p>
              </button>
            </div>
          </div>

          <!-- practitcien form -->
          <div v-else-if="registrationType === 'PRACTITIONER'">
            <button
              class="mb-4 inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
              @click="registrationType = null"
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
              Changer de type
            </button>

            <form class="space-y-6" @submit.prevent="handlePractitionerSubmit">
              <div>
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Informations personnelles
                </h3>
                <div class="space-y-4">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Prénom *</label
                      >
                      <input
                        v-model="practitionerForm.firstName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Nom *</label
                      >
                      <input
                        v-model="practitionerForm.lastName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Email *</label
                    >
                    <input
                      v-model="practitionerForm.email"
                      type="email"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Téléphone *</label
                    >
                    <input
                      v-model="practitionerForm.phone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Informations professionnelles
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Numéro d'inscription à l'Ordre (ONMCI) *</label
                    >
                    <input
                      v-model="practitionerForm.orderNumber"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Adresse du cabinet / structure sanitaire *</label
                    >
                    <input
                      v-model="practitionerForm.clinicAddress"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <!-- specielity dropdown -->
                  <div
                    v-click-outside="() => (showSpecialtyDropdown = false)"
                    class="relative"
                  >
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Spécialité médicale
                    </label>
                    <div class="relative">
                      <input
                        v-model="specialtySearch"
                        type="text"
                        placeholder="Rechercher une spécialité..."
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        @focus="showSpecialtyDropdown = true"
                        @input="showSpecialtyDropdown = true"
                      />
                      <svg
                        class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400"
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
                      class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
                    >
                      <div v-if="filteredSpecialties.length > 0" class="p-2">
                        <button
                          v-for="sp in filteredSpecialties"
                          :key="sp"
                          type="button"
                          class="w-full rounded px-4 py-2 text-left transition-colors hover:bg-orange-50"
                          @click="selectSpecialty(sp)"
                        >
                          {{ sp }}
                        </button>
                      </div>
                      <div v-else class="p-4 text-center text-gray-600 dark:text-gray-400">
                        Aucune spécialité trouvée
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Documents requis
                </h3>
                <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Formats acceptés : PDF, JPG, PNG - Max 5 Mo par fichier
                </p>
                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Carte d'identité nationale / Passeport *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
                      @change="
                        (e: Event) => handleFileChange(e, 'identityDocument')
                      "
                      required
                    />
                    <p
                      v-if="fileErrors.identityDocument"
                      class="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {{ fileErrors.identityDocument }}
                    </p>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Diplôme d'État de docteur en médecine *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
                      @change="(e: Event) => handleFileChange(e, 'diploma')"
                      required
                    />
                    <p
                      v-if="fileErrors.diploma"
                      class="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {{ fileErrors.diploma }}
                    </p>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Attestation d'inscription au Tableau de l'Ordre (ONMCI)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
                      @change="
                        (e: Event) => handleFileChange(e, 'orderAttestation')
                      "
                    />
                    <p
                      v-if="fileErrors.orderAttestation"
                      class="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {{ fileErrors.orderAttestation }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- sumbit -->
              <div class="border-t pt-6">
                <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">* Champs obligatoires</p>

                <div
                  v-if="errorMessage"
                  class="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200"
                >
                  {{ errorMessage }}
                </div>
                <div
                  v-if="successMessage"
                  class="mb-4 rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-green-800 dark:text-green-200"
                >
                  {{ successMessage }}
                </div>

                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full rounded-lg bg-orange-500 px-4 py-4 text-lg font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span v-if="isSubmitting">Envoi en cours...</span>
                  <span v-else>Soumettre ma demande d'inscription</span>
                </button>
              </div>
            </form>
          </div>

          <!-- form cabinet -->
          <div v-else-if="registrationType === 'CABINET'">
            <button
              class="mb-4 inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
              @click="registrationType = null"
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
              Changer de type
            </button>

            <form class="space-y-6" @submit.prevent="handleCabinetSubmit">
              <div>
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Informations du demandeur
                </h3>
                <div class="space-y-4">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Prénom *</label
                      >
                      <input
                        v-model="cabinetForm.firstName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Nom *</label
                      >
                      <input
                        v-model="cabinetForm.lastName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Email *</label
                    >
                    <input
                      v-model="cabinetForm.email"
                      type="email"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Téléphone *</label
                    >
                    <input
                      v-model="cabinetForm.phone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Informations du cabinet
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Nom du cabinet *</label
                    >
                    <input
                      v-model="cabinetForm.cabinetName"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Adresse du cabinet *</label
                    >
                    <input
                      v-model="cabinetForm.cabinetAddress"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >RCCM (Registre du Commerce)</label
                    >
                    <input
                      v-model="cabinetForm.cabinetRccm"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Responsable administratif
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Nom + Contact du responsable *</label
                    >
                    <input
                      v-model="cabinetForm.adminContactName"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Email du responsable *</label
                    >
                    <input
                      v-model="cabinetForm.adminContactEmail"
                      type="email"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Téléphone du responsable *</label
                    >
                    <input
                      v-model="cabinetForm.adminContactPhone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Document d'enregistrement
                </h3>
                <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Formats acceptés : PDF, JPG, PNG - Max 5 Mo par fichier
                </p>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    RCCM ou document officiel d'enregistrement *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
                    @change="(e: Event) => handleFileChange(e, 'cabinetRegDoc')"
                    required
                  />
                  <p
                    v-if="fileErrors.cabinetRegDoc"
                    class="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {{ fileErrors.cabinetRegDoc }}
                  </p>
                </div>
              </div>

              <!-- submit -->
              <div class="border-t pt-6">
                <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">* Champs obligatoires</p>
                <div
                  class="mb-4 rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/30 p-4 text-sm text-orange-800 dark:text-orange-200"
                >
                  <strong>Note :</strong> Chaque praticien doit s'inscrire
                  individuellement et être vérifié avec son compte personnel.
                  L'administrateur du cabinet pourra ensuite inviter les
                  praticiens vérifiés à rejoindre le cabinet depuis son tableau
                  de bord.
                </div>

                <div
                  v-if="errorMessage"
                  class="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200"
                >
                  {{ errorMessage }}
                </div>
                <div
                  v-if="successMessage"
                  class="mb-4 rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-green-800 dark:text-green-200"
                >
                  {{ successMessage }}
                </div>

                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full rounded-lg bg-purple-600 px-4 py-4 text-lg font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span v-if="isSubmitting">Envoi en cours...</span>
                  <span v-else>Soumettre la demande du cabinet</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- client Type -->
        <div v-else-if="selectedType === 'client'">
          <button
            class="mb-4 inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
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
            <h3 class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Support Client
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Pour toute assistance, veuillez contacter notre support à
              <a href="mailto:support@medicote.ci" class="text-orange-600 dark:text-orange-400">
                support@medicote.ci
              </a>
            </p>
          </div>
        </div>

        <!-- patient Type -->
        <div v-else-if="selectedType === 'patient'">
          <button
            class="mb-4 inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700"
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
            <h3 class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Prendre rendez-vous
            </h3>
            <p class="mb-6 text-gray-600 dark:text-gray-400">
              Pour prendre rendez-vous avec un praticien, veuillez créer un
              compte patient.
            </p>
            <NuxtLink
              to="/auth/register"
              class="inline-block rounded-lg bg-orange-500 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-orange-600"
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
const registrationType = ref<"PRACTITIONER" | "CABINET" | null>(null);
const specialtySearch = ref("");
const showSpecialtyDropdown = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const practitionerForm = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  orderNumber: "",
  clinicAddress: "",
  specialty: "",
});

const cabinetForm = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cabinetName: "",
  cabinetAddress: "",
  cabinetRccm: "",
  adminContactName: "",
  adminContactEmail: "",
  adminContactPhone: "",
});

const uploadedFiles = ref<Record<string, File>>({});
const fileErrors = ref<Record<string, string>>({});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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
  if (!specialtySearch.value) return specialties;
  return specialties.filter((s) =>
    s.toLowerCase().includes(specialtySearch.value.toLowerCase()),
  );
});

function selectSpecialty(sp: string) {
  specialtySearch.value = sp;
  practitionerForm.value.specialty = sp;
  showSpecialtyDropdown.value = false;
}

function handleFileChange(event: Event, fieldName: string) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  fileErrors.value[fieldName] = "";

  if (!file) {
    delete uploadedFiles.value[fieldName];
    return;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    fileErrors.value[fieldName] =
      "Format non autorisé. Utilisez PDF, JPG ou PNG.";
    target.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    fileErrors.value[fieldName] = "Le fichier est trop volumineux (max 5 Mo).";
    target.value = "";
    return;
  }

  uploadedFiles.value[fieldName] = file;
}

async function handlePractitionerSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!practitionerForm.value.specialty && specialtySearch.value) {
    practitionerForm.value.specialty = specialtySearch.value;
  }

  if (!uploadedFiles.value.identityDocument) {
    errorMessage.value = "La carte d'identité / passeport est requis.";
    return;
  }
  if (!uploadedFiles.value.diploma) {
    errorMessage.value = "Le diplôme d'État est requis.";
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("requestType", "PRACTITIONER");
    formData.append("firstName", practitionerForm.value.firstName);
    formData.append("lastName", practitionerForm.value.lastName);
    formData.append("email", practitionerForm.value.email);
    formData.append("phone", practitionerForm.value.phone);
    formData.append("orderNumber", practitionerForm.value.orderNumber);
    formData.append("clinicAddress", practitionerForm.value.clinicAddress);
    if (practitionerForm.value.specialty) {
      formData.append("specialty", practitionerForm.value.specialty);
    }
    formData.append("identityDocument", uploadedFiles.value.identityDocument);
    formData.append("diploma", uploadedFiles.value.diploma);
    if (uploadedFiles.value.orderAttestation) {
      formData.append("orderAttestation", uploadedFiles.value.orderAttestation);
    }

    const config = useRuntimeConfig();
    await $fetch("/contact-requests/register", {
      method: "POST",
      baseURL: config.public.apiBase,
      body: formData,
    });

    successMessage.value =
      "Votre demande d'inscription a été envoyée avec succès. Notre équipe examinera vos documents et vous contactera bientôt.";

    setTimeout(() => {
      navigateTo("/");
    }, 4000);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    errorMessage.value =
      err?.data?.message || "Une erreur est survenue lors de l'envoi.";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleCabinetSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!uploadedFiles.value.cabinetRegDoc) {
    errorMessage.value = "Le document d'enregistrement (RCCM) est requis.";
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("requestType", "CABINET");
    formData.append("firstName", cabinetForm.value.firstName);
    formData.append("lastName", cabinetForm.value.lastName);
    formData.append("email", cabinetForm.value.email);
    formData.append("phone", cabinetForm.value.phone);
    formData.append("cabinetName", cabinetForm.value.cabinetName);
    formData.append("cabinetAddress", cabinetForm.value.cabinetAddress);
    if (cabinetForm.value.cabinetRccm) {
      formData.append("cabinetRccm", cabinetForm.value.cabinetRccm);
    }
    formData.append("adminContactName", cabinetForm.value.adminContactName);
    formData.append("adminContactEmail", cabinetForm.value.adminContactEmail);
    formData.append("adminContactPhone", cabinetForm.value.adminContactPhone);
    formData.append("cabinetRegDoc", uploadedFiles.value.cabinetRegDoc);

    const config = useRuntimeConfig();
    await $fetch("/contact-requests/register", {
      method: "POST",
      baseURL: config.public.apiBase,
      body: formData,
    });

    successMessage.value =
      "Votre demande d'inscription cabinet a été envoyée avec succès. Notre équipe examinera vos documents et vous contactera bientôt.";

    setTimeout(() => {
      navigateTo("/");
    }, 4000);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    errorMessage.value =
      err?.data?.message || "Une erreur est survenue lors de l'envoi.";
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
