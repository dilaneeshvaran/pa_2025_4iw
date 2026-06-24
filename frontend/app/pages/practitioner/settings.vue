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
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs"
                    @click="downloadInvoice(inv.id)"
                    >PDF</UiButton
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>
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
  try {
    await useAuthenticatedFetch("/settings/2fa", {
      method: "PATCH",
      body: { enabled: twoFactorEnabled.value },
    });
    toast.success("2FA mis à jour");
  } catch (error: unknown) {
    twoFactorEnabled.value = !twoFactorEnabled.value; // revert
    console.error("Error updating 2FA:", error);
  }
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

const downloadInvoice = async (invoiceId: string) => {
  try {
    const response = await useAuthenticatedFetch<
      Blob | { success: boolean; message?: string }
    >(`/payments/practitioner/invoices/${invoiceId}/download`);

    // check if response is json (success false or message) or blob directly
    if (response instanceof Blob) {
      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (response && response.success === false) {
      toast.error(response.message || "Erreur");
    }
  } catch (error: unknown) {
    console.error(error);
    toast.error("Erreur lors du téléchargement");
  }
};

onMounted(() => {
  fetchData();
});
</script>
