<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gérez vos informations personnelles et la sécurité de votre compte administrateur.
      </p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-48 rounded-2xl bg-gray-200"></div>
      <div class="h-48 rounded-2xl bg-gray-200"></div>
      <div class="h-48 rounded-2xl bg-gray-200"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- profile settings -->
      <UiCard class="p-6">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <User class="h-5 w-5 text-gray-500 dark:text-gray-400" /> Informations personnelles
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
            <UiInput v-model="profileForm.firstName" placeholder="Prénom" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <UiInput v-model="profileForm.lastName" placeholder="Nom" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
            <UiInput v-model="profileForm.phone" type="tel" placeholder="+225 XX XX XX XX" />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <UiButton @click="saveProfile" :disabled="savingProfile" class="bg-orange-600 hover:bg-orange-700 text-white">
            {{ savingProfile ? 'Enregistrement...' : 'Mettre à jour le profil' }}
          </UiButton>
        </div>
      </UiCard>

      <!-- email settings -->
      <UiCard class="p-6">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Mail class="h-5 w-5 text-gray-500 dark:text-gray-400" /> Adresse email
        </h3>
        <form class="space-y-4" @submit.prevent="saveEmail">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email actuel</label>
            <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">{{ currentEmail }}</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouvel email</label>
              <UiInput
                v-model="emailForm.newEmail"
                type="email"
                placeholder="nouveau@email.com"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe (confirmation)</label>
              <UiInput
                v-model="emailForm.password"
                type="password"
                placeholder="Votre mot de passe"
                required
              />
            </div>
          </div>
          <div class="flex justify-end">
            <UiButton type="submit" :disabled="savingEmail" class="bg-orange-600 hover:bg-orange-700 text-white">
              {{ savingEmail ? "Envoi..." : "Modifier l'email" }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- password settings -->
      <UiCard class="p-6">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Lock class="h-5 w-5 text-gray-500 dark:text-gray-400" /> Mot de passe
        </h3>
        <form class="space-y-4" @submit.prevent="savePassword">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe actuel</label>
              <UiInput
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Mot de passe actuel"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
              <UiInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Nouveau mot de passe"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
              <UiInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirmer le mot de passe"
                required
              />
            </div>
          </div>
          <div class="flex justify-end">
            <UiButton type="submit" :disabled="savingPassword" class="bg-orange-600 hover:bg-orange-700 text-white">
              {{ savingPassword ? "Modification..." : "Modifier le mot de passe" }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- two factor authentication -->
      <UiCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Shield class="h-5 w-5 text-gray-500 dark:text-gray-400" /> Authentification à deux facteurs (2FA)
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajoutez une couche de sécurité supplémentaire à votre compte administrateur.
            </p>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 toggle-switch',
              twoFactorEnabled ? 'bg-orange-500' : 'bg-gray-200',
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
      </UiCard>
    </div>

    <!-- 2FA SETUP MODAL -->
    <div
      v-if="showSetupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-100 dark:border-gray-800">
        <!-- Setup Phase -->
        <div v-if="!showBackupCodes">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield class="w-6 h-6 text-orange-600 dark:text-orange-400" />
              Activer le 2FA
            </h3>
            <button
              @click="showSetupModal = false"
              class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition"
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Scannez le code QR ci-dessous avec votre application d'authentification (Google Authenticator, Duo, etc.) puis saisissez le code de vérification à 6 chiffres.
          </p>

          <div v-if="qrCodeUrl" class="flex justify-center bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
            <img :src="qrCodeUrl" alt="QR Code d'activation 2FA" class="max-w-[200px]" />
          </div>

          <div class="mb-4">
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Clé secrète (si le QR code ne fonctionne pas)</label>
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 font-mono text-xs text-gray-800 dark:text-gray-200">
              <span class="select-all">{{ secretKey }}</span>
              <button
                @click="copySecretKey"
                class="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-semibold flex items-center gap-1"
                type="button"
              >
                Copier
              </button>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code de vérification</label>
            <UiInput
              v-model="verificationCode"
              type="text"
              placeholder="000000"
              maxlength="6"
              class="text-center text-lg font-bold tracking-widest"
              required
            />
            <p v-if="codeError" class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              {{ codeError }}
            </p>
          </div>

          <div class="flex justify-end gap-3">
            <button
              @click="showSetupModal = false"
              class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition focus:ring-2 focus:ring-gray-400"
            >
              Annuler
            </button>
            <button
              @click="verify2FA"
              :disabled="toggling2FA || verificationCode.length < 6"
              class="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              type="button"
            >
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
    >
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-100 dark:border-gray-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield class="w-6 h-6 text-red-600 dark:text-red-400" />
            Désactiver le 2FA
          </h3>
          <button
            @click="showDisableModal = false"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-600 transition"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Pour désactiver l'authentification à deux facteurs, veuillez saisir votre mot de passe pour confirmer votre identité.
        </p>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
          <UiInput
            v-model="disablePassword"
            type="password"
            placeholder="Votre mot de passe de confirmation"
            required
          />
          <p v-if="disableError" class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            {{ disableError }}
          </p>
        </div>

        <div class="flex justify-end gap-3">
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
import { ref, onMounted } from "vue";
import {
  Mail,
  Lock,
  Shield,
  User,
} from "lucide-vue-next";
import { useToast } from "vue-toastification";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

const toast = useToast();

const loading = ref(true);
const currentEmail = ref("");

// Profile form
const profileForm = ref({ firstName: "", lastName: "", phone: "" });
const savingProfile = ref(false);

// Email forms
const emailForm = ref({
  newEmail: "",
  password: "",
});
const savingEmail = ref(false);

// Password forms
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const savingPassword = ref(false);

// 2FA state refs
const twoFactorEnabled = ref(false);
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

const loadSettings = async () => {
  loading.value = true;
  try {
    const profRes = await useAuthenticatedFetch<{
      success: boolean;
      data: { email: string; twoFactorEnabled: boolean; admin?: { firstName: string; lastName: string; phone: string } };
    }>("/settings/profile");

    if (profRes.success) {
      currentEmail.value = profRes.data.email;
      twoFactorEnabled.value = profRes.data.twoFactorEnabled;
      const a = profRes.data.admin || profRes.data as any;
      profileForm.value.firstName = a.firstName ?? '';
      profileForm.value.lastName = a.lastName ?? '';
      profileForm.value.phone = a.phone ?? '';
    }
  } catch (error: unknown) {
    console.error("Error fetching settings:", error);
    toast.error("Erreur lors du chargement des informations de compte");
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  savingProfile.value = true;
  try {
    await useAuthenticatedFetch<{ success: boolean }>("/settings/profile", {
      method: "PATCH",
      body: profileForm.value,
    });
    toast.success("Profil mis à jour avec succès");
  } catch (err: unknown) {
    const apiError = err as { data?: { message?: string } };
    toast.error(apiError.data?.message || "Erreur lors de la mise à jour du profil");
  } finally {
    savingProfile.value = false;
  }
};

const saveEmail = async () => {
  if (!emailForm.value.newEmail || !emailForm.value.password) return;
  savingEmail.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      message?: string;
    }>("/settings/email", {
      method: "PATCH",
      body: emailForm.value,
    });
    if (res.success) {
      toast.success("Adresse email mise à jour avec succès");
      currentEmail.value = emailForm.value.newEmail;
      emailForm.value = { newEmail: "", password: "" };
    }
  } catch (err: unknown) {
    const apiError = err as { data?: { message?: string } };
    toast.error(apiError.data?.message || "Erreur lors de la mise à jour de l'email");
  } finally {
    savingEmail.value = false;
  }
};

const savePassword = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) return;
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error("Les nouveaux mots de passe ne correspondent pas");
    return;
  }
  savingPassword.value = true;
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      message?: string;
    }>("/settings/password", {
      method: "PATCH",
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
      },
    });
    if (res.success) {
      toast.success("Mot de passe mis à jour");
      passwordForm.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
    }
  } catch (err: unknown) {
    const apiError = err as { data?: { message?: string } };
    toast.error(apiError.data?.message || "Erreur lors de la modification du mot de passe");
  } finally {
    savingPassword.value = false;
  }
};

const toggleTwoFactor = async () => {
  if (!twoFactorEnabled.value) {
    await start2FASetup();
  } else {
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

const copySecretKey = () => {
  if (!secretKey.value) return;
  navigator.clipboard.writeText(secretKey.value);
  toast.success("Clé secrète copiée !");
};

const copyBackupCodes = () => {
  if (backupCodes.value.length === 0) return;
  const text = backupCodes.value.join("\n");
  navigator.clipboard.writeText(text);
  toast.success("Codes de secours copiés dans le presse-papiers !");
};

onMounted(() => {
  loadSettings();
});
</script>
