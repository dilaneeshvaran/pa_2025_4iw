<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Paramètres</h1>
      <p class="text-gray-600">Gérez votre compte et les informations de votre cabinet</p>
    </div>

    <!-- tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-32 rounded-xl bg-gray-200"></div>
      <div class="h-64 rounded-xl bg-gray-200"></div>
    </div>

    <!-- Mon compte tab -->
    <div v-else-if="activeTab === 'account'" class="space-y-6">
      <!-- profile -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <UserIcon class="h-5 w-5 text-orange-500" />
          Informations personnelles
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Prénom</label>
            <input
              v-model="accountProfile.firstName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Nom</label>
            <input
              v-model="accountProfile.lastName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              v-model="accountProfile.phone"
              type="tel"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <button
          @click="updateAccountProfile"
          :disabled="savingProfile"
          class="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {{ savingProfile ? 'Enregistrement...' : 'Mettre à jour le profil' }}
        </button>
        <p v-if="profileMsg" class="mt-2 text-sm" :class="profileMsgClass">{{ profileMsg }}</p>
      </div>

      <!-- email -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Mail class="h-5 w-5 text-orange-500" />
          Adresse email
        </h3>
        <p class="mb-3 text-sm text-gray-500">
          Email actuel : <strong>{{ accountProfile.email }}</strong>
        </p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Nouvel email</label>
            <input
              v-model="emailForm.newEmail"
              type="email"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Mot de passe actuel</label>
            <input
              v-model="emailForm.password"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <button
          @click="updateEmail"
          :disabled="savingEmail || !emailForm.newEmail || !emailForm.password"
          class="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {{ savingEmail ? 'Mise à jour...' : "Changer l'email" }}
        </button>
        <p v-if="emailMsg" class="mt-2 text-sm" :class="emailMsgClass">{{ emailMsg }}</p>
      </div>

      <!-- password -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Lock class="h-5 w-5 text-orange-500" />
          Mot de passe
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Mot de passe actuel</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <button
          @click="updatePassword"
          :disabled="savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword"
          class="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {{ savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
        </button>
        <p v-if="passwordMsg" class="mt-2 text-sm" :class="passwordMsgClass">{{ passwordMsg }}</p>
      </div>

      <!-- 2FA -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Authentification à deux facteurs (2FA)</h3>
            <p class="mt-1 text-sm text-gray-500">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              twoFactorEnabled ? 'bg-orange-500' : 'bg-gray-200',
            ]"
            :disabled="toggling2FA"
            @click="toggleTwoFactor"
            type="button"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                twoFactorEnabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
        <div
          v-if="twoFactorMsg"
          class="mt-3 rounded-lg p-3 text-sm"
          :class="twoFactorError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
        >
          {{ twoFactorMsg }}
        </div>
      </div>
    </div>

    <!-- Cabinet tab -->
    <div v-else-if="activeTab === 'cabinet'">
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- general info -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">Informations générales</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Nom du cabinet</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700">Adresse</label>
              <input
                v-model="form.address"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Ville</label>
              <input
                v-model="form.city"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <!-- open hours -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">Horaires d'ouverture</h3>
          <div class="space-y-3">
            <div
              v-for="day in daysOfWeek"
              :key="day.key"
              class="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
            >
              <div class="w-28">
                <label class="text-sm font-medium text-gray-700">{{ day.label }}</label>
              </div>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="!openHours[day.key]?.closed"
                  @change="toggleDay(day.key)"
                  class="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-600">Ouvert</span>
              </label>
              <template v-if="!openHours[day.key]?.closed">
                <input
                  v-model="openHours[day.key].open"
                  type="time"
                  class="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                <span class="text-gray-400">-</span>
                <input
                  v-model="openHours[day.key].close"
                  type="time"
                  class="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
              </template>
              <span v-else class="text-sm text-gray-400">Fermé</span>
            </div>
          </div>
        </div>

        <div v-if="saveError" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ saveError }}</div>
        <div v-if="saveSuccess" class="rounded-lg bg-green-50 p-3 text-sm text-green-600">Informations mises à jour avec succès !</div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>

      <!-- Danger Zone -->
      <div class="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm space-y-6">
        <h3 class="text-lg font-semibold text-red-900 flex items-center gap-2">
          <ShieldAlert class="h-5 w-5 text-red-600" />
          Zone de danger
        </h3>

        <div class="divide-y divide-red-200">
          <!-- Transfer Ownership -->
          <div class="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="max-w-md">
              <p class="font-medium text-gray-900">Transférer la propriété du cabinet</p>
              <p class="text-sm text-gray-500">Transférez les droits d'administrateur à un autre utilisateur via son adresse email.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
              <input
                v-model="transferEmail"
                type="email"
                placeholder="nouveau.admin@email.com"
                class="rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                @click="handleTransferOwnership"
                :disabled="transferring || !transferEmail"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Transférer
              </button>
            </div>
          </div>

          <!-- Delete Cabinet -->
          <div class="py-4 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="max-w-md">
              <p class="font-medium text-gray-900">Supprimer le cabinet</p>
              <p class="text-sm text-gray-500">Cette action est irréversible. Elle annulera tous les rendez-vous à venir et supprimera toutes les données associées du cabinet.</p>
            </div>
            <button
              type="button"
              @click="handleDeleteCabinet"
              :disabled="deleting"
              class="rounded-lg border border-red-300 bg-white text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 self-start sm:self-center"
            >
              Supprimer le cabinet
            </button>
          </div>
        </div>

        <div v-if="dangerError" class="rounded-lg bg-red-100 p-3 text-sm text-red-800">{{ dangerError }}</div>
        <div v-if="dangerSuccess" class="rounded-lg bg-green-100 p-3 text-sm text-green-800">{{ dangerSuccess }}</div>
      </div>
    </div>

    <!-- 2FA SETUP MODAL -->
    <div
      v-if="showSetupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div v-if="!showBackupCodes">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lock class="w-6 h-6 text-orange-500" />
              Configurer la 2FA
            </h3>
            <button @click="showSetupModal = false" class="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg" aria-label="Fermer">
              &times;
            </button>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            Scannez ce code QR avec votre application d'authentification (Google Authenticator, Authy, etc.) ou saisissez la clé de configuration manuellement.
          </p>

          <div class="flex flex-col items-center justify-center my-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <img :src="qrCodeUrl" alt="QR Code 2FA" class="w-48 h-48 shadow-sm rounded-lg" />
            <div class="mt-4 text-center w-full">
              <span class="text-xs text-gray-400 font-medium uppercase tracking-wider block">Clé de configuration</span>
              <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-orange-600 font-bold block select-all break-all mt-1">{{ secretKey }}</code>
            </div>
          </div>

          <div class="mt-4">
            <label for="2fa-cabinet-code" class="block text-sm font-medium text-gray-700 mb-1">Code de vérification (6 chiffres)</label>
            <input
              id="2fa-cabinet-code"
              v-model="verificationCode"
              type="text"
              pattern="[0-9]*"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full text-center tracking-widest text-lg font-bold font-mono rounded-xl border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              @keyup.enter="verify2FA"
            />
            <p v-if="codeError" class="mt-2 text-sm text-red-600" role="alert">{{ codeError }}</p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="showSetupModal = false" class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Annuler</button>
            <button
              @click="verify2FA"
              :disabled="toggling2FA || verificationCode.length < 6"
              class="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="toggling2FA">Vérification...</span>
              <span v-else>Activer</span>
            </button>
          </div>
        </div>

        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lock class="w-6 h-6 text-green-600" />
              Codes de secours générés
            </h3>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            Voici vos codes de secours. Conservez-les précieusement dans un endroit sûr. Ils vous permettront d'accéder à votre compte si vous n'avez plus accès à votre application d'authentification.
          </p>
          <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-800">
            <strong>ATTENTION :</strong> Ces codes de secours ne seront affichés qu'une seule fois.
          </div>
          <div class="grid grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-center text-sm text-gray-800">
            <div v-for="code in backupCodes" :key="code" class="p-1 rounded bg-white border border-gray-200 select-all font-bold">{{ code }}</div>
          </div>
          <div class="mt-6 flex flex-col sm:flex-row gap-2">
            <button @click="copyBackupCodes" class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center justify-center gap-1.5">
              Copier les codes
            </button>
            <button @click="showSetupModal = false" class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition">
              J'ai sauvegardé mes codes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2FA DISABLE MODAL -->
    <div
      v-if="showDisableModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lock class="w-6 h-6 text-red-500" />
            Désactiver la 2FA ?
          </h3>
          <button @click="showDisableModal = false" class="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg" aria-label="Fermer">
            &times;
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          La désactivation de la double authentification réduit la sécurité de votre compte. Saisissez votre mot de passe pour confirmer.
        </p>
        <div>
          <label for="2fa-cabinet-disable" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
          <input
            id="2fa-cabinet-disable"
            v-model="disablePassword"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            @keyup.enter="confirmDisable2FA"
          />
          <p v-if="disableError" class="mt-2 text-sm text-red-600" role="alert">{{ disableError }}</p>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button @click="showDisableModal = false" class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Annuler</button>
          <button
            @click="confirmDisable2FA"
            :disabled="toggling2FA || !disablePassword"
            class="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="toggling2FA">Désactivation...</span>
            <span v-else>Désactiver</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { ShieldAlert, User as UserIcon, Mail, Lock, Building2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { isValidPhone } from '~/utils/validation'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-admin-only',
})

const authStore = useAuthStore()
const toast = useToast()

type TabId = 'account' | 'cabinet'
const tabs = [
  { id: 'account' as TabId, label: 'Mon compte', icon: UserIcon },
  { id: 'cabinet' as TabId, label: 'Cabinet', icon: Building2 },
]
const activeTab = ref<TabId>('account')

const loading = ref(true)

// ─── Account (personal) ───────────────────────────────────────────────────────

const accountProfile = ref({ firstName: '', lastName: '', phone: '', email: '' })
const emailForm = ref({ newEmail: '', password: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

const savingProfile = ref(false)
const savingEmail = ref(false)
const savingPassword = ref(false)

const profileMsg = ref('')
const profileMsgClass = ref('')
const emailMsg = ref('')
const emailMsgClass = ref('')
const passwordMsg = ref('')
const passwordMsgClass = ref('')

// 2FA
const twoFactorEnabled = ref(false)
const toggling2FA = ref(false)
const twoFactorMsg = ref('')
const twoFactorError = ref(false)
const showSetupModal = ref(false)
const showDisableModal = ref(false)
const qrCodeUrl = ref('')
const secretKey = ref('')
const verificationCode = ref('')
const disablePassword = ref('')
const backupCodes = ref<string[]>([])
const showBackupCodes = ref(false)
const codeError = ref('')
const disableError = ref('')

async function fetchAccountProfile() {
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/settings/profile')
    if (res.success) {
      accountProfile.value.email = res.data.email ?? ''
      twoFactorEnabled.value = res.data.twoFactorEnabled ?? false
      const p = res.data.cabinetAdmin || res.data.practitioner || res.data
      accountProfile.value.firstName = p.firstName ?? ''
      accountProfile.value.lastName = p.lastName ?? ''
      accountProfile.value.phone = p.phone ?? ''
    }
  } catch (e) {
    console.error('Error fetching account profile:', e)
  }
}

async function updateAccountProfile() {
  savingProfile.value = true
  profileMsg.value = ''

  if (accountProfile.value.phone && !isValidPhone(accountProfile.value.phone)) {
    profileMsg.value = 'Le numéro de téléphone contient des caractères non autorisés ou sa longueur est incorrecte (8-15 chiffres requis).'
    profileMsgClass.value = 'text-red-600'
    savingProfile.value = false
    return
  }

  try {
    await useAuthenticatedFetch<{ success: boolean }>('/settings/profile', {
      method: 'PATCH',
      body: { firstName: accountProfile.value.firstName, lastName: accountProfile.value.lastName, phone: accountProfile.value.phone },
    })
    profileMsg.value = 'Profil mis à jour avec succès'
    profileMsgClass.value = 'text-green-600'
  } catch (e: any) {
    profileMsg.value = e?.data?.message || 'Erreur lors de la mise à jour'
    profileMsgClass.value = 'text-red-600'
  } finally {
    savingProfile.value = false
  }
}

async function updateEmail() {
  savingEmail.value = true
  emailMsg.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/settings/email', {
      method: 'PATCH',
      body: emailForm.value,
    })
    if (res.success) {
      accountProfile.value.email = emailForm.value.newEmail
      emailForm.value = { newEmail: '', password: '' }
      emailMsg.value = res.data?.message || 'Email mis à jour avec succès'
      emailMsgClass.value = 'text-green-600'
    }
  } catch (e: any) {
    emailMsg.value = e?.data?.message || "Erreur lors de la mise à jour de l'email"
    emailMsgClass.value = 'text-red-600'
  } finally {
    savingEmail.value = false
  }
}

async function updatePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordMsg.value = 'Les mots de passe ne correspondent pas'
    passwordMsgClass.value = 'text-red-600'
    return
  }
  savingPassword.value = true
  passwordMsg.value = ''
  try {
    await useAuthenticatedFetch<{ success: boolean }>('/settings/password', {
      method: 'PATCH',
      body: { currentPassword: passwordForm.value.currentPassword, newPassword: passwordForm.value.newPassword },
    })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    passwordMsg.value = 'Mot de passe mis à jour avec succès'
    passwordMsgClass.value = 'text-green-600'
  } catch (e: any) {
    passwordMsg.value = e?.data?.message || 'Erreur lors de la mise à jour du mot de passe'
    passwordMsgClass.value = 'text-red-600'
  } finally {
    savingPassword.value = false
  }
}

function toggleTwoFactor() {
  if (twoFactorEnabled.value) {
    disablePassword.value = ''
    disableError.value = ''
    showDisableModal.value = true
  } else {
    start2FASetup()
  }
}

async function start2FASetup() {
  toggling2FA.value = true
  codeError.value = ''
  verificationCode.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: { secret: string; qrCodeUrl: string } }>('/settings/2fa/setup', { method: 'POST' })
    if (res.success && res.data) {
      secretKey.value = res.data.secret
      qrCodeUrl.value = res.data.qrCodeUrl
      showSetupModal.value = true
      showBackupCodes.value = false
    }
  } catch (e: any) {
    toast.error(e?.data?.message || 'Erreur lors de la configuration du 2FA')
  } finally {
    toggling2FA.value = false
  }
}

async function verify2FA() {
  if (!verificationCode.value || verificationCode.value.length < 6) {
    codeError.value = 'Veuillez entrer un code de 6 chiffres'
    return
  }
  codeError.value = ''
  toggling2FA.value = true
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: { twoFactorEnabled: boolean; backupCodes: string[]; message: string } }>('/settings/2fa/verify', {
      method: 'POST',
      body: { code: verificationCode.value },
    })
    if (res.success && res.data) {
      twoFactorEnabled.value = res.data.twoFactorEnabled
      backupCodes.value = res.data.backupCodes
      showBackupCodes.value = true
      toast.success('Authentification à deux facteurs activée !')
    }
  } catch (e: any) {
    codeError.value = e?.data?.message || 'Code incorrect. Veuillez réessayer.'
  } finally {
    toggling2FA.value = false
  }
}

async function confirmDisable2FA() {
  if (!disablePassword.value) {
    disableError.value = 'Le mot de passe est requis'
    return
  }
  disableError.value = ''
  toggling2FA.value = true
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/settings/2fa/disable', {
      method: 'POST',
      body: { password: disablePassword.value },
    })
    if (res.success) {
      twoFactorEnabled.value = false
      showDisableModal.value = false
      toast.success('2FA désactivé avec succès')
    }
  } catch (e: any) {
    disableError.value = e?.data?.message || 'Mot de passe incorrect. Impossible de désactiver la 2FA.'
  } finally {
    toggling2FA.value = false
  }
}

function copyBackupCodes() {
  if (backupCodes.value.length === 0) return
  navigator.clipboard.writeText(backupCodes.value.join('\n'))
  toast.success('Codes de secours copiés dans le presse-papiers !')
}

// ─── Cabinet info ─────────────────────────────────────────────────────────────

const form = ref({ name: '', address: '', city: '', phone: '' })

const daysOfWeek = [
  { key: 'MONDAY', label: 'Lundi' },
  { key: 'TUESDAY', label: 'Mardi' },
  { key: 'WEDNESDAY', label: 'Mercredi' },
  { key: 'THURSDAY', label: 'Jeudi' },
  { key: 'FRIDAY', label: 'Vendredi' },
  { key: 'SATURDAY', label: 'Samedi' },
  { key: 'SUNDAY', label: 'Dimanche' },
]

const defaultOpenHours: Record<string, { open: string; close: string; closed: boolean }> = {}
daysOfWeek.forEach((d) => {
  defaultOpenHours[d.key] = { open: '08:00', close: '18:00', closed: d.key === 'SUNDAY' }
})

const openHours = ref<Record<string, { open: string; close: string; closed: boolean }>>({ ...defaultOpenHours })

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

const toggleDay = (key: string) => {
  openHours.value[key].closed = !openHours.value[key].closed
}

const fetchCabinetInfo = async () => {
  try {
    const response = await useAuthenticatedFetch<{ success: boolean; data: any }>('/cabinet/info')
    if (response.success) {
      form.value.name = response.data.name || ''
      form.value.address = response.data.address || ''
      form.value.city = response.data.city || ''
      form.value.phone = response.data.phone || ''
      if (response.data.openHours) {
        openHours.value = { ...defaultOpenHours, ...response.data.openHours }
      }
    }
  } catch (error) {
    console.error('Error fetching cabinet info:', error)
  }
}

const handleSave = async () => {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false

  try {
    const response = await useAuthenticatedFetch<{ success: boolean }>('/cabinet/info', {
      method: 'PATCH',
      body: { ...form.value, openHours: openHours.value },
    })
    if (response.success) {
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 3000)
    }
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

// ─── Danger zone ──────────────────────────────────────────────────────────────

const transferEmail = ref('')
const transferring = ref(false)
const deleting = ref(false)
const dangerError = ref('')
const dangerSuccess = ref('')

const handleTransferOwnership = async () => {
  if (!confirm(`Êtes-vous sûr de vouloir transférer la propriété du cabinet à ${transferEmail.value} ? Cette action vous déconnectera.`)) return
  transferring.value = true
  dangerError.value = ''
  dangerSuccess.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean }>('/cabinet/transfer-ownership', {
      method: 'POST',
      body: { email: transferEmail.value },
    })
    if (res.success) {
      dangerSuccess.value = 'Propriété transférée avec succès. Déconnexion...'
      setTimeout(() => { authStore.logout(); navigateTo('/auth/login') }, 2000)
    }
  } catch (err: any) {
    dangerError.value = err?.data?.message || 'Erreur lors du transfert'
  } finally {
    transferring.value = false
  }
}

const handleDeleteCabinet = async () => {
  const confirmText = prompt('Pour confirmer la suppression, veuillez saisir le nom du cabinet :')
  if (confirmText !== form.value.name) {
    alert('Le nom saisi ne correspond pas. Suppression annulée.')
    return
  }
  deleting.value = true
  dangerError.value = ''
  dangerSuccess.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean }>('/cabinet', { method: 'DELETE' })
    if (res.success) {
      dangerSuccess.value = 'Cabinet supprimé avec succès. Déconnexion...'
      setTimeout(() => { authStore.logout(); navigateTo('/auth/login') }, 2000)
    }
  } catch (err: any) {
    dangerError.value = err?.data?.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) authStore.initAuth()
  if (authStore.accessToken) {
    await Promise.all([fetchAccountProfile(), fetchCabinetInfo()])
  }
  loading.value = false
})
</script>
