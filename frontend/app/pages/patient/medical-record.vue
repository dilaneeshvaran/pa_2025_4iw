<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Mon dossier médical</h1>
      <p class="text-gray-600">
        Gérez vos informations médicales et téléversez vos documents
      </p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="mr-2 inline-block h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'profile'">
      <UiCard>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Informations personnelles
          </h2>
          <UiButton
            v-if="!editingProfile"
            size="sm"
            variant="outline"
            @click="startEditProfile"
          >
            <Pencil class="mr-1.5 h-4 w-4" />
            Modifier
          </UiButton>
        </div>

        <!-- loading -->
        <div v-if="loadingProfile" class="animate-pulse space-y-4">
          <div v-for="i in 4" :key="i" class="h-10 rounded bg-gray-100" />
        </div>
        <!-- view mode -->
        <div v-else-if="!editingProfile && profile" class="space-y-6">
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoField
              label="Nom complet"
              :value="`${profile.firstName} ${profile.lastName}`"
            />
            <InfoField
              label="Âge"
              :value="
                profile.dateOfBirth
                  ? calculateAge(profile.dateOfBirth) + ' ans'
                  : '-'
              "
            />
            <InfoField label="Sexe" :value="formatGender(profile.gender)" />
            <InfoField
              label="Taille"
              :value="profile.height ? `${profile.height} cm` : '-'"
            />
            <InfoField
              label="Poids"
              :value="profile.weight ? `${profile.weight} kg` : '-'"
            />
            <InfoField
              label="Groupe sanguin"
              :value="profile.bloodType || '-'"
            />
            <InfoField label="Téléphone" :value="profile.phone" />
            <InfoField label="Ville" :value="profile.city || '-'" />
            <InfoField label="Adresse" :value="profile.address || '-'" />
          </div>
        </div>

        <!-- edit mode -->
        <form
          v-else-if="editingProfile"
          class="space-y-6"
          @submit.prevent="saveProfile"
        >
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Prénom</label
              >
              <UiInput v-model="profileForm.firstName" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Nom</label
              >
              <UiInput v-model="profileForm.lastName" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Téléphone</label
              >
              <UiInput v-model="profileForm.phone" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Taille (cm)</label
              >
              <UiInput
                v-model="profileForm.height"
                type="number"
                placeholder="ex: 175"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Poids (kg)</label
              >
              <UiInput
                v-model="profileForm.weight"
                type="number"
                placeholder="ex: 70"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Groupe sanguin</label
              >
              <select
                v-model="profileForm.bloodType"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">Non renseigné</option>
                <option v-for="bt in bloodTypes" :key="bt" :value="bt">
                  {{ bt }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Ville</label
              >
              <UiInput v-model="profileForm.city" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Adresse</label
              >
              <UiInput v-model="profileForm.address" />
            </div>
          </div>

          <div class="flex gap-3">
            <UiButton type="submit" :disabled="savingProfile">
              {{ savingProfile ? "Enregistrement..." : "Enregistrer" }}
            </UiButton>
            <UiButton variant="outline" @click="editingProfile = false">
              Annuler
            </UiButton>
          </div>

          <p v-if="profileError" class="text-sm text-red-600">
            {{ profileError }}
          </p>
          <p v-if="profileSuccess" class="text-sm text-green-600">
            {{ profileSuccess }}
          </p>
        </form>
      </UiCard>
    </div>

    <div v-if="activeTab === 'antecedents'">
      <div class="space-y-6">
        <UiCard>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              <AlertTriangle class="mr-2 inline-block h-5 w-5 text-red-500" />
              Allergies
            </h3>
            <UiButton
              size="sm"
              variant="outline"
              @click="openAddModal('allergies')"
            >
              <Plus class="mr-1 h-4 w-4" />
              Ajouter
            </UiButton>
          </div>
          <div v-if="loadingProfile" class="animate-pulse">
            <div class="h-8 rounded bg-gray-100" />
          </div>
          <div
            v-else-if="!profile?.allergies?.length"
            class="py-4 text-center text-gray-500"
          >
            Aucune allergie renseignée
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in profile.allergies"
              :key="idx"
              class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700"
            >
              {{ item }}
              <button
                class="ml-1 rounded-full p-0.5 hover:bg-red-200"
                @click="removeAntecedent('allergies', idx)"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              <Activity class="mr-2 inline-block h-5 w-5 text-orange-500" />
              Maladies chroniques
            </h3>
            <UiButton
              size="sm"
              variant="outline"
              @click="openAddModal('chronicConditions')"
            >
              <Plus class="mr-1 h-4 w-4" />
              Ajouter
            </UiButton>
          </div>
          <div v-if="loadingProfile" class="animate-pulse">
            <div class="h-8 rounded bg-gray-100" />
          </div>
          <div
            v-else-if="!profile?.chronicConditions?.length"
            class="py-4 text-center text-gray-500"
          >
            Aucune maladie chronique renseignée
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in profile.chronicConditions"
              :key="idx"
              class="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700"
            >
              {{ item }}
              <button
                class="ml-1 rounded-full p-0.5 hover:bg-orange-200"
                @click="removeAntecedent('chronicConditions', idx)"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>
        </UiCard>

        <UiCard>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              <Scissors class="mr-2 inline-block h-5 w-5 text-purple-500" />
              Opérations chirurgicales
            </h3>
            <UiButton
              size="sm"
              variant="outline"
              @click="openAddModal('surgicalOperations')"
            >
              <Plus class="mr-1 h-4 w-4" />
              Ajouter
            </UiButton>
          </div>
          <div v-if="loadingProfile" class="animate-pulse">
            <div class="h-8 rounded bg-gray-100" />
          </div>
          <div
            v-else-if="!profile?.surgicalOperations?.length"
            class="py-4 text-center text-gray-500"
          >
            Aucune opération chirurgicale renseignée
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(item, idx) in profile.surgicalOperations"
              :key="idx"
              class="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
            >
              {{ item }}
              <button
                class="ml-1 rounded-full p-0.5 hover:bg-purple-200"
                @click="removeAntecedent('surgicalOperations', idx)"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>
        </UiCard>
      </div>
    </div>

    <div v-if="activeTab === 'consultations'">
      <UiCard>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          Historique des consultations
        </h2>

        <div v-if="loadingConsultations" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-24 rounded-lg bg-gray-100" />
        </div>

        <div v-else-if="consultations.length === 0" class="py-8 text-center">
          <Stethoscope class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucune consultation passée</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="consultation in consultations"
            :key="consultation.id"
            class="rounded-lg border border-gray-200 p-4"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium text-gray-900">
                  {{ consultation.practitioner.title }}
                  {{ consultation.practitioner.firstName }}
                  {{ consultation.practitioner.lastName }}
                </p>
                <p class="text-sm text-gray-500">
                  {{
                    consultation.practitioner.specialty || "Médecin généraliste"
                  }}
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  <Calendar class="mr-1 inline-block h-3.5 w-3.5" />
                  {{ formatDate(consultation.appointmentDate) }}
                  · {{ consultation.startTime }} - {{ consultation.endTime }}
                </p>
                <p
                  v-if="consultation.reason"
                  class="mt-1 text-sm text-gray-500"
                >
                  Motif : {{ consultation.reason }}
                </p>
              </div>
              <UiBadge
                :variant="
                  consultation.status === 'COMPLETED' ? 'success' : 'warning'
                "
              >
                {{ consultation.status === "COMPLETED" ? "Terminé" : "Absent" }}
              </UiBadge>
            </div>

            <div v-if="consultation.medicalRecord" class="mt-3 border-t pt-3">
              <button
                class="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                @click="toggleConsultationDetails(consultation.id)"
              >
                <ChevronDown
                  :class="[
                    'h-4 w-4 transition-transform',
                    expandedConsultations.has(consultation.id) && 'rotate-180',
                  ]"
                />
                {{
                  expandedConsultations.has(consultation.id)
                    ? "Masquer"
                    : "Voir"
                }}
                les détails
              </button>

              <div
                v-if="expandedConsultations.has(consultation.id)"
                class="mt-3 space-y-2 text-sm"
              >
                <p v-if="consultation.medicalRecord.chiefComplaint">
                  <span class="font-medium text-gray-700">Motif :</span>
                  {{ consultation.medicalRecord.chiefComplaint }}
                </p>
                <p v-if="consultation.medicalRecord.diagnosis">
                  <span class="font-medium text-gray-700">Diagnostic :</span>
                  {{ consultation.medicalRecord.diagnosis }}
                </p>
                <p v-if="consultation.medicalRecord.treatmentPlan">
                  <span class="font-medium text-gray-700"
                    >Plan de traitement :</span
                  >
                  {{ consultation.medicalRecord.treatmentPlan }}
                </p>

                <div
                  v-if="
                    consultation.medicalRecord.bloodPressure ||
                    consultation.medicalRecord.heartRate ||
                    consultation.medicalRecord.temperature
                  "
                  class="mt-2 flex flex-wrap gap-3"
                >
                  <span
                    v-if="consultation.medicalRecord.bloodPressure"
                    class="rounded bg-gray-100 px-2 py-1 text-xs"
                  >
                    TA: {{ consultation.medicalRecord.bloodPressure }}
                  </span>
                  <span
                    v-if="consultation.medicalRecord.heartRate"
                    class="rounded bg-gray-100 px-2 py-1 text-xs"
                  >
                    FC: {{ consultation.medicalRecord.heartRate }} bpm
                  </span>
                  <span
                    v-if="consultation.medicalRecord.temperature"
                    class="rounded bg-gray-100 px-2 py-1 text-xs"
                  >
                    T°: {{ consultation.medicalRecord.temperature }}°C
                  </span>
                </div>

                <div
                  v-if="consultation.medicalRecord.documents?.length"
                  class="mt-2"
                >
                  <p class="mb-1 font-medium text-gray-700">Documents :</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="doc in consultation.medicalRecord.documents"
                      :key="doc.id"
                      class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                      @click="downloadDocument(doc.id, doc.fileName)"
                    >
                      <Download class="h-3.5 w-3.5" />
                      {{ doc.title || doc.fileName }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="consultationsPagination.totalPages > 1"
            class="mt-4 flex items-center justify-center gap-2"
          >
            <UiButton
              size="sm"
              variant="outline"
              :disabled="consultationsPagination.page <= 1"
              @click="fetchConsultations(consultationsPagination.page - 1)"
            >
              Précédent
            </UiButton>
            <span class="text-sm text-gray-600">
              Page {{ consultationsPagination.page }} /
              {{ consultationsPagination.totalPages }}
            </span>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="
                consultationsPagination.page >=
                consultationsPagination.totalPages
              "
              @click="fetchConsultations(consultationsPagination.page + 1)"
            >
              Suivant
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <div v-if="activeTab === 'documents'">
      <!-- search + view toggle + upload -->
      <div
        class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="relative flex-1 sm:max-w-md">
          <SearchIcon
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="docSearchQuery"
            type="text"
            placeholder="Rechercher un document..."
            class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            @input="debouncedDocSearch"
          />
          <button
            v-if="docSearchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="clearDocSearch"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-1 rounded-lg border border-gray-200 p-1"
          >
            <button
              :class="[
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                docViewMode === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ]"
              @click="docViewMode = 'card'"
            >
              <LayoutGrid class="inline-block h-4 w-4" />
            </button>
            <button
              :class="[
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                docViewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ]"
              @click="docViewMode = 'list'"
            >
              <ListIcon class="inline-block h-4 w-4" />
            </button>
          </div>
          <UiButton size="sm" @click="openDocUploadModal">
            <Upload class="mr-1.5 h-4 w-4" />
            Téléverser
          </UiButton>
        </div>
      </div>

      <!-- document sub tabs for type filter -->
      <div class="mb-4 flex gap-2 overflow-x-auto">
        <button
          v-for="st in docSubTabs"
          :key="st.key"
          :class="[
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            docActiveSubTab === st.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ]"
          @click="switchDocSubTab(st.key)"
        >
          {{ st.label }}
          <span
            :class="[
              'ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs',
              docActiveSubTab === st.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700',
            ]"
          >
            {{ getDocSubTabCount(st.key) }}
          </span>
        </button>
      </div>

      <UiCard>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          Mes documents médicaux
        </h2>

        <div v-if="loadingDocuments" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100" />
        </div>

        <div v-else-if="documents.length === 0" class="py-8 text-center">
          <FileSearch class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">
            {{
              docSearchQuery
                ? "Aucun document ne correspond à votre recherche"
                : "Téléversez vos documents médicaux ici"
            }}
          </p>
          <UiButton size="sm" class="mt-3" @click="openDocUploadModal">
            <Upload class="mr-1.5 h-4 w-4" />
            Ajouter un document
          </UiButton>
        </div>

        <!-- card view -->
        <div
          v-else-if="docViewMode === 'card'"
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="group rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
          >
            <div class="mb-2 flex items-start justify-between">
              <div
                :class="[
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  getDocTypeColor(doc.type),
                ]"
              >
                <component :is="getDocTypeIcon(doc.type)" class="h-5 w-5" />
              </div>
              <div class="flex items-center gap-1">
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    getDocTypeBadgeColor(doc.type),
                  ]"
                >
                  {{ getDocTypeLabel(doc.type) }}
                </span>
                <button
                  class="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Supprimer"
                  @click="deleteOwnDocument(doc.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            <h3 class="mb-1 line-clamp-2 font-medium text-gray-900">
              {{ doc.title }}
            </h3>
            <p class="mb-3 text-xs text-gray-400">
              {{ formatDate(doc.uploadedAt) }} ·
              {{ formatFileSize(doc.fileSize) }}
            </p>
            <div class="flex gap-2">
              <button
                v-if="isPdf(doc.mimeType)"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="viewOwnDocument(doc)"
              >
                <Eye class="h-4 w-4" />
                Lire
              </button>
              <button
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                @click="downloadDocument(doc.id, doc.fileName)"
              >
                <Download class="mr-1 h-4 w-4" />
                Télécharger
              </button>
            </div>
          </div>
        </div>

        <!-- list view -->
        <div v-else class="space-y-2">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                  getDocTypeColor(doc.type),
                ]"
              >
                <component :is="getDocTypeIcon(doc.type)" class="h-5 w-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900">{{ doc.title }}</p>
                  <span
                    :class="[
                      'hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex',
                      getDocTypeBadgeColor(doc.type),
                    ]"
                  >
                    {{ getDocTypeLabel(doc.type) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500">
                  {{ formatDate(doc.uploadedAt) }} ·
                  {{ formatFileSize(doc.fileSize) }}
                </p>
              </div>
            </div>
            <div class="ml-4 flex flex-shrink-0 items-center gap-1">
              <button
                v-if="isPdf(doc.mimeType)"
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                title="Lire"
                @click="viewOwnDocument(doc)"
              >
                <Eye class="h-5 w-5" />
              </button>
              <button
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                title="Télécharger"
                @click="downloadDocument(doc.id, doc.fileName)"
              >
                <Download class="h-5 w-5" />
              </button>
              <button
                class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Supprimer"
                @click="deleteOwnDocument(doc.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- pagination -->
        <div
          v-if="documentsPagination.totalPages > 1"
          class="mt-4 flex items-center justify-center gap-2"
        >
          <UiButton
            size="sm"
            variant="outline"
            :disabled="documentsPagination.page <= 1"
            @click="fetchDocuments(documentsPagination.page - 1)"
          >
            Précédent
          </UiButton>
          <span class="text-sm text-gray-600">
            Page {{ documentsPagination.page }} /
            {{ documentsPagination.totalPages }}
          </span>
          <UiButton
            size="sm"
            variant="outline"
            :disabled="
              documentsPagination.page >= documentsPagination.totalPages
            "
            @click="fetchDocuments(documentsPagination.page + 1)"
          >
            Suivant
          </UiButton>
        </div>
      </UiCard>
    </div>

    <div v-if="activeTab === 'vaccinations'">
      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Carnet de vaccination
          </h2>
          <UiButton size="sm" @click="openVaccinationModal">
            <Plus class="mr-1 h-4 w-4" />
            Ajouter
          </UiButton>
        </div>

        <div v-if="loadingVaccinations" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-gray-100" />
        </div>

        <div v-else-if="vaccinations.length === 0" class="py-8 text-center">
          <Syringe class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucune vaccination enregistrée</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="vac in vaccinations"
            :key="vac.id"
            class="rounded-lg border border-gray-200 p-4"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ vac.vaccineName }}</p>
                <p v-if="vac.vaccineType" class="text-sm text-gray-500">
                  {{ vac.vaccineType }}
                </p>
                <div class="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>
                    <Calendar class="mr-1 inline-block h-3.5 w-3.5" />
                    {{ formatDate(vac.administeredAt) }}
                  </span>
                  <span v-if="vac.doseNumber"> Dose {{ vac.doseNumber }} </span>
                  <span v-if="vac.manufacturer">
                    {{ vac.manufacturer }}
                  </span>
                </div>
                <p v-if="vac.nextDoseDate" class="mt-1 text-sm text-blue-600">
                  Prochaine dose : {{ formatDate(vac.nextDoseDate) }}
                </p>
                <p v-if="vac.administeredBy" class="text-xs text-gray-400">
                  Par : {{ vac.administeredBy }}
                  <span v-if="vac.location"> · {{ vac.location }}</span>
                </p>
              </div>
              <button
                class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Supprimer"
                @click="deleteVaccination(vac.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- antecedent modal -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAddModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            {{ addModalTitle }}
          </h3>
          <form @submit.prevent="confirmAddAntecedent">
            <UiInput
              v-model="newAntecedentValue"
              :placeholder="addModalPlaceholder"
              class="mb-4"
            />
            <div class="flex gap-3">
              <UiButton type="submit" :disabled="!newAntecedentValue.trim()">
                Ajouter
              </UiButton>
              <UiButton variant="outline" @click="showAddModal = false">
                Annuler
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showVaccinationModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showVaccinationModal = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            Ajouter une vaccination
          </h3>
          <form class="space-y-4" @submit.prevent="confirmAddVaccination">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Nom du vaccin *
                </label>
                <UiInput
                  v-model="vaccinationForm.vaccineName"
                  placeholder="ex: Hépatite B"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Type</label
                >
                <UiInput
                  v-model="vaccinationForm.vaccineType"
                  placeholder="ex: COVID-19"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Fabricant</label
                >
                <UiInput
                  v-model="vaccinationForm.manufacturer"
                  placeholder="ex: Pfizer"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Date d'administration *
                </label>
                <input
                  v-model="vaccinationForm.administeredAt"
                  type="date"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >N° de dose</label
                >
                <UiInput
                  v-model="vaccinationForm.doseNumber"
                  type="number"
                  placeholder="1"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Administré par</label
                >
                <UiInput
                  v-model="vaccinationForm.administeredBy"
                  placeholder="Nom du praticien"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Lieu</label
                >
                <UiInput
                  v-model="vaccinationForm.location"
                  placeholder="Centre de santé"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Prochaine dose
                </label>
                <input
                  v-model="vaccinationForm.nextDoseDate"
                  type="date"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >N° de lot</label
                >
                <UiInput v-model="vaccinationForm.batchNumber" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Effets secondaires
                </label>
                <textarea
                  v-model="vaccinationForm.sideEffects"
                  rows="2"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <p v-if="vaccinationError" class="text-sm text-red-600">
              {{ vaccinationError }}
            </p>

            <div class="flex gap-3">
              <UiButton
                type="submit"
                :disabled="
                  savingVaccination ||
                  !vaccinationForm.vaccineName ||
                  !vaccinationForm.administeredAt
                "
              >
                {{ savingVaccination ? "Ajout..." : "Ajouter" }}
              </UiButton>
              <UiButton variant="outline" @click="showVaccinationModal = false">
                Annuler
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
    <!-- doc upload modal -->
    <Teleport to="body">
      <div
        v-if="showDocUploadModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDocUploadModal = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            Téléverser un document
          </h3>
          <form class="space-y-4" @submit.prevent="confirmDocUpload">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Titre *
              </label>
              <UiInput
                v-model="docUploadForm.title"
                placeholder="ex: Analyse de sang - Janvier 2026"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Type de document *
              </label>
              <select
                v-model="docUploadForm.type"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="LAB_RESULT">Résultat d'analyse</option>
                <option value="RADIOLOGY">Imagerie médicale</option>
                <option value="MEDICAL_REPORT">Rapport médical</option>
                <option value="CERTIFICATE">Certificat</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                v-model="docUploadForm.description"
                rows="2"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                placeholder="Optionnel"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Fichier *
              </label>
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                @change="handleFileSelect"
              />
              <p class="mt-1 text-xs text-gray-400">
                PDF, image ou document Word (max 10 Mo)
              </p>
            </div>

            <p v-if="docUploadError" class="text-sm text-red-600">
              {{ docUploadError }}
            </p>

            <div class="flex gap-3">
              <UiButton
                type="submit"
                :disabled="
                  uploadingDoc || !docUploadForm.title || !docUploadFile
                "
              >
                {{ uploadingDoc ? "Téléversement..." : "Téléverser" }}
              </UiButton>
              <UiButton variant="outline" @click="showDocUploadModal = false">
                Annuler
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- pdf view modal -->
    <Teleport to="body">
      <div
        v-if="showDocViewer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="showDocViewer = false"
      >
        <div
          class="relative mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl"
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="font-semibold text-gray-900">{{ docViewerTitle }}</h3>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                @click="showDocViewer = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <iframe
              v-if="docViewerUrl"
              :src="docViewerUrl"
              class="h-full w-full"
              frameborder="0"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  User as UserIcon,
  Calendar,
  Pencil,
  Plus,
  X,
  Download,
  Trash2,
  AlertTriangle,
  Activity,
  Scissors,
  ChevronDown,
  Stethoscope,
  Pill,
  Syringe,
  TestTubes,
  FileSearch,
  FileText,
  Heart,
  Shield,
  Search as SearchIcon,
  LayoutGrid,
  List as ListIcon,
  Upload,
  Eye,
  Award,
  FolderOpen,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { formatDate } from "~/utils/date";
import {
  getDocTypeLabel,
  getDocTypeColor,
  getDocTypeBadgeColor,
} from "~/utils/docType";

import type { Component } from "vue";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

type TabKey =
  | "profile"
  | "antecedents"
  | "consultations"
  | "documents"
  | "vaccinations";

const tabs: { key: TabKey; label: string; icon: Component }[] = [
  { key: "profile", label: "Informations personnelles", icon: UserIcon },
  { key: "antecedents", label: "Antécédents", icon: Heart },
  {
    key: "consultations",
    label: "Historique des consultations",
    icon: Stethoscope,
  },
  { key: "documents", label: "Documents de mon dossier", icon: FolderOpen },
  { key: "vaccinations", label: "Carnet de vaccination", icon: Shield },
];

const activeTab = ref<TabKey>("profile");

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string | null;
  city: string | null;
  country: string;
  bloodType: string | null;
  height: number | null;
  weight: number | null;
  allergies: string[];
  chronicConditions: string[];
  surgicalOperations: string[];
}

const profile = ref<Profile | null>(null);
const loadingProfile = ref(true);
const editingProfile = ref(false);
const savingProfile = ref(false);
const profileError = ref("");
const profileSuccess = ref("");

const profileForm = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  height: "" as string | number,
  weight: "" as string | number,
  bloodType: "",
  city: "",
  address: "",
});

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const showAddModal = ref(false);
const addModalCategory = ref<
  "allergies" | "chronicConditions" | "surgicalOperations"
>("allergies");
const newAntecedentValue = ref("");

const addModalTitle = computed(() => {
  const titles = {
    allergies: "Ajouter une allergie",
    chronicConditions: "Ajouter une maladie chronique",
    surgicalOperations: "Ajouter une opération chirurgicale",
  };
  return titles[addModalCategory.value];
});

const addModalPlaceholder = computed(() => {
  const placeholders = {
    allergies: "ex: Pénicilline",
    chronicConditions: "ex: Diabète de type 2",
    surgicalOperations: "ex: Appendicectomie (2020)",
  };
  return placeholders[addModalCategory.value];
});

interface Consultation {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason: string | null;
  practitioner: {
    firstName: string;
    lastName: string;
    title: string;
    specialty: string | null;
  };
  medicalRecord: {
    id: string;
    chiefComplaint: string | null;
    diagnosis: string | null;
    treatmentPlan: string | null;
    bloodPressure: string | null;
    heartRate: number | null;
    temperature: number | null;
    weight: number | null;
    height: number | null;
    documents: {
      id: string;
      type: string;
      title: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      uploadedAt: string;
    }[];
  } | null;
}

const consultations = ref<Consultation[]>([]);
const loadingConsultations = ref(false);
const expandedConsultations = ref(new Set<string>());
const consultationsPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

interface PrescriptionItem {
  id: string;
  medications: Record<string, unknown>[] | string;
  issuedDate: string;
  validUntil: string | null;
  practitioner: {
    firstName: string;
    lastName: string;
    title: string;
  };
  medicalRecord: {
    appointment: {
      appointmentDate: string;
    };
  };
}

const prescriptions = ref<PrescriptionItem[]>([]);
const loadingPrescriptions = ref(false);
const prescriptionsPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

interface DocItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const documents = ref<DocItem[]>([]);
const loadingDocuments = ref(false);
const documentsPagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
});

// document sub tabs, search, view mode
type DocSubTab = "all" | "exams" | "certificates" | "others";
const docSubTabs = [
  { key: "all" as DocSubTab, label: "Tous" },
  { key: "exams" as DocSubTab, label: "Examens" },
  { key: "certificates" as DocSubTab, label: "Certificats" },
  { key: "others" as DocSubTab, label: "Autres" },
];
const docActiveSubTab = ref<DocSubTab>("all");
const docViewMode = ref<"card" | "list">("card");
const docSearchQuery = ref("");
const docCounts = ref({
  all: 0,
  exams: 0,
  certificates: 0,
  others: 0,
});

// Upload modal
const showDocUploadModal = ref(false);
const uploadingDoc = ref(false);
const docUploadError = ref("");
const docUploadFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const docUploadForm = reactive({
  title: "",
  type: "OTHER" as string,
  description: "",
});

// viewer of pdf
const showDocViewer = ref(false);
const docViewerUrl = ref("");
const docViewerTitle = ref("");

interface VaccinationItem {
  id: string;
  vaccineName: string;
  vaccineType: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  doseNumber: number;
  administeredAt: string;
  administeredBy: string | null;
  location: string | null;
  nextDoseDate: string | null;
  sideEffects: string | null;
}

const vaccinations = ref<VaccinationItem[]>([]);
const loadingVaccinations = ref(false);

const showVaccinationModal = ref(false);
const savingVaccination = ref(false);
const vaccinationError = ref("");

const vaccinationForm = reactive({
  vaccineName: "",
  vaccineType: "",
  manufacturer: "",
  batchNumber: "",
  doseNumber: "" as string | number,
  administeredAt: "",
  administeredBy: "",
  location: "",
  nextDoseDate: "",
  sideEffects: "",
});

const InfoField = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", [
        h("p", { class: "text-sm font-medium text-gray-500" }, props.label),
        h("p", { class: "mt-1 text-base text-gray-900" }, props.value),
      ]);
  },
});

const calculateAge = (dateStr: string) => {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatGender = (gender: string) => {
  const map: Record<string, string> = {
    MALE: "Homme",
    FEMALE: "Femme",
    OTHER: "Autre",
    PREFER_NOT_TO_SAY: "Non précisé",
  };
  return map[gender] || gender;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const _parseMedications = (meds: Record<string, unknown>[] | string) => {
  if (!meds) return [];
  if (Array.isArray(meds)) return meds;
  try {
    return JSON.parse(meds);
  } catch {
    return [];
  }
};

const getDocTypeIcon = (type: string) => {
  const icons: Record<string, Component> = {
    PRESCRIPTION: Pill,
    LAB_RESULT: TestTubes,
    RADIOLOGY: FileSearch,
    MEDICAL_REPORT: FileText,
    CERTIFICATE: Award,
    OTHER: FileText,
  };
  return icons[type] || FileText;
};

const isPdf = (mimeType: string) => mimeType === "application/pdf";

const getDocSubTabCount = (key: DocSubTab) => docCounts.value[key] ?? 0;

const fetchProfile = async () => {
  loadingProfile.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Profile;
    }>("/medical-records/profile");
    if (response.success) {
      profile.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  } finally {
    loadingProfile.value = false;
  }
};

const startEditProfile = () => {
  if (!profile.value) return;
  profileForm.firstName = profile.value.firstName;
  profileForm.lastName = profile.value.lastName;
  profileForm.phone = profile.value.phone;
  profileForm.height = profile.value.height ?? "";
  profileForm.weight = profile.value.weight ?? "";
  profileForm.bloodType = profile.value.bloodType ?? "";
  profileForm.city = profile.value.city ?? "";
  profileForm.address = profile.value.address ?? "";
  profileError.value = "";
  profileSuccess.value = "";
  editingProfile.value = true;
};

const saveProfile = async () => {
  savingProfile.value = true;
  profileError.value = "";
  profileSuccess.value = "";

  try {
    const body: Record<string, string | number> = {};
    if (profileForm.firstName) body.firstName = profileForm.firstName;
    if (profileForm.lastName) body.lastName = profileForm.lastName;
    if (profileForm.phone) body.phone = profileForm.phone;
    if (profileForm.height !== "" && profileForm.height !== null)
      body.height = Number(profileForm.height);
    if (profileForm.weight !== "" && profileForm.weight !== null)
      body.weight = Number(profileForm.weight);
    if (profileForm.bloodType) body.bloodType = profileForm.bloodType;
    if (profileForm.city !== undefined) body.city = profileForm.city;
    if (profileForm.address !== undefined) body.address = profileForm.address;

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Profile;
      message: string;
    }>("/medical-records/profile", {
      method: "PATCH",
      body,
    });

    if (response.success) {
      profile.value = response.data;
      profileSuccess.value = response.message;
      editingProfile.value = false;
    }
  } catch (error: unknown) {
    profileError.value =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la mise à jour du profil";
  } finally {
    savingProfile.value = false;
  }
};

const openAddModal = (
  category: "allergies" | "chronicConditions" | "surgicalOperations",
) => {
  addModalCategory.value = category;
  newAntecedentValue.value = "";
  showAddModal.value = true;
};

const confirmAddAntecedent = async () => {
  if (!profile.value || !newAntecedentValue.value.trim()) return;

  const category = addModalCategory.value;
  const updated = [
    ...(profile.value[category] || []),
    newAntecedentValue.value.trim(),
  ];

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        allergies: string[];
        chronicConditions: string[];
        surgicalOperations: string[];
      };
    }>("/medical-records/antecedents", {
      method: "PATCH",
      body: { [category]: updated },
    });

    if (response.success) {
      profile.value.allergies = response.data.allergies;
      profile.value.chronicConditions = response.data.chronicConditions;
      profile.value.surgicalOperations = response.data.surgicalOperations;
    }
  } catch (error) {
    console.error("Error adding antecedent:", error);
  }

  showAddModal.value = false;
};

const removeAntecedent = async (
  category: "allergies" | "chronicConditions" | "surgicalOperations",
  index: number,
) => {
  if (!profile.value) return;

  const updated = [...profile.value[category]];
  updated.splice(index, 1);

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        allergies: string[];
        chronicConditions: string[];
        surgicalOperations: string[];
      };
    }>("/medical-records/antecedents", {
      method: "PATCH",
      body: { [category]: updated },
    });

    if (response.success) {
      profile.value.allergies = response.data.allergies;
      profile.value.chronicConditions = response.data.chronicConditions;
      profile.value.surgicalOperations = response.data.surgicalOperations;
    }
  } catch (error) {
    console.error("Error removing antecedent:", error);
  }
};

const fetchConsultations = async (page = 1) => {
  loadingConsultations.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Consultation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/medical-records/consultations?page=${page}&limit=10`);

    if (response.success) {
      consultations.value = response.data;
      Object.assign(consultationsPagination, response.pagination);
    }
  } catch (error) {
    console.error("Error fetching consultations:", error);
  } finally {
    loadingConsultations.value = false;
  }
};

const toggleConsultationDetails = (id: string) => {
  if (expandedConsultations.value.has(id)) {
    expandedConsultations.value.delete(id);
  } else {
    expandedConsultations.value.add(id);
  }
};

const _fetchPrescriptions = async (page = 1) => {
  loadingPrescriptions.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: PrescriptionItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/medical-records/prescriptions?page=${page}&limit=10`);

    if (response.success) {
      prescriptions.value = response.data;
      Object.assign(prescriptionsPagination, response.pagination);
    }
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
  } finally {
    loadingPrescriptions.value = false;
  }
};

const fetchDocuments = async (page = 1) => {
  loadingDocuments.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(documentsPagination.limit),
      type: docActiveSubTab.value,
    });
    if (docSearchQuery.value) {
      params.set("search", docSearchQuery.value);
    }

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DocItem[];
      counts: typeof docCounts.value;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/documents/own?${params.toString()}`);

    if (response.success) {
      documents.value = response.data;
      docCounts.value = response.counts;
      Object.assign(documentsPagination, response.pagination);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
  } finally {
    loadingDocuments.value = false;
  }
};

const switchDocSubTab = (tab: DocSubTab) => {
  docActiveSubTab.value = tab;
  fetchDocuments(1);
};

let docSearchTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedDocSearch = () => {
  if (docSearchTimeout) clearTimeout(docSearchTimeout);
  docSearchTimeout = setTimeout(() => {
    fetchDocuments(1);
  }, 400);
};

const clearDocSearch = () => {
  docSearchQuery.value = "";
  fetchDocuments(1);
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    docUploadFile.value = target.files[0] || null;
  }
};

const openDocUploadModal = () => {
  docUploadForm.title = "";
  docUploadForm.type = "OTHER";
  docUploadForm.description = "";
  docUploadFile.value = null;
  docUploadError.value = "";
  showDocUploadModal.value = true;
};

const confirmDocUpload = async () => {
  if (!docUploadFile.value || !docUploadForm.title) return;

  uploadingDoc.value = true;
  docUploadError.value = "";

  try {
    const formData = new FormData();
    formData.append("file", docUploadFile.value);
    formData.append("title", docUploadForm.title);
    formData.append("type", docUploadForm.type);
    if (docUploadForm.description) {
      formData.append("description", docUploadForm.description);
    }

    const response = await fetch(`${config.public.apiBase}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Erreur lors du téléversement");
    }

    showDocUploadModal.value = false;
    await fetchDocuments(1);
  } catch (error: unknown) {
    docUploadError.value =
      (error as Error)?.message || "Erreur lors du téléversement";
  } finally {
    uploadingDoc.value = false;
  }
};

const deleteOwnDocument = async (docId: string) => {
  if (!confirm("Supprimer ce document ?")) return;
  try {
    await useAuthenticatedFetch(`/documents/${docId}`, { method: "DELETE" });
    await fetchDocuments(documentsPagination.page);
  } catch (error) {
    console.error("Error deleting document:", error);
    alert("Erreur lors de la suppression du document");
  }
};

const viewOwnDocument = (doc: DocItem) => {
  docViewerTitle.value = doc.title;
  const url = `${config.public.apiBase}/documents/${doc.id}/view`;
  fetch(url, {
    headers: { Authorization: `Bearer ${authStore.accessToken}` },
  })
    .then((r) => r.blob())
    .then((blob) => {
      docViewerUrl.value = URL.createObjectURL(blob);
      showDocViewer.value = true;
    })
    .catch(() => {
      alert("Erreur lors de l'ouverture du document");
    });
};

const downloadDocument = async (docId: string, fileName: string) => {
  try {
    const url = `${config.public.apiBase}/documents/${docId}/download`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading document:", error);
    alert("Erreur lors du téléchargement du document");
  }
};

const fetchVaccinations = async () => {
  loadingVaccinations.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: VaccinationItem[];
    }>("/medical-records/vaccinations");

    if (response.success) {
      vaccinations.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
  } finally {
    loadingVaccinations.value = false;
  }
};

const openVaccinationModal = () => {
  Object.assign(vaccinationForm, {
    vaccineName: "",
    vaccineType: "",
    manufacturer: "",
    batchNumber: "",
    doseNumber: "",
    administeredAt: "",
    administeredBy: "",
    location: "",
    nextDoseDate: "",
    sideEffects: "",
  });
  vaccinationError.value = "";
  showVaccinationModal.value = true;
};

const confirmAddVaccination = async () => {
  savingVaccination.value = true;
  vaccinationError.value = "";

  try {
    const body: Record<string, string | number> = {
      vaccineName: vaccinationForm.vaccineName,
      administeredAt: vaccinationForm.administeredAt,
    };

    if (vaccinationForm.vaccineType)
      body.vaccineType = vaccinationForm.vaccineType;
    if (vaccinationForm.manufacturer)
      body.manufacturer = vaccinationForm.manufacturer;
    if (vaccinationForm.batchNumber)
      body.batchNumber = vaccinationForm.batchNumber;
    if (vaccinationForm.doseNumber)
      body.doseNumber = Number(vaccinationForm.doseNumber);
    if (vaccinationForm.administeredBy)
      body.administeredBy = vaccinationForm.administeredBy;
    if (vaccinationForm.location) body.location = vaccinationForm.location;
    if (vaccinationForm.nextDoseDate)
      body.nextDoseDate = vaccinationForm.nextDoseDate;
    if (vaccinationForm.sideEffects)
      body.sideEffects = vaccinationForm.sideEffects;

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: VaccinationItem;
    }>("/medical-records/vaccinations", {
      method: "POST",
      body,
    });

    if (response.success) {
      vaccinations.value.unshift(response.data);
      showVaccinationModal.value = false;
    }
  } catch (error: unknown) {
    vaccinationError.value =
      (error as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de l'ajout de la vaccination";
  } finally {
    savingVaccination.value = false;
  }
};

const deleteVaccination = async (id: string) => {
  if (!confirm("Supprimer cette vaccination ?")) return;

  try {
    await useAuthenticatedFetch(`/medical-records/vaccinations/${id}`, {
      method: "DELETE",
    });
    vaccinations.value = vaccinations.value.filter((v) => v.id !== id);
  } catch (error) {
    console.error("Error deleting vaccination:", error);
    alert("Erreur lors de la suppression");
  }
};

watch(activeTab, (tab) => {
  if (tab === "consultations" && consultations.value.length === 0) {
    fetchConsultations();
  } else if (tab === "documents" && documents.value.length === 0) {
    fetchDocuments();
  } else if (tab === "vaccinations" && vaccinations.value.length === 0) {
    fetchVaccinations();
  }
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchProfile();
  } else {
    loadingProfile.value = false;
  }
});
</script>
