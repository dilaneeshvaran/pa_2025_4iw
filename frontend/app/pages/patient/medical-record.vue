<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Mon dossier médical</h1>
      <p class="text-gray-600">Consultez et gérez vos informations médicales</p>
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
                  : '—'
              "
            />
            <InfoField label="Sexe" :value="formatGender(profile.gender)" />
            <InfoField
              label="Taille"
              :value="profile.height ? `${profile.height} cm` : '—'"
            />
            <InfoField
              label="Poids"
              :value="profile.weight ? `${profile.weight} kg` : '—'"
            />
            <InfoField
              label="Groupe sanguin"
              :value="profile.bloodType || '—'"
            />
            <InfoField label="Téléphone" :value="profile.phone" />
            <InfoField label="Ville" :value="profile.city || '—'" />
            <InfoField label="Adresse" :value="profile.address || '—'" />
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

    <div v-if="activeTab === 'prescriptions'">
      <UiCard>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Ordonnances</h2>

        <div v-if="loadingPrescriptions" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-gray-100" />
        </div>

        <div v-else-if="prescriptions.length === 0" class="py-8 text-center">
          <Pill class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucune ordonnance</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="prescription in prescriptions"
            :key="prescription.id"
            class="rounded-lg border border-gray-200 p-4"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium text-gray-900">
                  {{ prescription.practitioner.title }}
                  {{ prescription.practitioner.firstName }}
                  {{ prescription.practitioner.lastName }}
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  <Calendar class="mr-1 inline-block h-3.5 w-3.5" />
                  {{ formatDate(prescription.issuedDate) }}
                </p>
                <p v-if="prescription.validUntil" class="text-xs text-gray-500">
                  Valide jusqu'au {{ formatDate(prescription.validUntil) }}
                </p>
              </div>
            </div>

            <div class="mt-3 border-t pt-3">
              <p class="mb-2 text-sm font-medium text-gray-700">
                Médicaments :
              </p>
              <div class="space-y-2">
                <div
                  v-for="(med, idx) in parseMedications(
                    prescription.medications,
                  )"
                  :key="idx"
                  class="rounded bg-gray-50 p-2 text-sm"
                >
                  <p class="font-medium text-gray-800">{{ med.name }}</p>
                  <p v-if="med.dosage" class="text-gray-600">
                    {{ med.dosage }}
                    <span v-if="med.frequency"> · {{ med.frequency }}</span>
                    <span v-if="med.duration"> · {{ med.duration }}</span>
                  </p>
                  <p v-if="med.instructions" class="text-xs text-gray-500">
                    {{ med.instructions }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- pagination -->
          <div
            v-if="prescriptionsPagination.totalPages > 1"
            class="mt-4 flex items-center justify-center gap-2"
          >
            <UiButton
              size="sm"
              variant="outline"
              :disabled="prescriptionsPagination.page <= 1"
              @click="fetchPrescriptions(prescriptionsPagination.page - 1)"
            >
              Précédent
            </UiButton>
            <span class="text-sm text-gray-600">
              Page {{ prescriptionsPagination.page }} /
              {{ prescriptionsPagination.totalPages }}
            </span>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="
                prescriptionsPagination.page >=
                prescriptionsPagination.totalPages
              "
              @click="fetchPrescriptions(prescriptionsPagination.page + 1)"
            >
              Suivant
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <div v-if="activeTab === 'documents'">
      <UiCard>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          Examens et analyses
        </h2>

        <div v-if="loadingDocuments" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100" />
        </div>

        <div v-else-if="documents.length === 0" class="py-8 text-center">
          <FileSearch class="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p class="text-gray-500">Aucun examen ou analyse disponible</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  getDocTypeColor(doc.type),
                ]"
              >
                <component :is="getDocTypeIcon(doc.type)" class="h-5 w-5" />
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ doc.title }}</p>
                <p class="text-sm text-gray-500">
                  {{ getDocTypeLabel(doc.type) }}
                  <span v-if="doc.medicalRecord">
                    · {{ doc.medicalRecord.practitioner.title }}
                    {{ doc.medicalRecord.practitioner.lastName }}
                  </span>
                </p>
                <p class="text-xs text-gray-400">
                  {{ formatDate(doc.uploadedAt) }} ·
                  {{ formatFileSize(doc.fileSize) }}
                </p>
              </div>
            </div>
            <UiButton
              size="sm"
              variant="outline"
              @click="downloadDocument(doc.id, doc.fileName)"
            >
              <Download class="mr-1 h-4 w-4" />
              Télécharger
            </UiButton>
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
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

import type { Component } from "vue";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

const authStore = useAuthStore();

type TabKey =
  | "profile"
  | "antecedents"
  | "consultations"
  | "prescriptions"
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
  { key: "prescriptions", label: "Ordonnances", icon: Pill },
  { key: "documents", label: "Examens et analyses", icon: TestTubes },
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
  medicalRecord: {
    appointment: { appointmentDate: string };
    practitioner: {
      firstName: string;
      lastName: string;
      title: string;
    };
  } | null;
}

const documents = ref<DocItem[]>([]);
const loadingDocuments = ref(false);
const documentsPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

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

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const parseMedications = (meds: Record<string, unknown>[] | string) => {
  if (!meds) return [];
  if (Array.isArray(meds)) return meds;
  try {
    return JSON.parse(meds);
  } catch {
    return [];
  }
};

const getDocTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    LAB_RESULT: "Résultat de laboratoire",
    RADIOLOGY: "Imagerie médicale",
    MEDICAL_REPORT: "Rapport médical",
    OTHER: "Document",
  };
  return labels[type] || "Document";
};

const getDocTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    LAB_RESULT: "bg-green-100 text-green-600",
    RADIOLOGY: "bg-blue-100 text-blue-600",
    MEDICAL_REPORT: "bg-purple-100 text-purple-600",
    OTHER: "bg-gray-100 text-gray-600",
  };
  return colors[type] || "bg-gray-100 text-gray-600";
};

const getDocTypeIcon = (type: string) => {
  const icons: Record<string, Component> = {
    LAB_RESULT: TestTubes,
    RADIOLOGY: FileSearch,
    MEDICAL_REPORT: FileText,
    OTHER: FileText,
  };
  return icons[type] || FileText;
};

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

const fetchPrescriptions = async (page = 1) => {
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
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: DocItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/medical-records/documents?page=${page}&limit=10`);

    if (response.success) {
      documents.value = response.data;
      Object.assign(documentsPagination, response.pagination);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
  } finally {
    loadingDocuments.value = false;
  }
};

const downloadDocument = async (docId: string, fileName: string) => {
  try {
    const config = useRuntimeConfig();
    const url = `${config.public.apiBase}/medical-records/documents/${docId}/download`;

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
  } else if (tab === "prescriptions" && prescriptions.value.length === 0) {
    fetchPrescriptions();
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
