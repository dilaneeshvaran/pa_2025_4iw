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
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Nouveau mot de passe</label
                >
                <input
                  v-model="passwords.newPassword"
                  type="password"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"
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
                class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"
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
            class="mb-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-4"
          >
            <div>
              <h4 class="text-lg font-bold text-blue-900">
                Plan {{ subscription.plan }}
              </h4>
              <p class="mt-1 text-sm text-blue-700">
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
              <p class="mb-1 text-2xl font-bold text-blue-900">
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
import { Settings, Shield, Bell, CreditCard, FileText } from "lucide-vue-next";
import { useToast } from "vue-toastification";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});

const authStore = useAuthStore();
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

const subscription = ref<any>(null);
const invoices = ref<any[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const [profRes, notifRes, subRes, invRes] = await Promise.all([
      useAuthenticatedFetch<{ success: boolean; data: any }>(
        "/settings/profile",
      ),
      useAuthenticatedFetch<{ success: boolean; data: any }>(
        "/settings/notifications",
      ),
      useAuthenticatedFetch<{ success: boolean; data: any }>(
        "/practitioner/dashboard/subscription",
      ),
      useAuthenticatedFetch<{ success: boolean; data: any }>(
        "/payments/practitioner/invoices",
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
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const updatePassword = async () => {
  if (!passwords.value.currentPassword || !passwords.value.newPassword) return;
  savingPwd.value = true;
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>(
      "/settings/password",
      {
        method: "PATCH",
        body: passwords.value,
      },
    );
    if (res.success) {
      toast.success("Mot de passe mis à jour");
      passwords.value = { currentPassword: "", newPassword: "" };
    }
  } catch (err: any) {
    toast.error(err.response?.message || "Erreur");
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
  } catch (err) {
    twoFactorEnabled.value = !twoFactorEnabled.value; // revert
  }
};

const updateNotifications = async () => {
  try {
    await useAuthenticatedFetch("/settings/notifications", {
      method: "PATCH",
      body: notifications.value,
    });
  } catch (err) {
    console.error(err);
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
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>(
      "/practitioner/dashboard/subscription/cancel",
      {
        method: "POST",
      },
    );
    if (res.success) {
      subscription.value = res.data;
      toast.success("Abonnement annulé");
    }
  } catch (err) {
    toast.error("Erreur lors de l'annulation");
  }
};

const downloadInvoice = async (invoiceId: string) => {
  try {
    const response = await useAuthenticatedFetch<
      Blob | { success: boolean; message?: string }
    >(`/payments/practitioner/invoices/${invoiceId}/download`);

    // Check if response is JSON (success false or message) or Blob directly
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
  } catch (error) {
    console.error(error);
    toast.error("Erreur lors du téléchargement");
  }
};

onMounted(() => {
  fetchData();
});
</script>
