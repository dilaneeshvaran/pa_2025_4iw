<template>
  <div class="space-y-6">
    <UiCard>
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900">
          Tarifs de consultation
        </h2>
        <p class="text-sm text-gray-500">
          Définissez vos tarifs pour chaque type de consultation. Le tarif de
          consultation standard (*) est requis pour rendre votre profil public.
        </p>
      </div>

      <form @submit.prevent="saveConfig" class="space-y-6">
        <div class="grid gap-6 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Consultation standard (FCFA) *
            </label>
            <UiInput
              v-model.number="form.baseConsultationFee"
              type="number"
              min="0"
              required
              placeholder="Ex: 15000"
              class="w-full"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Téléconsultation (FCFA)
            </label>
            <UiInput
              v-model.number="form.teleconsultationFee"
              type="number"
              min="0"
              placeholder="Ex: 10000"
              class="w-full"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Urgence (FCFA)
            </label>
            <UiInput
              v-model.number="form.emergencyFee"
              type="number"
              min="0"
              placeholder="Ex: 25000"
              class="w-full"
            />
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <h2 class="mb-2 text-lg font-semibold text-gray-900">
            Moyens de paiement acceptés en cabinet
          </h2>
          <p class="mb-4 text-sm text-gray-500">
            Sélectionnez les moyens de paiement que vous acceptez.
          </p>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label
              v-for="method in availableMethods"
              :key="method.value"
              class="flex items-center space-x-3"
            >
              <input
                type="checkbox"
                :value="method.value"
                v-model="form.acceptedPaymentMethods"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ method.label }}</span>
            </label>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <h2 class="mb-2 text-lg font-semibold text-gray-900">
            Informations bancaires
          </h2>
          <p class="mb-4 text-sm text-gray-500">
            Ces informations seront utilisées pour vos versements et factures.
          </p>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Nom de la banque
              </label>
              <UiInput
                v-model="form.bankInfo.bankName"
                type="text"
                placeholder="Ex: SGCI, Ecobank..."
                class="w-full"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Titulaire du compte
              </label>
              <UiInput
                v-model="form.bankInfo.accountName"
                type="text"
                placeholder="Nom figurant sur le RIB"
                class="w-full"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                IBAN / RIB
              </label>
              <UiInput
                v-model="form.bankInfo.iban"
                type="text"
                placeholder="Identifiant de compte bancaire"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <UiButton type="submit" :disabled="saving" class="w-full sm:w-auto">
            <span v-if="saving">Enregistrement...</span>
            <span v-else>Enregistrer les modifications</span>
          </UiButton>
        </div>

        <div
          v-if="successMsg"
          class="mt-4 rounded-md bg-green-50 p-4 text-green-700"
        >
          {{ successMsg }}
        </div>
        <div v-if="errorMsg" class="mt-4 rounded-md bg-red-50 p-4 text-red-700">
          {{ errorMsg }}
        </div>
      </form>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const availableMethods = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte Bancaire" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHECK", label: "Chèque" },
  { value: "TRANSFER", label: "Virement" },
  { value: "OTHER", label: "Autre" },
];

interface BankInfo {
  bankName: string;
  accountName: string;
  iban: string;
}

const form = ref({
  baseConsultationFee: 0,
  teleconsultationFee: undefined as number | undefined,
  emergencyFee: undefined as number | undefined,
  acceptedPaymentMethods: [] as string[],
  bankInfo: {
    bankName: "",
    accountName: "",
    iban: "",
  } as BankInfo,
});

const loading = ref(true);
const saving = ref(false);
const successMsg = ref("");
const errorMsg = ref("");

interface BillingConfigResponse {
  data: {
    baseConsultationFee: number;
    teleconsultationFee?: number;
    emergencyFee?: number;
    acceptedPaymentMethods: string[];
    bankInfo?: BankInfo;
  };
}

onMounted(async () => {
  try {
    loading.value = true;
    const res = await useAuthenticatedFetch<BillingConfigResponse>(
      "/practitioner/dashboard/billing-config",
    );
    if (res.data) {
      form.value.baseConsultationFee = res.data.baseConsultationFee || 0;
      form.value.teleconsultationFee = res.data.teleconsultationFee;
      form.value.emergencyFee = res.data.emergencyFee;
      form.value.acceptedPaymentMethods = res.data.acceptedPaymentMethods || [];

      if (res.data.bankInfo) {
        form.value.bankInfo = {
          bankName: res.data.bankInfo.bankName || "",
          accountName: res.data.bankInfo.accountName || "",
          iban: res.data.bankInfo.iban || "",
        };
      }
    }
  } catch (err: unknown) {
    console.error("Failed to load billing config", err);
  } finally {
    loading.value = false;
  }
});

const saveConfig = async () => {
  try {
    saving.value = true;
    successMsg.value = "";
    errorMsg.value = "";

    await useAuthenticatedFetch("/practitioner/dashboard/billing-config", {
      method: "PATCH",
      body: {
        baseConsultationFee: form.value.baseConsultationFee,
        teleconsultationFee: form.value.teleconsultationFee,
        emergencyFee: form.value.emergencyFee,
        acceptedPaymentMethods: form.value.acceptedPaymentMethods,
        bankInfo: form.value.bankInfo,
      },
    });

    successMsg.value = "Configuration mise à jour avec succès";
    setTimeout(() => {
      successMsg.value = "";
    }, 3000);
  } catch (err: unknown) {
    console.error("Failed to save billing config", err);
    const apiError = err as { data?: { message?: string } };
    errorMsg.value = apiError.data?.message || "Erreur lors de la sauvegarde";
  } finally {
    saving.value = false;
  }
};
</script>
