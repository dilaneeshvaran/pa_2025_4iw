<template>
  <div class="space-y-8">
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
              ? 'border-orange-600 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- account info  -->
    <div v-if="activeTab === 'account'" class="space-y-6">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Informations personnelles
        </h3>

        <div v-if="loadingProfile" class="animate-pulse space-y-4">
          <div class="h-10 rounded bg-gray-200" />
          <div class="h-10 rounded bg-gray-200" />
          <div class="h-10 rounded bg-gray-200" />
        </div>

        <form v-else class="space-y-4" @submit.prevent="saveProfile">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Prénom</label
              >
              <UiInput v-model="profile.firstName" placeholder="Prénom" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nom</label
              >
              <UiInput v-model="profile.lastName" placeholder="Nom" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Date de naissance</label
              >
              <UiInput v-model="profile.dateOfBirth" type="date" :min="minDate" :max="maxDate" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Genre</label
              >
              <select
                v-model="profile.gender"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-base transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
              >
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
                <option value="PREFER_NOT_TO_SAY">Ne pas préciser</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Téléphone</label
            >
            <UiInput v-model="profile.phone" placeholder="+225 XX XX XX XX" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Adresse</label
            >
            <UiInput v-model="profile.address" placeholder="Adresse" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Ville</label
              >
              <UiInput v-model="profile.city" placeholder="Abidjan" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Code postal</label
              >
              <UiInput v-model="profile.postalCode" placeholder="Code postal" />
            </div>
          </div>

          <div
            v-if="profileMsg"
            :class="[
              'rounded-lg p-3 text-sm',
              profileError
                ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
            ]"
          >
            {{ profileMsg }}
          </div>

          <div class="flex justify-end">
            <UiButton type="submit" :disabled="savingProfile">
              {{ savingProfile ? "Enregistrement..." : "Enregistrer" }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- email settings -->
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Adresse email</h3>
        <form class="space-y-4" @submit.prevent="saveEmail">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Email actuel</label
            >
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ currentEmail }}</p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouvel email</label
            >
            <UiInput
              v-model="emailForm.newEmail"
              type="email"
              placeholder="nouveau@email.com"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Mot de passe (confirmation)</label
            >
            <UiInput
              v-model="emailForm.password"
              type="password"
              placeholder="Votre mot de passe"
            />
          </div>
          <div
            v-if="emailMsg"
            :class="[
              'rounded-lg p-3 text-sm',
              emailError
                ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
            ]"
          >
            {{ emailMsg }}
          </div>
          <div class="flex justify-end">
            <UiButton type="submit" :disabled="savingEmail">
              {{ savingEmail ? "Envoi..." : "Modifier l'email" }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- password settings -->
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Mot de passe</h3>
        <form class="space-y-4" @submit.prevent="savePassword">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Mot de passe actuel</label
            >
            <UiInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="Mot de passe actuel"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouveau mot de passe</label
            >
            <UiInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Nouveau mot de passe (min. 8 caractères)"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Confirmer le nouveau mot de passe</label
            >
            <UiInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
            />
          </div>
          <div
            v-if="passwordMsg"
            :class="[
              'rounded-lg p-3 text-sm',
              passwordError
                ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
            ]"
          >
            {{ passwordMsg }}
          </div>
          <div class="flex justify-end">
            <UiButton type="submit" :disabled="savingPassword">
              {{
                savingPassword ? "Modification..." : "Modifier le mot de passe"
              }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- two factor authentication -->
      <UiCard>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Authentification à deux facteurs (2FA)
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </p>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 toggle-switch',
              twoFactorEnabled ? 'bg-orange-500' : 'bg-gray-200',
            ]"
            :disabled="toggling2FA"
            @click="toggleTwoFactor"
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
          :class="[
            'mt-3 rounded-lg p-3 text-sm',
            twoFactorError
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
              : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
          ]"
        >
          {{ twoFactorMsg }}
        </div>
      </UiCard>
    </div>

    <!-- notification preferences -->
    <div v-if="activeTab === 'notifications'" class="space-y-6">
      <UiCard>
        <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Préférences de notification
        </h3>

        <div v-if="loadingNotifPrefs" class="animate-pulse space-y-4">
          <div v-for="i in 5" :key="i" class="h-10 rounded bg-gray-200" />
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="pref in notificationOptions"
            :key="pref.key"
            class="flex items-center justify-between py-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ pref.label }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ pref.description }}</p>
            </div>
            <button
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 toggle-switch',
                notifPrefs[pref.key as keyof typeof notifPrefs]
                  ? 'bg-orange-500'
                  : 'bg-gray-200',
              ]"
              :disabled="savingNotifPrefs"
              @click="toggleNotifPref(pref.key)"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition duration-200 ease-in-out',
                  notifPrefs[pref.key as keyof typeof notifPrefs]
                    ? 'translate-x-5'
                    : 'translate-x-0',
                ]"
              />
            </button>
          </div>
        </div>

        <div
          v-if="notifMsg"
          :class="[
            'mt-4 rounded-lg p-3 text-sm',
            notifError
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
              : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
          ]"
        >
          {{ notifMsg }}
        </div>
      </UiCard>
    </div>

    <!-- personal data (rgpd) -->
    <div v-if="activeTab === 'data'" class="space-y-6">
      <UiCard>
        <div class="flex items-start gap-4">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30"
          >
            <Download class="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Télécharger mes données
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Demandez une copie de toutes vos données personnelles au format
              JSON. Vous recevrez un email lorsque l'export sera prêt.
            </p>
            <div
              v-if="exportMsg"
              :class="[
                'mt-3 rounded-lg p-3 text-sm',
                exportError
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                  : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
              ]"
            >
              {{ exportMsg }}
            </div>
            <UiButton
              class="mt-4"
              variant="outline"
              :disabled="requestingExport"
              @click="requestDataExport"
            >
              <Download class="mr-2 h-4 w-4" />
              {{
                requestingExport
                  ? "Envoi de la demande..."
                  : "Demander l'export"
              }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <!-- account deletion -->
      <UiCard>
        <div class="flex items-start gap-4">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30"
          >
            <Trash2 class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-200">
              Demander la suppression de mon compte
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cette action déclenche un délai de grâce de 30 jours. Vous pouvez
              annuler la demande pendant cette période. Après ce délai, toutes
              vos données seront définitivement supprimées.
            </p>

            <div v-if="!showDeleteConfirm" class="mt-4">
              <UiButton variant="danger" @click="showDeleteConfirm = true">
                <Trash2 class="mr-2 h-4 w-4" />
                Supprimer mon compte
              </UiButton>
            </div>

            <div
              v-else
              class="mt-4 space-y-3 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 p-4"
            >
              <p class="text-sm font-medium text-red-800 dark:text-red-200">
                Êtes-vous sûr de vouloir supprimer votre compte ?
              </p>
              <div>
                <label class="mb-1 block text-sm text-red-700 dark:text-red-300"
                  >Raison (optionnel)</label
                >
                <textarea
                  v-model="deleteReason"
                  rows="2"
                  class="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-20"
                  placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
                />
              </div>
              <div class="flex gap-3">
                <UiButton
                  variant="danger"
                  size="sm"
                  :disabled="requestingDeletion"
                  @click="requestAccountDeletion"
                >
                  {{
                    requestingDeletion ? "Envoi..." : "Confirmer la suppression"
                  }}
                </UiButton>
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="showDeleteConfirm = false"
                >
                  Annuler
                </UiButton>
              </div>
              <div
                v-if="deleteMsg"
                :class="[
                  'rounded-lg p-3 text-sm',
                  deleteError
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
                ]"
              >
                {{ deleteMsg }}
              </div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- consents -->
    <div v-if="activeTab === 'consents'" class="space-y-6">
      <UiCard>
        <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Consentements</h3>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Gérez vos consentements RGPD. Vous pouvez accepter ou révoquer chaque
          consentement à tout moment.
        </p>

        <div v-if="loadingConsents" class="animate-pulse space-y-4">
          <div v-for="i in 4" :key="i" class="h-16 rounded bg-gray-200" />
        </div>

        <div
          v-if="consentsMsg"
          :class="[
            'mb-4 rounded-lg p-3 text-sm',
            consentsError ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
          ]"
        >
          {{ consentsMsg }}
        </div>

        <div v-if="!loadingConsents" class="space-y-3">
          <div
            v-for="item in allConsentItems"
            :key="item.type"
            class="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.label }}</p>
                <UiBadge :variant="item.isActive ? 'success' : 'warning'">
                  {{ item.isActive ? 'Accepté' : 'En attente' }}
                </UiBadge>
                <span
                  v-if="item.required"
                  class="rounded bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300"
                  >Requis</span
                >
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</p>
              <p v-if="item.activeRecord" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Accepté le {{ formatConsentDate(item.activeRecord.acceptedAt) }} · Version
                {{ item.activeRecord.version }}
              </p>
            </div>
            <div class="ml-4 flex shrink-0 gap-2">
              <button
                v-if="!item.isActive"
                :disabled="savingConsent === item.type"
                class="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                @click="acceptConsent(item.type)"
              >
                {{ savingConsent === item.type ? '...' : 'Accepter' }}
              </button>
              <button
                v-if="item.isActive && !item.required"
                :disabled="savingConsent === item.type"
                class="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                @click="revokeConsent(item.type)"
              >
                {{ savingConsent === item.type ? '...' : 'Révoquer' }}
              </button>
              <span
                v-if="item.isActive && item.required"
                class="text-xs italic text-gray-500 dark:text-gray-400">Non révocable</span
              >
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- 2FA SETUP MODAL -->
    <div
      v-if="showSetupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
        <!-- Setup Phase -->
        <div v-if="!showBackupCodes">
          <div class="flex items-center justify-between mb-4">
            <h3 id="setup-modal-title" class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield class="w-6 h-6 text-orange-500" />
              Configurer la 2FA
            </h3>
            <button
              @click="showSetupModal = false"
              class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition p-1 rounded-lg focus:ring-2 focus:ring-orange-500"
              aria-label="Fermer"
            >
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
              <div class="flex items-center justify-center gap-2 mt-1">
                <code class="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-orange-600 dark:text-orange-400 font-bold block select-all break-all">
                  {{ secretKey }}
                </code>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <label for="2fa-verification-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code de vérification (6 chiffres)
            </label>
            <input
              id="2fa-verification-code"
              v-model="verificationCode"
              type="text"
              pattern="[0-9]*"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full text-center tracking-widest text-lg font-bold font-mono rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2.5 placeholder-gray-500 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              @keyup.enter="verify2FA"
            />
            <p v-if="codeError" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {{ codeError }}
            </p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="showSetupModal = false"
              class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400"
            >
              Annuler
            </button>
            <button
              @click="verify2FA"
              :disabled="toggling2FA || verificationCode.length < 6"
              class="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span v-if="toggling2FA">Vérification...</span>
              <span v-else>Activer</span>
            </button>
          </div>
        </div>

        <!-- Backup Codes Phase -->
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
            <button
              @click="copyBackupCodes"
              class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" />
              Copier les codes
            </button>
            <button
              @click="showSetupModal = false"
              class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition focus:ring-2 focus:ring-green-500"
            >
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
      aria-labelledby="disable-modal-title"
    >
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all transform scale-100">
        <div class="flex items-center justify-between mb-4">
          <h3 id="disable-modal-title" class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trash2 class="w-6 h-6 text-red-500" />
            Désactiver la 2FA ?
          </h3>
          <button
            @click="showDisableModal = false"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition p-1 rounded-lg focus:ring-2 focus:ring-red-500"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          La désactivation de la double authentification réduit la sécurité de votre compte. Saisissez votre mot de passe pour confirmer cette action.
        </p>

        <div>
          <label for="2fa-disable-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mot de passe actuel
          </label>
          <input
            id="2fa-disable-password"
            v-model="disablePassword"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 placeholder-gray-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            @keyup.enter="confirmDisable2FA"
          />
          <p v-if="disableError" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {{ disableError }}
          </p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            @click="showDisableModal = false"
            class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400"
          >
            Annuler
          </button>
          <button
            @click="confirmDisable2FA"
            :disabled="toggling2FA || !disablePassword"
            class="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
import {
  User,
  Bell,
  Shield,
  FileText,
  Download,
  Trash2,
} from "lucide-vue-next";
import { useToast } from "vue-toastification";
import { useAuthStore } from "~/stores/auth";
import { formatConsentDate } from "~/utils/date";
import { isValidPhone, isValidBirthDate } from "~/utils/validation";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
});

const authStore = useAuthStore();
const toast = useToast();

type TabId = "account" | "notifications" | "data" | "consents";

const tabs = [
  { id: "account" as TabId, label: "Mon compte", icon: User },
  { id: "notifications" as TabId, label: "Notifications", icon: Bell },
  { id: "data" as TabId, label: "Mes données", icon: Shield },
  { id: "consents" as TabId, label: "Consentements", icon: FileText },
];

const activeTab = ref<TabId>("account");

// profile states
const loadingProfile = ref(true);
const savingProfile = ref(false);
const profileMsg = ref("");
const profileError = ref(false);
const currentEmail = ref("");
const twoFactorEnabled = ref(false);

const maxDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().split("T")[0];
});

const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0];
});

const profile = reactive({
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "PREFER_NOT_TO_SAY",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
});

//  email
const savingEmail = ref(false);
const emailMsg = ref("");
const emailError = ref(false);
const emailForm = reactive({
  newEmail: "",
  password: "",
});

const savingPassword = ref(false);
const passwordMsg = ref("");
const passwordError = ref(false);
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const toggling2FA = ref(false);
const twoFactorMsg = ref("");
const twoFactorError = ref(false);

// 2FA modal state refs
const showSetupModal = ref(false);
const showDisableModal = ref(false);
const qrCodeUrl = ref("");
const secretKey = ref("");
const verificationCode = ref("");
const disablePassword = ref("");
const backupCodes = ref<string[]>([]);
const showBackupCodes = ref(false);
const codeError = ref("");
const disableError = ref("");

// notification preferences
const loadingNotifPrefs = ref(true);
const savingNotifPrefs = ref(false);
const notifMsg = ref("");
const notifError = ref(false);

const notifPrefs = reactive({
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true,
  newMessages: true,
  healthTipsAndNews: false,
});

const notificationOptions = [
  {
    key: "emailNotifications",
    label: "Notifications par email",
    description: "Recevez des notifications par email",
  },
  {
    key: "smsNotifications",
    label: "Notifications par SMS",
    description: "Recevez des notifications par SMS sur votre téléphone",
  },
  {
    key: "appointmentReminders",
    label: "Rappels de rendez-vous",
    description: "Recevez des rappels avant vos rendez-vous",
  },
  {
    key: "newMessages",
    label: "Nouveaux messages",
    description: "Soyez informé lorsque vous recevez un nouveau message",
  },
  {
    key: "healthTipsAndNews",
    label: "Nouveautés et conseils santé",
    description:
      "Recevez des conseils santé et les actualités de la plateforme",
  },
];

// consent
const loadingConsents = ref(true);

interface ConsentRecord {
  id: string;
  consentType: string;
  version: string;
  accepted: boolean;
  acceptedAt: string;
  revokedAt: string | null;
}

const consents = ref<ConsentRecord[]>([]);

const allConsentItems = computed(() => [
  {
    type: 'terms_of_service',
    label: "Conditions générales d'utilisation",
    description: 'Acceptation des conditions générales de la plateforme MediCôte.',
    required: true,
    activeRecord: consents.value.find(
      (c) => c.consentType === 'terms_of_service' && c.accepted && !c.revokedAt,
    ),
    get isActive() { return !!this.activeRecord },
  },
  {
    type: 'privacy_policy',
    label: 'Politique de confidentialité',
    description: 'Acceptation de la politique de traitement des données personnelles.',
    required: true,
    activeRecord: consents.value.find(
      (c) => c.consentType === 'privacy_policy' && c.accepted && !c.revokedAt,
    ),
    get isActive() { return !!this.activeRecord },
  },
  {
    type: 'data_processing',
    label: 'Consentement au traitement des données',
    description: 'Autorisation pour le traitement de vos données médicales dans le cadre des soins.',
    required: true,
    activeRecord: consents.value.find(
      (c) => c.consentType === 'data_processing' && c.accepted && !c.revokedAt,
    ),
    get isActive() { return !!this.activeRecord },
  },
  {
    type: 'analytics',
    label: 'Analytics anonymes',
    description: 'Mesures d\'audience anonymisées pour améliorer la plateforme. Aucune donnée médicale collectée.',
    required: false,
    activeRecord: consents.value.find(
      (c) => c.consentType === 'analytics' && c.accepted && !c.revokedAt,
    ),
    get isActive() { return !!this.activeRecord },
  },
])

const savingConsent = ref<string | null>(null)
const consentsMsg = ref('')
const consentsError = ref(false)

const ESSENTIAL_CONSENT_KEY = computed(() => {
  return authStore.user?.id ? `medicote_consent_given_${authStore.user.id}` : 'medicote_consent_given'
})

const { grantAnalyticsConsent, revokeAnalyticsConsent, initAnalytics } = (() => {
  try {
    const a = useAnalytics()
    const c = useConsent()
    return { ...a, ...c }
  } catch {
    return {
      grantAnalyticsConsent: () => {},
      revokeAnalyticsConsent: () => {},
      initAnalytics: () => {},
    }
  }
})()

const acceptConsent = async (consentType: string) => {
  savingConsent.value = consentType
  consentsMsg.value = ''
  try {
    await useAuthenticatedFetch('/settings/consents', {
      method: 'POST',
      body: { consentType, version: '1.0', accepted: true },
    })
    await fetchConsents()
    if (consentType === 'analytics') {
      grantAnalyticsConsent()
      initAnalytics()
    }
    consentsError.value = false
    consentsMsg.value = 'Consentement enregistré.'
    setTimeout(() => (consentsMsg.value = ''), 3000)
  } catch (e: unknown) {
    consentsError.value = true
    consentsMsg.value =
      (e as { data?: { message?: string } })?.data?.message || 'Erreur lors de la mise à jour.'
  } finally {
    savingConsent.value = null
  }
}

const revokeConsent = async (consentType: string) => {
  savingConsent.value = consentType
  consentsMsg.value = ''
  try {
    await useAuthenticatedFetch('/settings/consents', {
      method: 'POST',
      body: { consentType, version: '1.0', accepted: false },
    })
    await fetchConsents()
    if (consentType === 'analytics') {
      revokeAnalyticsConsent()
    } else {
      localStorage.removeItem(ESSENTIAL_CONSENT_KEY.value)
    }
    consentsError.value = false
    consentsMsg.value = 'Consentement révoqué.'
    setTimeout(() => (consentsMsg.value = ''), 3000)
  } catch (e: unknown) {
    consentsError.value = true
    consentsMsg.value =
      (e as { data?: { message?: string } })?.data?.message || 'Erreur lors de la révocation.'
  } finally {
    savingConsent.value = null
  }
}
const requestingExport = ref(false);
const exportMsg = ref("");
const exportError = ref(false);

const showDeleteConfirm = ref(false);
const deleteReason = ref("");
const requestingDeletion = ref(false);
const deleteMsg = ref("");
const deleteError = ref(false);

const fetchProfile = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        email: string;
        emailVerified: boolean;
        twoFactorEnabled: boolean;
        patient: {
          firstName: string;
          lastName: string;
          dateOfBirth: string;
          gender: string;
          phone: string;
          address: string | null;
          city: string | null;
          country: string;
          postalCode: string | null;
        };
      };
    }>("/settings/profile");

    if (res.success) {
      currentEmail.value = res.data.email;
      twoFactorEnabled.value = res.data.twoFactorEnabled;
      const p = res.data.patient;
      profile.firstName = p.firstName;
      profile.lastName = p.lastName;
      profile.dateOfBirth = p.dateOfBirth;
      profile.gender = p.gender;
      profile.phone = p.phone;
      profile.address = p.address || "";
      profile.city = p.city || "";
      profile.postalCode = p.postalCode || "";
    }
  } catch (e) {
    console.error("Error fetching profile:", e);
  } finally {
    loadingProfile.value = false;
  }
};

const saveProfile = async () => {
  savingProfile.value = true;
  profileMsg.value = "";

  if (profile.dateOfBirth && !isValidBirthDate(profile.dateOfBirth)) {
    profileError.value = true;
    profileMsg.value = "La date de naissance doit être dans le passé.";
    savingProfile.value = false;
    return;
  }

  if (profile.phone && !isValidPhone(profile.phone)) {
    profileError.value = true;
    profileMsg.value = "Le numéro de téléphone contient des caractères non autorisés ou sa longueur est incorrecte (8-15 chiffres requis).";
    savingProfile.value = false;
    return;
  }

  try {
    await useAuthenticatedFetch<{ success: boolean }>("/settings/profile", {
      method: "PATCH",
      body: { ...profile },
    });
    authStore.updateUser({
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
    profileError.value = false;
    profileMsg.value = "Profil mis à jour avec succès";
  } catch (e: unknown) {
    profileError.value = true;
    profileMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la mise à jour";
  } finally {
    savingProfile.value = false;
  }
};

const saveEmail = async () => {
  if (!emailForm.newEmail || !emailForm.password) {
    emailError.value = true;
    emailMsg.value = "Veuillez remplir tous les champs";
    return;
  }
  savingEmail.value = true;
  emailMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { message: string };
    }>("/settings/email", {
      method: "PATCH",
      body: { ...emailForm },
    });
    emailError.value = false;
    emailMsg.value = res.data.message;
    currentEmail.value = emailForm.newEmail;
    emailForm.newEmail = "";
    emailForm.password = "";
  } catch (e: unknown) {
    emailError.value = true;
    emailMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la modification";
  } finally {
    savingEmail.value = false;
  }
};

const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = true;
    passwordMsg.value = "Les mots de passe ne correspondent pas";
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = true;
    passwordMsg.value =
      "Le nouveau mot de passe doit contenir au moins 8 caractères";
    return;
  }
  savingPassword.value = true;
  passwordMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { message: string };
    }>("/settings/password", {
      method: "PATCH",
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    });
    passwordError.value = false;
    passwordMsg.value = res.data.message;
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (e: unknown) {
    passwordError.value = true;
    passwordMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la modification";
  } finally {
    savingPassword.value = false;
  }
};

const toggleTwoFactor = async () => {
  if (twoFactorEnabled.value) {
    disablePassword.value = "";
    disableError.value = "";
    showDisableModal.value = true;
  } else {
    await start2FASetup();
  }
};

const start2FASetup = async () => {
  toggling2FA.value = true;
  twoFactorMsg.value = "";
  codeError.value = "";
  verificationCode.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { secret: string; qrCodeUrl: string };
    }>("/settings/2fa/setup", {
      method: "POST",
    });
    if (res.success && res.data) {
      secretKey.value = res.data.secret;
      qrCodeUrl.value = res.data.qrCodeUrl;
      showSetupModal.value = true;
      showBackupCodes.value = false;
    }
  } catch (e: unknown) {
    twoFactorError.value = true;
    const err = e as { data?: { message?: string } };
    twoFactorMsg.value = err.data?.message || "Erreur lors de la configuration du 2FA";
    toast.error(twoFactorMsg.value);
  } finally {
    toggling2FA.value = false;
  }
};

const verify2FA = async () => {
  if (!verificationCode.value || verificationCode.value.length < 6) {
    codeError.value = "Veuillez entrer un code de 6 chiffres";
    return;
  }
  codeError.value = "";
  toggling2FA.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { twoFactorEnabled: boolean; backupCodes: string[]; message: string };
    }>("/settings/2fa/verify", {
      method: "POST",
      body: { code: verificationCode.value },
    });
    if (res.success && res.data) {
      twoFactorEnabled.value = res.data.twoFactorEnabled;
      backupCodes.value = res.data.backupCodes;
      showBackupCodes.value = true;
      twoFactorError.value = false;
      twoFactorMsg.value = res.data.message;
      toast.success("Authentification à deux facteurs activée !");
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } };
    codeError.value = err.data?.message || "Code incorrect. Veuillez réessayer.";
  } finally {
    toggling2FA.value = false;
  }
};

const confirmDisable2FA = async () => {
  if (!disablePassword.value) {
    disableError.value = "Le mot de passe est requis";
    return;
  }
  disableError.value = "";
  toggling2FA.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { twoFactorEnabled: boolean; message: string };
    }>("/settings/2fa/disable", {
      method: "POST",
      body: { password: disablePassword.value },
    });
    if (res.success) {
      twoFactorEnabled.value = false;
      showDisableModal.value = false;
      twoFactorError.value = false;
      twoFactorMsg.value = res.data.message;
      toast.success("2FA désactivé avec succès");
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } };
    disableError.value = err.data?.message || "Mot de passe incorrect. Impossible de désactiver la 2FA.";
  } finally {
    toggling2FA.value = false;
  }
};

const copyBackupCodes = () => {
  if (backupCodes.value.length === 0) return;
  const text = backupCodes.value.join("\n");
  navigator.clipboard.writeText(text);
  toast.success("Codes de secours copiés dans le presse-papiers !");
};

const fetchNotifPrefs = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: typeof notifPrefs;
    }>("/settings/notifications");
    if (res.success) {
      Object.assign(notifPrefs, res.data);
    }
  } catch (e) {
    console.error("Error fetching notif prefs:", e);
  } finally {
    loadingNotifPrefs.value = false;
  }
};

const toggleNotifPref = async (key: string) => {
  const current = notifPrefs[key as keyof typeof notifPrefs];
  savingNotifPrefs.value = true;
  notifMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: typeof notifPrefs;
    }>("/settings/notifications", {
      method: "PATCH",
      body: { [key]: !current },
    });
    Object.assign(notifPrefs, res.data);
    notifError.value = false;
    notifMsg.value = "Préférences mises à jour";
    setTimeout(() => (notifMsg.value = ""), 2000);
  } catch (e: unknown) {
    notifError.value = true;
    notifMsg.value =
      (e as { data?: { message?: string } })?.data?.message || "Erreur";
  } finally {
    savingNotifPrefs.value = false;
  }
};

const fetchConsents = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: ConsentRecord[];
    }>("/settings/consents");
    if (res.success) {
      consents.value = res.data;
    }
  } catch (e) {
    console.error("Error fetching consents:", e);
  } finally {
    loadingConsents.value = false;
  }
};

const requestDataExport = async () => {
  requestingExport.value = true;
  exportMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { message: string };
    }>("/settings/data-export", { method: "POST" });
    exportError.value = false;
    exportMsg.value = res.data.message;
  } catch (e: unknown) {
    exportError.value = true;
    exportMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la demande";
  } finally {
    requestingExport.value = false;
  }
};

const requestAccountDeletion = async () => {
  requestingDeletion.value = true;
  deleteMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { message: string };
    }>("/settings/delete-account", {
      method: "POST",
      body: { reason: deleteReason.value || undefined },
    });
    deleteError.value = false;
    deleteMsg.value = res.data.message;
  } catch (e: unknown) {
    deleteError.value = true;
    deleteMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      "Erreur lors de la demande";
  } finally {
    requestingDeletion.value = false;
  }
};

// init
onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchProfile();
    fetchNotifPrefs();
    fetchConsents();
  } else {
    loadingProfile.value = false;
    loadingNotifPrefs.value = false;
    loadingConsents.value = false;
  }
});
</script>
