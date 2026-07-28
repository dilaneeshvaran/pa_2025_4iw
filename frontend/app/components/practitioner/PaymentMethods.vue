<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Moyens de paiement enregistrés
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Gérez vos cartes bancaires et comptes Mobile Money pour le règlement de votre abonnement praticien.
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95"
      >
        <Plus class="h-4 w-4" />
        Ajouter un moyen de paiement
      </button>
    </div>

    <div
      v-if="!hasVerifiedMethod && !loading"
      class="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/30"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Action requise pour votre abonnement
          </h3>
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Vous devez ajouter et vérifier au moins un moyen de paiement actif pour assurer le renouvellement automatique de votre abonnement praticien après votre période d'essai.
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="hasVerifiedMethod && !loading"
      class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30"
    >
      <div class="flex items-start gap-3">
        <CheckCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h3 class="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Moyen de paiement vérifié et actif
          </h3>
          <p class="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            Votre moyen de paiement par défaut est prêt pour la gestion de votre abonnement.
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-gray-400">
      <Loader2 class="mb-3 h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
      <span class="text-sm">Chargement des moyens de paiement...</span>
    </div>

    <div
      v-else-if="paymentMethods.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="mb-4 rounded-full bg-orange-50 p-4 dark:bg-orange-950/30">
        <Wallet class="h-10 w-10 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 class="text-base font-bold text-gray-900 dark:text-gray-100">
        Aucun moyen de paiement enregistré
      </h3>
      <p class="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
        Ajoutez une carte bancaire (Visa, Mastercard) ou un compte Mobile Money (Orange, MTN, Wave, Moov) pour régler votre abonnement.
      </p>
      <button
        @click="showAddModal = true"
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 active:scale-95"
      >
        <Plus class="h-4 w-4" />
        Ajouter un moyen de paiement
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="method in paymentMethods"
        :key="method.id"
        class="flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all md:flex-row md:items-center"
        :class="[
          method.isDefault
            ? 'border-orange-500/50 bg-orange-50/20 dark:bg-orange-950/20'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700',
        ]"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
            :class="[
              method.type === 'MOBILE_MONEY'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30',
            ]"
          >
            <span v-if="method.type === 'MOBILE_MONEY'">📱</span>
            <span v-else>💳</span>
          </div>

          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold text-gray-900 dark:text-gray-100">
                {{ method.label }}
              </span>
              <span
                v-if="method.isDefault"
                class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
              >
                Par défaut
              </span>
              <span
                v-if="method.isVerified"
                class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              >
                Vérifié
              </span>
              <span
                v-else
                class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              >
                Non vérifié
              </span>
            </div>

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="method.type === 'MOBILE_MONEY'">
                Mobile Money ({{ getOperatorLabel(method.mobileOperator) }})
                <span v-if="method.mobileNumber">· {{ method.mobileNumber }}</span>
              </span>
              <span v-else>
                {{ method.cardBrand || 'Carte' }} •••• {{ method.cardLast4 }}
                <span v-if="method.cardExpMonth && method.cardExpYear">
                  · Exp. {{ String(method.cardExpMonth).padStart(2, "0") }}/{{ method.cardExpYear }}
                </span>
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-auto">
          <button
            v-if="!method.isVerified"
            @click="openVerifyModal(method)"
            class="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-800/40 dark:bg-orange-950/30 dark:text-orange-300"
          >
            Vérifier
          </button>
          <button
            v-if="method.isVerified && !method.isDefault"
            @click="setDefault(method.id)"
            class="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Par défaut
          </button>
          <button
            @click="openDeleteModal(method)"
            class="rounded-xl border border-red-100 p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30"
            title="Supprimer"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="showAddModal = false"
      >
        <div
          class="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              Ajouter un moyen de paiement
            </h3>
            <button
              @click="showAddModal = false"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="addMethod" class="flex-1 space-y-5 overflow-y-auto p-6">
            <div
              v-if="addError"
              class="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-200"
            >
              {{ addError }}
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="newType = 'MOBILE_MONEY'"
                class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all"
                :class="[
                  newType === 'MOBILE_MONEY'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300',
                ]"
              >
                <span class="text-2xl">📱</span>
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100">Mobile Money</span>
              </button>
              <button
                type="button"
                @click="newType = 'CARD'"
                class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all"
                :class="[
                  newType === 'CARD'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300',
                ]"
              >
                <span class="text-2xl">💳</span>
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100">Carte Bancaire</span>
              </button>
            </div>

            <div v-if="newType === 'MOBILE_MONEY'" class="space-y-4">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Opérateur
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    v-for="op in operators"
                    :key="op.value"
                    @click="newOperator = op.value"
                    class="flex items-center justify-center rounded-xl border-2 p-3 text-xs font-semibold transition-all"
                    :class="[
                      newOperator === op.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300',
                    ]"
                  >
                    <span class="mr-1.5 text-base">{{ op.icon }}</span>
                    {{ op.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  v-model="newMobileNumber"
                  placeholder="Ex: 0707070707"
                  required
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div v-else class="space-y-4">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Type de Carte
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="newCardBrand = 'Visa'"
                    class="flex items-center justify-center rounded-xl border-2 p-3 text-xs font-semibold transition-all"
                    :class="[
                      newCardBrand === 'Visa'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300',
                    ]"
                  >
                    💳 Visa
                  </button>
                  <button
                    type="button"
                    @click="newCardBrand = 'Mastercard'"
                    class="flex items-center justify-center rounded-xl border-2 p-3 text-xs font-semibold transition-all"
                    :class="[
                      newCardBrand === 'Mastercard'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300',
                    ]"
                  >
                    💳 Mastercard
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Numéro de Carte
                </label>
                <input
                  type="text"
                  v-model="newCardNumber"
                  placeholder="4532 1234 5678 9012"
                  maxlength="19"
                  required
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Mois
                  </label>
                  <select
                    v-model="newCardExpMonth"
                    class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option v-for="m in 12" :key="m" :value="m">
                      {{ String(m).padStart(2, "0") }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Année
                  </label>
                  <select
                    v-model="newCardExpYear"
                    class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option v-for="y in 10" :key="y" :value="2025 + y">
                      {{ 2025 + y }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    CVV
                  </label>
                  <input
                    type="password"
                    v-model="newCardCvv"
                    placeholder="123"
                    maxlength="4"
                    required
                    class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="submitting"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50"
              >
                <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                Enregistrer le moyen de paiement
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showVerifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="showVerifyModal = false"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900 dark:text-gray-100">
              Vérification du moyen de paiement
            </h3>
            <button
              @click="showVerifyModal = false"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <p class="text-xs text-gray-600 dark:text-gray-400">
            Entrez le code de vérification à 6 chiffres envoyé pour valider votre moyen de paiement (Code de test : <strong class="text-orange-600 dark:text-orange-400">123456</strong>).
          </p>

          <div v-if="verifyError" class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-200">
            {{ verifyError }}
          </div>

          <div class="mt-4">
            <input
              type="text"
              v-model="verificationCode"
              placeholder="123456"
              maxlength="6"
              class="w-full rounded-xl border border-gray-300 text-center text-lg font-bold tracking-widest px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div class="mt-5 flex gap-2">
            <button
              type="button"
              @click="showVerifyModal = false"
              class="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              type="button"
              @click="submitVerification"
              :disabled="verifying || !verificationCode"
              class="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              <Loader2 v-if="verifying" class="mx-auto h-4 w-4 animate-spin" />
              <span v-else>Valider</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="showDeleteModal = false"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        >
          <h3 class="text-base font-bold text-gray-900 dark:text-gray-100">
            Supprimer ce moyen de paiement ?
          </h3>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer le moyen de paiement <strong>{{ selectedMethod?.label }}</strong> ?
          </p>

          <div class="mt-6 flex justify-end gap-2">
            <button
              @click="showDeleteModal = false"
              class="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              @click="confirmDelete"
              :disabled="deleting"
              class="flex items-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Loader2 v-if="deleting" class="h-4 w-4 animate-spin" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Wallet,
  X,
} from "lucide-vue-next";

interface SavedPaymentMethod {
  id: string;
  type: "CARD" | "MOBILE_MONEY";
  label: string;
  isDefault: boolean;
  cardLast4?: string | null;
  cardBrand?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  mobileOperator?: string | null;
  mobileNumber?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}

const paymentMethods = ref<SavedPaymentMethod[]>([]);
const loading = ref(true);
const submitting = ref(false);
const verifying = ref(false);
const deleting = ref(false);

const showAddModal = ref(false);
const showVerifyModal = ref(false);
const showDeleteModal = ref(false);

const selectedMethod = ref<SavedPaymentMethod | null>(null);
const addError = ref("");
const verifyError = ref("");
const verificationCode = ref("123456");

const newType = ref<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
const newOperator = ref("orange_money");
const newMobileNumber = ref("");

const newCardBrand = ref("Visa");
const newCardNumber = ref("");
const newCardExpMonth = ref(12);
const newCardExpYear = ref(2028);
const newCardCvv = ref("123");

const operators = [
  { value: "orange_money", label: "Orange Money", icon: "🍊" },
  { value: "mtn_money", label: "MTN MoMo", icon: "🟡" },
  { value: "wave", label: "Wave", icon: "🌊" },
  { value: "moov_money", label: "Moov Money", icon: "🔵" },
];

const hasVerifiedMethod = computed(() => {
  return paymentMethods.value.some((m) => m.isVerified);
});

const getOperatorLabel = (op?: string | null) => {
  if (!op) return "Mobile Money";
  const found = operators.find((o) => o.value === op);
  return found ? found.label : op.toUpperCase();
};

const fetchPaymentMethods = async () => {
  loading.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SavedPaymentMethod[];
    }>("/payments/methods");
    if (response.success && response.data) {
      paymentMethods.value = response.data;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des moyens de paiement:", error);
  } finally {
    loading.value = false;
  }
};

const addMethod = async () => {
  addError.value = "";
  submitting.value = true;

  try {
    let payload: any = {
      type: newType.value,
      isDefault: paymentMethods.value.length === 0,
    };

    if (newType.value === "MOBILE_MONEY") {
      if (!newMobileNumber.value) {
        addError.value = "Veuillez entrer votre numéro de téléphone";
        submitting.value = false;
        return;
      }
      payload.mobileOperator = newOperator.value;
      payload.mobileNumber = newMobileNumber.value;
    } else {
      if (!newCardNumber.value || newCardNumber.value.length < 12) {
        addError.value = "Veuillez entrer un numéro de carte valide";
        submitting.value = false;
        return;
      }
      const cleanCard = newCardNumber.value.replace(/\s+/g, "");
      payload.cardBrand = newCardBrand.value;
      payload.cardLast4 = cleanCard.slice(-4);
      payload.cardExpMonth = Number(newCardExpMonth.value);
      payload.cardExpYear = Number(newCardExpYear.value);
    }

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SavedPaymentMethod;
      message?: string;
    }>("/payments/methods", {
      method: "POST",
      body: payload,
    });

    if (response.success && response.data) {
      showAddModal.value = false;
      resetAddForm();
      await fetchPaymentMethods();

      selectedMethod.value = response.data;
      verificationCode.value = "123456";
      showVerifyModal.value = true;
    }
  } catch (error: any) {
    addError.value = error?.data?.message || "Erreur lors de l'ajout du moyen de paiement";
  } finally {
    submitting.value = false;
  }
};

const resetAddForm = () => {
  newMobileNumber.value = "";
  newCardNumber.value = "";
  newCardCvv.value = "123";
  addError.value = "";
};

const openVerifyModal = (method: SavedPaymentMethod) => {
  selectedMethod.value = method;
  verificationCode.value = "123456";
  verifyError.value = "";
  showVerifyModal.value = true;
};

const submitVerification = async () => {
  if (!selectedMethod.value) return;
  verifyError.value = "";
  verifying.value = true;

  try {
    const response = await useAuthenticatedFetch<{ success: boolean; message?: string }>(
      `/payments/methods/${selectedMethod.value.id}/verify`,
      {
        method: "POST",
        body: { verificationCode: verificationCode.value },
      }
    );

    if (response.success) {
      showVerifyModal.value = false;
      await fetchPaymentMethods();
    }
  } catch (error: any) {
    verifyError.value = error?.data?.message || "Code de vérification incorrect";
  } finally {
    verifying.value = false;
  }
};

const setDefault = async (methodId: string) => {
  try {
    await useAuthenticatedFetch(`/payments/methods/${methodId}/default`, {
      method: "PATCH",
    });
    await fetchPaymentMethods();
  } catch (error) {
    console.error("Erreur lors de la mise par défaut:", error);
  }
};

const openDeleteModal = (method: SavedPaymentMethod) => {
  selectedMethod.value = method;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!selectedMethod.value) return;
  deleting.value = true;

  try {
    await useAuthenticatedFetch(`/payments/methods/${selectedMethod.value.id}`, {
      method: "DELETE",
    });
    showDeleteModal.value = false;
    await fetchPaymentMethods();
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchPaymentMethods();
});
</script>
