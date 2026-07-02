<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Paramètres</h1>
      <p class="text-gray-600">Configurez votre compte et vos préférences</p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-64 rounded bg-gray-200"></div>
    </div>

    <div v-else class="space-y-6">
      <UiCard class="p-6">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <Eye class="h-5 w-5 text-gray-500" /> Visibilité du profil
        </h3>

        <div class="space-y-4">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="mb-3 flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-800">
                  Rendre mon profil public
                </h4>
                <p class="mt-1 text-sm text-gray-500">
                  Permet aux patients de trouver votre profil et de prendre
                  rendez-vous en ligne.
                </p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="profileVisibility.isProfilePublic"
                  class="peer sr-only"
                  @change="updateProfileVisibility"
                  :disabled="!profileVisibility.tarifsAreDefined"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                ></div>
              </label>
            </div>

            <div
              v-if="!profileVisibility.tarifsAreDefined"
              class="mt-3 flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800"
            >
              <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p class="font-medium">Tarifs requis</p>
                <p class="mt-1">
                  Vous devez définir au moins votre tarif de consultation de
                  base avant de rendre votre profil public.
                  <NuxtLink
                    to="/practitioner/billing"
                    class="font-semibold underline hover:text-yellow-900"
                  >
                    Configurer mes tarifs
                  </NuxtLink>
                </p>
              </div>
            </div>

            <div
              v-if="
                profileVisibility.isProfilePublic &&
                profileVisibility.tarifsAreDefined
              "
              class="mt-3 flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800"
            >
              <CheckCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Votre profil est visible publiquement. Les patients peuvent vous
                trouver et prendre rendez-vous.
              </p>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="mb-3 flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-800">
                  Activer la messagerie
                </h4>
                <p class="mt-1 text-sm text-gray-500">
                  Permet aux patients de vous envoyer des messages pour des questions de suivi ou administratives.
                </p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="profileVisibility.messagingEnabled"
                  class="peer sr-only"
                  @change="updateMessagingVisibility"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300"
                ></div>
              </label>
            </div>
          </div>

          <div class="rounded-lg border border-gray-100 bg-white p-4">
            <h5 class="mb-2 text-sm font-semibold text-gray-700">
              Statut des tarifs
            </h5>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Consultation standard</span>
                <span
                  :class="[
                    'font-medium',
                    profileVisibility.tarifs.baseConsultationFee
                      ? 'text-green-600'
                      : 'text-gray-400',
                  ]"
                >
                  {{
                    profileVisibility.tarifs.baseConsultationFee
                      ? `${profileVisibility.tarifs.baseConsultationFee} XOF`
                      : "Non défini"
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Téléconsultation</span>
                <span
                  :class="[
                    'font-medium',
                    profileVisibility.tarifs.teleconsultationFee
                      ? 'text-green-600'
                      : 'text-gray-400',
                  ]"
                >
                  {{
                    profileVisibility.tarifs.teleconsultationFee
                      ? `${profileVisibility.tarifs.teleconsultationFee} XOF`
                      : "Non défini"
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Urgence</span>
                <span
                  :class="[
                    'font-medium',
                    profileVisibility.tarifs.emergencyFee
                      ? 'text-green-600'
                      : 'text-gray-400',
                  ]"
                >
                  {{
                    profileVisibility.tarifs.emergencyFee
                      ? `${profileVisibility.tarifs.emergencyFee} XOF`
                      : "Non défini"
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <Shield class="h-5 w-5 text-gray-500" /> Sécurité
        </h3>

        <div class="space-y-6">
          <div class="border-b pb-6">
            <h4 class="mb-3 font-medium text-gray-800">
              Changer le mot de passe
            </h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Mot de passe actuel</label
                >
                <input
                  v-model="passwords.currentPassword"
                  type="password"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Nouveau mot de passe</label
                >
                <input
                  v-model="passwords.newPassword"
                  type="password"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            <UiButton
              size="sm"
              class="mt-4"
              @click="updatePassword"
              :disabled="savingPwd"
              >Mettre à jour le mot de passe</UiButton
            >
          </div>

          <div>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-800">
                  Authentification à deux facteurs (2FA)
                </h4>
                <p class="text-sm text-gray-500">
                  Ajoute une couche de sécurité supplémentaire à votre compte.
                </p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="twoFactorEnabled"
                  class="peer sr-only"
                  @change="toggle2fa"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300"
                ></div>
              </label>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <Bell class="h-5 w-5 text-gray-500" /> Notifications Email
        </h3>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between"
            v-for="(val, key) in notifications"
            :key="key"
          >
            <div>
              <h4 class="font-medium text-gray-800">
                {{ getNotificationLabel(key) }}
              </h4>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                v-model="notifications[key]"
                class="peer sr-only"
                @change="updateNotifications"
              />
              <div
                class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300"
              ></div>
            </label>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <CreditCard class="h-5 w-5 text-gray-500" /> Mon abonnement
        </h3>
        <div v-if="subscription">
          <div
            class="mb-4 flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 p-4"
          >
            <div>
              <h4 class="text-lg font-bold text-orange-700">
                Plan {{ subscription.plan }}
              </h4>
              <p class="mt-1 text-sm text-orange-700">
                Statut :
                <span class="font-semibold">{{ subscription.status }}</span>
              </p>
              <p
                v-if="subscription.cancelAtPeriodEnd"
                class="mt-1 text-sm text-red-500"
              >
                Sera annulé à la fin de la période
              </p>
            </div>
            <div class="text-right">
              <p class="mb-1 text-2xl font-bold text-orange-700">
                12 000 XOF <span class="text-sm font-normal">/ mois</span>
              </p>
            </div>
          </div>
          <div class="flex justify-end">
            <UiButton
              v-if="!subscription.cancelAtPeriodEnd"
              variant="outline"
              class="border-red-200 text-red-600 hover:bg-red-50"
              @click="cancelSubscription"
            >
              Annuler l'abonnement
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <FileText class="h-5 w-5 text-gray-500" /> Historique de facturation
          (Medicote)
        </h3>
        <p class="mb-4 text-sm text-gray-500">
          Vos factures pour l'utilisation de la plateforme Medicote et
          paiements.
        </p>

        <div
          v-if="invoices.length === 0"
          class="py-6 text-center text-gray-500"
        >
          <FileText class="mx-auto mb-2 h-12 w-12 text-gray-300" />
          Aucune facture disponible.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm text-gray-500">
            <thead class="border-b bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" class="px-4 py-3">Date</th>
                <th scope="col" class="px-4 py-3">Numéro</th>
                <th scope="col" class="px-4 py-3">Montant</th>
                <th scope="col" class="px-4 py-3">Moyen de paiement</th>
                <th scope="col" class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b" v-for="inv in invoices" :key="inv.id">
                <td class="px-4 py-3">
                  {{
                    new Date(
                      inv.invoiceDate || inv.createdAt,
                    ).toLocaleDateString()
                  }}
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  {{ inv.invoiceNumber }}
                </td>
                <td class="px-4 py-3">{{ inv.total }} {{ inv.currency }}</td>
                <td class="px-4 py-3">
                  <span v-if="inv.payment">{{ inv.payment.method }}</span>
                  <span v-else>-</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <UiButton
                    v-if="inv.invoice"
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs"
                    @click="downloadInvoice(inv.invoice.id, inv.invoiceNumber)"
                    >PDF</UiButton
                  >
                </td>
              </tr>
            </tbody>
          </table>
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
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
        <!-- Setup Phase -->
        <div v-if="!showBackupCodes">
          <div class="flex items-center justify-between mb-4">
            <h3 id="setup-modal-title" class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield class="w-6 h-6 text-orange-500" />
              Configurer la 2FA
            </h3>
            <button
              @click="showSetupModal = false"
              class="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg focus:ring-2 focus:ring-orange-500"
              aria-label="Fermer"
            >
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
              <div class="flex items-center justify-center gap-2 mt-1">
                <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-orange-600 font-bold block select-all break-all">
                  {{ secretKey }}
                </code>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <label for="2fa-verification-code-practitioner" class="block text-sm font-medium text-gray-700 mb-1">
              Code de vérification (6 chiffres)
            </label>
            <input
              id="2fa-verification-code-practitioner"
              v-model="verificationCode"
              type="text"
              pattern="[0-9]*"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full text-center tracking-widest text-lg font-bold font-mono rounded-xl border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              @keyup.enter="verify2FA"
            />
            <p v-if="codeError" class="mt-2 text-sm text-red-600" role="alert">
              {{ codeError }}
            </p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="showSetupModal = false"
              class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400"
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
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield class="w-6 h-6 text-green-600" />
              Codes de secours générés
            </h3>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            Voici vos codes de secours. Conservez-les précieusement dans un endroit sûr (comme un gestionnaire de mots de passe). Ils vous permettront d'accéder à votre compte si vous n'avez plus accès à votre application d'authentification.
          </p>

          <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-800">
            <strong>ATTENTION :</strong> Ces codes de secours ne seront affichés qu'une seule fois. Chacun d'eux ne peut être utilisé qu'une seule fois.
          </div>

          <div class="grid grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-center text-sm text-gray-800">
            <div v-for="code in backupCodes" :key="code" class="p-1 rounded bg-white border border-gray-200 select-all font-bold">
              {{ code }}
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              @click="copyBackupCodes"
              class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
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
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transition-all transform scale-100">
        <div class="flex items-center justify-between mb-4">
          <h3 id="disable-modal-title" class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Désactiver la 2FA ?
          </h3>
          <button
            @click="showDisableModal = false"
            class="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg focus:ring-2 focus:ring-red-500"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          La désactivation de la double authentification réduit la sécurité de votre compte. Saisissez votre mot de passe pour confirmer cette action.
        </p>

        <div>
          <label for="2fa-disable-password-practitioner" class="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe actuel
          </label>
          <input
            id="2fa-disable-password-practitioner"
            v-model="disablePassword"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            @keyup.enter="confirmDisable2FA"
          />
          <p v-if="disableError" class="mt-2 text-sm text-red-600" role="alert">
            {{ disableError }}
          </p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            @click="showDisableModal = false"
            class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400"
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
import { ref, onMounted } from "vue";
import {
  Shield,
  Bell,
  CreditCard,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-vue-next";
import { useToast } from "vue-toastification";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const toast = useToast();

const loading = ref(true);
const twoFactorEnabled = ref(false);

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
const toggling2FA = ref(false);
const notifications = ref<Record<string, boolean>>({
  appointmentReminders: true,
  newMessages: true,
  emailNotifications: true,
});

const getNotificationLabel = (key: string) => {
  const map: Record<string, string> = {
    appointmentReminders: "Nouveaux rendez-vous",
    newMessages: "Nouveaux messages",
    emailNotifications: "Annulations",
  };
  return map[key] || key;
};

const passwords = ref({
  currentPassword: "",
  newPassword: "",
});
const savingPwd = ref(false);

interface SubscriptionInfo {
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
}

interface InvoiceInfo {
  id: string;
  invoiceDate?: string;
  createdAt: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  payment?: {
    method: string;
  };
}

const subscription = ref<SubscriptionInfo | null>(null);
const invoices = ref<InvoiceInfo[]>([]);

const profileVisibility = ref({
  isProfilePublic: false,
  messagingEnabled: false,
  tarifsAreDefined: false,
  tarifs: {
    baseConsultationFee: undefined as number | undefined,
    teleconsultationFee: undefined as number | undefined,
    emergencyFee: undefined as number | undefined,
  },
});

interface ProfileData {
  isProfilePublic: boolean;
  messagingEnabled?: boolean;
  baseConsultationFee?: number;
  teleconsultationFee?: number;
  emergencyFee?: number;
}

interface NotificationPreferences {
  appointmentReminders: boolean;
  newMessages: boolean;
  emailNotifications: boolean;
}

const fetchData = async () => {
  loading.value = true;
  try {
    const [profRes, notifRes, subRes, invRes, profileRes] = await Promise.all([
      useAuthenticatedFetch<{
        success: boolean;
        data: { twoFactorEnabled: boolean };
      }>("/settings/profile"),
      useAuthenticatedFetch<{
        success: boolean;
        data: NotificationPreferences;
      }>("/settings/notifications"),
      useAuthenticatedFetch<{ success: boolean; data: SubscriptionInfo }>(
        "/practitioner/dashboard/subscription",
      ),
      useAuthenticatedFetch<{ success: boolean; data: InvoiceInfo[] }>(
        "/payments/practitioner/invoices",
      ),
      useAuthenticatedFetch<{ success: boolean; data: ProfileData }>(
        "/practitioner/dashboard/profile",
      ),
    ]);

    if (profRes.success) {
      twoFactorEnabled.value = profRes.data.twoFactorEnabled;
    }
    if (notifRes.success) {
      notifications.value = {
        appointmentReminders: notifRes.data.appointmentReminders,
        newMessages: notifRes.data.newMessages,
        emailNotifications: notifRes.data.emailNotifications,
      };
    }
    if (subRes.success) {
      subscription.value = subRes.data;
    }
    if (invRes.success) {
      invoices.value = invRes.data || [];
    }
    if (profileRes.success) {
      profileVisibility.value.isProfilePublic =
        profileRes.data.isProfilePublic || false;
      profileVisibility.value.messagingEnabled =
        profileRes.data.messagingEnabled || false;
      profileVisibility.value.tarifs.baseConsultationFee =
        profileRes.data.baseConsultationFee;
      profileVisibility.value.tarifs.teleconsultationFee =
        profileRes.data.teleconsultationFee;
      profileVisibility.value.tarifs.emergencyFee =
        profileRes.data.emergencyFee;
      profileVisibility.value.tarifsAreDefined =
        !!profileRes.data.baseConsultationFee;
    }
  } catch (error: unknown) {
    console.error("Error fetching settings:", error);
  } finally {
    loading.value = false;
  }
};

const updatePassword = async () => {
  if (!passwords.value.currentPassword || !passwords.value.newPassword) return;
  savingPwd.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      message?: string;
    }>("/settings/password", {
      method: "PATCH",
      body: passwords.value,
    });
    if (res.success) {
      toast.success("Mot de passe mis à jour");
      passwords.value = { currentPassword: "", newPassword: "" };
    }
  } catch (err: unknown) {
    const apiError = err as { response?: { message?: string } };
    toast.error(apiError.response?.message || "Erreur");
  } finally {
    savingPwd.value = false;
  }
};

const toggle2fa = async () => {
  if (twoFactorEnabled.value) {
    // Checkbox is checked (meaning they want to enable). Revert visually first.
    twoFactorEnabled.value = false;
    await start2FASetup();
  } else {
    // Checkbox is unchecked (meaning they want to disable). Revert visually first.
    twoFactorEnabled.value = true;
    disablePassword.value = "";
    disableError.value = "";
    showDisableModal.value = true;
  }
};

const start2FASetup = async () => {
  toggling2FA.value = true;
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
    const err = e as { data?: { message?: string } };
    toast.error(err.data?.message || "Erreur lors de la configuration du 2FA");
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

const updateNotifications = async () => {
  try {
    await useAuthenticatedFetch("/settings/notifications", {
      method: "PATCH",
      body: notifications.value,
    });
  } catch (error: unknown) {
    console.error("Error updating notifications:", error);
  }
};

const updateProfileVisibility = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      message?: string;
    }>("/practitioner/dashboard/profile", {
      method: "PATCH",
      body: { isProfilePublic: profileVisibility.value.isProfilePublic },
    });
    if (res.success) {
      toast.success(
        profileVisibility.value.isProfilePublic
          ? "Votre profil est maintenant public"
          : "Votre profil est maintenant privé",
      );
    }
  } catch (err: unknown) {
    // revert the toggle on error
    profileVisibility.value.isProfilePublic =
      !profileVisibility.value.isProfilePublic;
    const apiError = err as { message?: string };
    toast.error(apiError.message || "Erreur lors de la mise à jour");
  }
};

const updateMessagingVisibility = async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      message?: string;
    }>("/practitioner/dashboard/profile", {
      method: "PATCH",
      body: { messagingEnabled: profileVisibility.value.messagingEnabled },
    });
    if (res.success) {
      toast.success(
        profileVisibility.value.messagingEnabled
          ? "Messagerie activée avec succès"
          : "Messagerie désactivée",
      );
    }
  } catch (err: unknown) {
    profileVisibility.value.messagingEnabled =
      !profileVisibility.value.messagingEnabled; // revert
    const apiError = err as { message?: string };
    toast.error(apiError.message || "Erreur lors de la mise à jour");
  }
};

const cancelSubscription = async () => {
  if (
    !confirm(
      "Voulez-vous vraiment annuler votre abonnement ? Cette action prendra effet à la fin de la période facturée.",
    )
  )
    return;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: SubscriptionInfo;
    }>("/practitioner/dashboard/subscription/cancel", {
      method: "POST",
    });
    if (res.success) {
      subscription.value = res.data;
      toast.success("Abonnement annulé");
    }
  } catch (error: unknown) {
    toast.error("Erreur lors de l'annulation");
    console.error("Error cancelling subscription:", error);
  }
};

const downloadInvoice = async (invoiceId: string, invoiceNumber?: string) => {
  try {
    const response = await useAuthenticatedFetch<Blob>(
      `/payments/practitioner/invoices/${invoiceId}/download`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response as any], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facture-${invoiceNumber || invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    console.error(error);
    toast.error("Erreur lors du téléchargement");
  }
};

onMounted(() => {
  fetchData();
});
</script>
