<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>
      <p class="text-gray-600 dark:text-gray-400">Gérez votre compte et vos préférences</p>
    </div>

    <!-- tabs -->
    <div class="border-b border-gray-200 dark:border-gray-800">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-green-600 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-64 rounded-xl bg-gray-200"></div>
    </div>

    <div v-else>
      <!-- Mon compte tab -->
      <div v-if="activeTab === 'account'" class="space-y-6">
        <!-- profile -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <UserIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
            Informations personnelles
          </h3>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
              <input
                v-model="profile.firstName"
                type="text"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <input
                v-model="profile.lastName"
                type="text"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <input
                v-model="profile.phone"
                type="tel"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <UiButton size="sm" class="mt-4" @click="updateProfile" :disabled="savingProfile">
            {{ savingProfile ? "Enregistrement..." : "Mettre à jour le profil" }}
          </UiButton>

          <p v-if="profileMessage" class="mt-2 text-sm" :class="profileMessageClass">
            {{ profileMessage }}
          </p>
        </div>

        <!-- email -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Mail class="h-5 w-5 text-green-600 dark:text-green-400" />
            Adresse email
          </h3>

          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Email actuel : <strong>{{ profile.email }}</strong>
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouvel email</label>
              <input
                v-model="emailForm.newEmail"
                type="email"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe actuel</label>
              <input
                v-model="emailForm.password"
                type="password"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <UiButton
            size="sm"
            class="mt-4"
            @click="updateEmail"
            :disabled="savingEmail || !emailForm.newEmail || !emailForm.password"
          >
            {{ savingEmail ? "Mise à jour..." : "Changer l'email" }}
          </UiButton>

          <p v-if="emailMessage" class="mt-2 text-sm" :class="emailMessageClass">
            {{ emailMessage }}
          </p>
        </div>

        <!-- password -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Shield class="h-5 w-5 text-green-600 dark:text-green-400" />
            Mot de passe
          </h3>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe actuel</label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le nouveau mot de passe</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <UiButton
            size="sm"
            class="mt-4"
            @click="updatePassword"
            :disabled="savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword"
          >
            {{ savingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe" }}
          </UiButton>

          <p v-if="passwordMessage" class="mt-2 text-sm" :class="passwordMessageClass">
            {{ passwordMessage }}
          </p>
        </div>

        <!-- 2FA -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Authentification à deux facteurs (2FA)</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
            </div>
            <button
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                twoFactorEnabled ? 'bg-green-500' : 'bg-gray-200',
              ]"
              :disabled="toggling2FA"
              @click="toggleTwoFactor"
              type="button"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition duration-200 ease-in-out',
                  twoFactorEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
          <div
            v-if="twoFactorMsg"
            class="mt-3 rounded-lg p-3 text-sm"
            :class="twoFactorError ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'"
          >
            {{ twoFactorMsg }}
          </div>
        </div>
      </div>

      <!-- Notifications tab -->
      <div v-if="activeTab === 'notifications'" class="space-y-6">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Préférences de notification</h3>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="pref in notificationOptions"
              :key="pref.key"
              class="flex items-center justify-between py-4"
            >
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ pref.label }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ pref.description }}</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="notifPrefs[pref.key]"
                  class="peer sr-only"
                  @change="saveNotifPrefs"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300"
                ></div>
              </label>
            </div>
          </div>
          <p v-if="notifMessage" class="mt-3 text-sm" :class="notifMessageClass">{{ notifMessage }}</p>
        </div>
      </div>
    </div>

    <!-- 2FA SETUP MODAL -->
    <div
      v-if="showSetupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div v-if="!showBackupCodes">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield class="w-6 h-6 text-green-500" />
              Configurer la 2FA
            </h3>
            <button @click="showSetupModal = false" class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition p-1 rounded-lg" aria-label="Fermer">
              &times;
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Scannez ce code QR avec votre application d'authentification (Google Authenticator, Authy, etc.) ou saisissez la clé de configuration manuellement.
          </p>

          <div class="flex flex-col items-center justify-center my-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <img :src="qrCodeUrl" alt="QR Code 2FA" class="w-48 h-48 shadow-sm rounded-lg" />
            <div class="mt-4 text-center w-full">
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block">Clé de configuration</span>
              <code class="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-green-600 dark:text-green-400 font-bold block select-all break-all mt-1">
                {{ secretKey }}
              </code>
            </div>
          </div>

          <div class="mt-4">
            <label for="2fa-staff-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code de vérification (6 chiffres)</label>
            <input
              id="2fa-staff-code"
              v-model="verificationCode"
              type="text"
              pattern="[0-9]*"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full text-center tracking-widest text-lg font-bold font-mono rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 placeholder-gray-500 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              @keyup.enter="verify2FA"
            />
            <p v-if="codeError" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{{ codeError }}</p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="showSetupModal = false" class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition">
              Annuler
            </button>
            <button
              @click="verify2FA"
              :disabled="toggling2FA || verificationCode.length < 6"
              class="px-5 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="toggling2FA">Vérification...</span>
              <span v-else>Activer</span>
            </button>
          </div>
        </div>

        <!-- Backup Codes -->
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield class="w-6 h-6 text-green-600 dark:text-green-400" />
              Codes de secours générés
            </h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Voici vos codes de secours. Conservez-les précieusement dans un endroit sûr (comme un gestionnaire de mots de passe). Ils vous permettront d'accéder à votre compte si vous n'avez plus accès à votre application d'authentification.
          </p>

          <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl p-3 mb-4 text-xs text-red-800 dark:text-red-200">
            <strong>ATTENTION :</strong> Ces codes de secours ne seront affichés qu'une seule fois. Chacun d'eux ne peut être utilisé qu'une seule fois.
          </div>

          <div class="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl font-mono text-center text-sm text-gray-800 dark:text-gray-200">
            <div v-for="code in backupCodes" :key="code" class="p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 select-all font-bold">
              {{ code }}
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row gap-2">
            <button @click="copyBackupCodes" class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition flex items-center justify-center gap-1.5">
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
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield class="w-6 h-6 text-red-500" />
            Désactiver la 2FA ?
          </h3>
          <button @click="showDisableModal = false" class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition p-1 rounded-lg" aria-label="Fermer">
            &times;
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          La désactivation de la double authentification réduit la sécurité de votre compte. Saisissez votre mot de passe pour confirmer cette action.
        </p>

        <div>
          <label for="2fa-staff-disable" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
          <input
            id="2fa-staff-disable"
            v-model="disablePassword"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            @keyup.enter="confirmDisable2FA"
          />
          <p v-if="disableError" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{{ disableError }}</p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button @click="showDisableModal = false" class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition">
            Annuler
          </button>
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
import { User as UserIcon, Mail, Shield, Bell } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { isValidPhone } from '~/utils/validation'
import { useToast } from 'vue-toastification'

definePageMeta({
  layout: 'staff',
  middleware: 'staff-only',
})

const authStore = useAuthStore()
const toast = useToast()
const loading = ref(true)

type TabId = 'account' | 'notifications'

const tabs = [
  { id: 'account' as TabId, label: 'Mon compte', icon: UserIcon },
  { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
]
const activeTab = ref<TabId>('account')

const profile = ref({ firstName: '', lastName: '', phone: '', email: '' })
const emailForm = ref({ newEmail: '', password: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

const savingProfile = ref(false)
const savingEmail = ref(false)
const savingPassword = ref(false)

const profileMessage = ref('')
const profileMessageClass = ref('')
const emailMessage = ref('')
const emailMessageClass = ref('')
const passwordMessage = ref('')
const passwordMessageClass = ref('')

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

// Notifications
const notifPrefs = ref({ emailNotifications: true, appointmentReminders: true, newMessages: true })
const notifMessage = ref('')
const notifMessageClass = ref('')

const notificationOptions = [
  { key: 'emailNotifications' as keyof typeof notifPrefs.value, label: 'Notifications par email', description: 'Recevez des notifications par email' },
  { key: 'appointmentReminders' as keyof typeof notifPrefs.value, label: 'Rappels de rendez-vous', description: 'Recevez des rappels avant les rendez-vous' },
  { key: 'newMessages' as keyof typeof notifPrefs.value, label: 'Nouveaux messages', description: 'Soyez informé lorsque vous recevez un nouveau message' },
]

async function fetchProfile() {
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/staff/profile')
    if (res.success) {
      profile.value = res.data
      twoFactorEnabled.value = res.data.twoFactorEnabled ?? false
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    loading.value = false
  }
}

async function fetchNotifPrefs() {
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: typeof notifPrefs.value }>('/settings/notifications')
    if (res.success) Object.assign(notifPrefs.value, res.data)
  } catch (e) {
    console.error('Error fetching notif prefs:', e)
  }
}

async function updateProfile() {
  savingProfile.value = true
  profileMessage.value = ''

  if (profile.value.phone && !isValidPhone(profile.value.phone)) {
    profileMessage.value = 'Le numéro de téléphone contient des caractères non autorisés ou sa longueur est incorrecte (8-15 chiffres requis).'
    profileMessageClass.value = 'text-red-600 dark:text-red-400'
    savingProfile.value = false
    return
  }

  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/staff/profile', {
      method: 'PATCH',
      body: { firstName: profile.value.firstName, lastName: profile.value.lastName, phone: profile.value.phone },
    })
    if (res.success) {
      profile.value = res.data
      profileMessage.value = 'Profil mis à jour avec succès'
      profileMessageClass.value = 'text-green-600 dark:text-green-400'
    }
  } catch (error: any) {
    profileMessage.value = error?.data?.message || 'Erreur lors de la mise à jour'
    profileMessageClass.value = 'text-red-600 dark:text-red-400'
  } finally {
    savingProfile.value = false
  }
}

async function updateEmail() {
  savingEmail.value = true
  emailMessage.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/staff/email', {
      method: 'PATCH',
      body: emailForm.value,
    })
    if (res.success) {
      profile.value.email = emailForm.value.newEmail
      emailForm.value = { newEmail: '', password: '' }
      emailMessage.value = res.data.message || 'Email mis à jour avec succès'
      emailMessageClass.value = 'text-green-600 dark:text-green-400'
    }
  } catch (error: any) {
    emailMessage.value = error?.data?.message || "Erreur lors de la mise à jour de l'email"
    emailMessageClass.value = 'text-red-600 dark:text-red-400'
  } finally {
    savingEmail.value = false
  }
}

async function updatePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordMessage.value = 'Les mots de passe ne correspondent pas'
    passwordMessageClass.value = 'text-red-600 dark:text-red-400'
    return
  }
  savingPassword.value = true
  passwordMessage.value = ''
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>('/staff/password', {
      method: 'PATCH',
      body: { currentPassword: passwordForm.value.currentPassword, newPassword: passwordForm.value.newPassword },
    })
    if (res.success) {
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
      passwordMessage.value = res.data.message || 'Mot de passe mis à jour avec succès'
      passwordMessageClass.value = 'text-green-600 dark:text-green-400'
    }
  } catch (error: any) {
    passwordMessage.value = error?.data?.message || 'Erreur lors de la mise à jour du mot de passe'
    passwordMessageClass.value = 'text-red-600 dark:text-red-400'
  } finally {
    savingPassword.value = false
  }
}

async function saveNotifPrefs() {
  notifMessage.value = ''
  try {
    await useAuthenticatedFetch('/settings/notifications', { method: 'PATCH', body: notifPrefs.value })
    notifMessage.value = 'Préférences mises à jour'
    notifMessageClass.value = 'text-green-600 dark:text-green-400'
    setTimeout(() => (notifMessage.value = ''), 2000)
  } catch (e: any) {
    notifMessage.value = e?.data?.message || 'Erreur'
    notifMessageClass.value = 'text-red-600 dark:text-red-400'
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
    const res = await useAuthenticatedFetch<{ success: boolean; data: { twoFactorEnabled: boolean; message: string } }>('/settings/2fa/disable', {
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

onMounted(() => {
  if (!authStore.isAuthenticated) authStore.initAuth()
  if (authStore.accessToken) {
    fetchProfile()
    fetchNotifPrefs()
  } else {
    loading.value = false
  }
})
</script>
