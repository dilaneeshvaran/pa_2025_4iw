<template>
  <div class="space-y-8">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Paramètres
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gérez votre compte et vos préférences
      </p>
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
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400',
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
          <div class="h-10 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-10 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <form v-else class="space-y-4" @submit.prevent="saveProfile">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Prénom</label
              >
              <UiInput v-model="profile.firstName" placeholder="Prénom" />
            </div>
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nom</label
              >
              <UiInput v-model="profile.lastName" placeholder="Nom" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Date de naissance</label
              >
              <UiInput v-model="profile.dateOfBirth" type="date" />
            </div>
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Genre</label
              >
              <select
                v-model="profile.gender"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 dark:border-gray-700"
              >
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
                <option value="PREFER_NOT_TO_SAY">Ne pas préciser</option>
              </select>
            </div>
          </div>

          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Téléphone</label
            >
            <UiInput v-model="profile.phone" placeholder="+225 XX XX XX XX" />
          </div>

          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Adresse</label
            >
            <UiInput v-model="profile.address" placeholder="Adresse" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Ville</label
              >
              <UiInput v-model="profile.city" placeholder="Abidjan" />
            </div>
            <div>
              <label
                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Adresse email
        </h3>
        <form class="space-y-4" @submit.prevent="saveEmail">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Email actuel</label
            >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ currentEmail }}
            </p>
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouvel email</label
            >
            <UiInput
              v-model="emailForm.newEmail"
              type="email"
              placeholder="nouveau@email.com"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Mot de passe
        </h3>
        <form class="space-y-4" @submit.prevent="savePassword">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Mot de passe actuel</label
            >
            <UiInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="Mot de passe actuel"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouveau mot de passe</label
            >
            <UiInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Nouveau mot de passe (min. 8 caractères)"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              twoFactorEnabled
                ? 'bg-orange-500'
                : 'bg-gray-200 dark:bg-gray-700',
            ]"
            :disabled="toggling2FA"
            @click="toggleTwoFactor"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-gray-900',
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
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
          <div
            v-for="i in 5"
            :key="i"
            class="h-10 rounded bg-gray-200 dark:bg-gray-700"
          />
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="pref in notificationOptions"
            :key="pref.key"
            class="flex items-center justify-between py-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ pref.label }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ pref.description }}
              </p>
            </div>
            <button
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                notifPrefs[pref.key as keyof typeof notifPrefs]
                  ? 'bg-orange-500'
                  : 'bg-gray-200 dark:bg-gray-700',
              ]"
              :disabled="savingNotifPrefs"
              @click="toggleNotifPref(pref.key)"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-gray-900',
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
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40"
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
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40"
          >
            <Trash2 class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900">
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
              class="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/40"
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
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
        <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Consentements
        </h3>

        <div v-if="loadingConsents" class="animate-pulse space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="h-16 rounded bg-gray-200 dark:bg-gray-700"
          />
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in consentItems"
            :key="item.type"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ item.label }}
                </p>
                <p
                  v-if="item.consent"
                  class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  Accepté le
                  {{ formatConsentDate(item.consent.acceptedAt) }} - Version
                  {{ item.consent.version }}
                </p>
                <p
                  v-else
                  class="mt-1 text-xs text-amber-600 dark:text-amber-400"
                >
                  Non encore accepté
                </p>
              </div>
              <div>
                <UiBadge
                  :variant="item.consent?.accepted ? 'success' : 'warning'"
                >
                  {{ item.consent?.accepted ? "Accepté" : "En attente" }}
                </UiBadge>
              </div>
            </div>
          </div>

          <div
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Consentement au traitement des données
                </p>
                <p
                  v-if="dataProcessingConsent"
                  class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  Accepté le
                  {{ formatConsentDate(dataProcessingConsent.acceptedAt) }} -
                  Version
                  {{ dataProcessingConsent.version }}
                </p>
                <p
                  v-else
                  class="mt-1 text-xs text-amber-600 dark:text-amber-400"
                >
                  Non encore accepté
                </p>
              </div>
              <div>
                <UiBadge
                  :variant="
                    dataProcessingConsent?.accepted ? 'success' : 'warning'
                  "
                >
                  {{
                    dataProcessingConsent?.accepted ? "Accepté" : "En attente"
                  }}
                </UiBadge>
              </div>
            </div>
          </div>
        </div>
      </UiCard>
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
import { useAuthStore } from "~/stores/auth";
import { formatConsentDate } from "~/utils/date";

definePageMeta({
  layout: "patient",
  middleware: "patient-only",
});

const authStore = useAuthStore();

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

const consentItems = computed(() => [
  {
    type: "terms_of_service",
    label: "Conditions générales d'utilisation",
    consent: consents.value.find(
      (c) => c.consentType === "terms_of_service" && c.accepted && !c.revokedAt,
    ),
  },
  {
    type: "privacy_policy",
    label: "Politique de confidentialité",
    consent: consents.value.find(
      (c) => c.consentType === "privacy_policy" && c.accepted && !c.revokedAt,
    ),
  },
]);

const dataProcessingConsent = computed(() =>
  consents.value.find(
    (c) => c.consentType === "data_processing" && c.accepted && !c.revokedAt,
  ),
);

//  rgpd state
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
  try {
    await useAuthenticatedFetch<{ success: boolean }>("/settings/profile", {
      method: "PATCH",
      body: { ...profile },
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
  toggling2FA.value = true;
  twoFactorMsg.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { twoFactorEnabled: boolean; message: string };
    }>("/settings/2fa", {
      method: "PATCH",
      body: { enabled: !twoFactorEnabled.value },
    });
    twoFactorEnabled.value = res.data.twoFactorEnabled;
    twoFactorError.value = false;
    twoFactorMsg.value = res.data.message;
  } catch (e: unknown) {
    twoFactorError.value = true;
    twoFactorMsg.value =
      (e as { data?: { message?: string } })?.data?.message || "Erreur";
  } finally {
    toggling2FA.value = false;
  }
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
