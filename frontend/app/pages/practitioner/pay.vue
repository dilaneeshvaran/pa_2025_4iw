<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-900 border-b border-slate-200 py-4 px-6 shadow-sm flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-2xl font-bold text-orange-600 dark:text-orange-400 tracking-wide">MediCôte</span>
        <span class="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 font-medium px-2 py-0.5 rounded-full">Espace Praticien</span>
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="text-sm text-slate-600 font-medium hidden md:inline">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </span>
        <button
          @click="handleLogout"
          class="flex items-center text-sm font-medium text-slate-700 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
        >
          <LogOut class="w-4 h-4 mr-2" />
          Se déconnecter
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center">
      <div class="bg-white dark:bg-gray-900 border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <!-- Notice Alert Section -->
        <div class="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-start space-x-4">
            <div class="p-3 bg-white/20 rounded-xl mt-1 md:mt-0">
              <AlertTriangle class="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 class="text-2xl font-extrabold tracking-tight">Abonnement suspendu</h1>
              <p class="mt-2 text-orange-50/90 text-sm max-w-xl leading-relaxed">
                Votre période d'essai gratuite de 1 mois a expiré. Pour continuer à utiliser votre espace praticien, veuillez ajouter et vérifier un moyen de paiement actif (Carte Bancaire ou Mobile Money).
              </p>
            </div>
          </div>
          
          <button
            @click="checkSubscriptionStatus"
            :disabled="checking"
            class="flex items-center bg-white dark:bg-gray-900 text-orange-700 dark:text-orange-300 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 active:scale-95 transition-all text-sm shadow-md disabled:opacity-50"
          >
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': checking }" />
            Réactiver mon compte
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 md:p-8">
          <!-- Verification Success / Info banner -->
          <div v-if="hasVerifiedMethod" class="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start space-x-3 text-emerald-800 dark:text-emerald-200 text-sm">
            <CheckCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold">Moyen de paiement vérifié configuré !</p>
              <p class="text-emerald-700 dark:text-emerald-300 mt-1">
                Vous avez configuré au moins un moyen de paiement validé. Cliquez sur le bouton <strong>"Réactiver mon compte"</strong> ci-dessus pour retourner à votre tableau de bord.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-slate-800 flex items-center">
              <CreditCard class="w-5 h-5 text-slate-500 mr-2" />
              Vos moyens de paiement enregistrés
            </h2>
            <button
              @click="showAddModal = true"
              class="flex items-center text-sm font-semibold bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 active:scale-95 transition-all shadow-sm"
            >
              <Plus class="w-4 h-4 mr-1.5" />
              Ajouter
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 class="w-8 h-8 animate-spin text-orange-600 dark:text-orange-400 mb-3" />
            Chargement des moyens de paiement...
          </div>

          <!-- Empty State -->
          <div v-else-if="paymentMethods.length === 0" class="border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 bg-slate-50/50">
            <Wallet class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="font-medium text-slate-700">Aucun moyen de paiement enregistré</p>
            <p class="text-xs text-slate-500 mt-1">Ajoutez une carte bancaire ou un numéro Mobile Money pour commencer.</p>
          </div>

          <!-- Methods List -->
          <div v-else class="space-y-4">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="border rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              :class="[
                method.isDefault ? 'border-orange-500 bg-orange-50/10' : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-gray-900'
              ]"
            >
              <div class="flex items-start space-x-3.5">
                <div class="p-3.5 rounded-xl text-2xl bg-slate-100/80 flex items-center justify-center">
                  <span v-if="method.type === 'MOBILE_MONEY'">📱</span>
                  <span v-else>💳</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-800">{{ method.label }}</span>
                    <span
                      v-if="method.isDefault"
                      class="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full"
                    >
                      Par défaut
                    </span>
                    <span
                      v-if="method.isVerified"
                      class="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full"
                    >
                      Vérifié
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full"
                    >
                      En attente de vérification
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ method.type === 'MOBILE_MONEY' ? 'Mobile Money (' + (method.mobileOperator || '').toUpperCase() + ')' : 'Carte Bancaire' }}
                  </p>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center space-x-2 self-end md:self-auto">
                <button
                  v-if="!method.isVerified"
                  @click="openVerifyModal(method)"
                  class="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 px-3.5 py-2 rounded-lg transition-colors border border-orange-200 dark:border-orange-800/40"
                >
                  Vérifier
                </button>
                <button
                  v-if="method.isVerified && !method.isDefault"
                  @click="setDefault(method.id)"
                  class="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
                >
                  Définir par défaut
                </button>
                <button
                  @click="openDeleteModal(method)"
                  class="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
      <p>&copy; 2026 MediCôte. Tous droits réservés. Assessment Annuel Web Engineering ESGI.</p>
    </footer>

    <!-- Add Payment Method Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">Ajouter un moyen de paiement</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="addMethod" class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Error alert -->
          <div v-if="addError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl p-3.5 text-xs text-red-800 dark:text-red-200">
            {{ addError }}
          </div>

          <!-- Selector -->
          <div class="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              @click="newType = 'MOBILE_MONEY'"
              class="flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all"
              :class="newType === 'MOBILE_MONEY' ? 'bg-white dark:bg-gray-900 text-orange-700 dark:text-orange-300 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
            >
              📱 Mobile Money
            </button>
            <button
              type="button"
              @click="newType = 'CARD'"
              class="flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all"
              :class="newType === 'CARD' ? 'bg-white dark:bg-gray-900 text-orange-700 dark:text-orange-300 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
            >
              💳 Carte Bancaire
            </button>
          </div>

          <!-- Mobile Money fields -->
          <div v-if="newType === 'MOBILE_MONEY'" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Opérateur</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  v-for="op in operators"
                  :key="op.value"
                  @click="newOperator = op.value"
                  class="flex items-center justify-center p-3 rounded-xl border-2 transition-all font-semibold text-sm"
                  :class="[
                    newOperator === op.value
                      ? 'border-orange-500 bg-orange-50/20 text-orange-800 dark:text-orange-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  ]"
                >
                  <span class="mr-2 text-base">{{ op.icon }}</span>
                  {{ op.label }}
                </button>
              </div>
            </div>

            <div>
              <label for="mobileNumber" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Numéro de téléphone</label>
              <input
                id="mobileNumber"
                type="tel"
                v-model="newMobileNumber"
                placeholder="Ex: 0707070707"
                required
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none"
              />
            </div>
          </div>

          <!-- Credit Card fields -->
          <div v-else class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Marque de Carte</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="newCardBrand = 'visa'"
                  class="flex items-center justify-center p-3 rounded-xl border-2 transition-all font-semibold text-sm"
                  :class="[
                    newCardBrand === 'visa'
                      ? 'border-orange-500 bg-orange-50/20 text-orange-800 dark:text-orange-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  ]"
                >
                  Visa
                </button>
                <button
                  type="button"
                  @click="newCardBrand = 'mastercard'"
                  class="flex items-center justify-center p-3 rounded-xl border-2 transition-all font-semibold text-sm"
                  :class="[
                    newCardBrand === 'mastercard'
                      ? 'border-orange-500 bg-orange-50/20 text-orange-800 dark:text-orange-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  ]"
                >
                  Mastercard
                </button>
              </div>
            </div>

            <div>
              <label for="cardNumber" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Numéro de carte</label>
              <input
                id="cardNumber"
                type="text"
                v-model="newCardNumber"
                placeholder="XXXX XXXX XXXX XXXX"
                maxlength="19"
                required
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none"
              />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label for="expMonth" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date d'expiration</label>
                <div class="flex items-center space-x-2">
                  <select
                    id="expMonth"
                    v-model="newExpMonth"
                    class="flex-1 px-3 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none bg-white dark:bg-gray-900"
                  >
                    <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                  </select>
                  <span class="text-slate-400">/</span>
                  <select
                    v-model="newExpYear"
                    aria-label="Année d'expiration"
                    class="flex-1 px-3 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none bg-white dark:bg-gray-900"
                  >
                    <option v-for="y in 10" :key="y" :value="2025 + y">{{ 2025 + y }}</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="cvv" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">CVV</label>
                <input
                  id="cvv"
                  type="password"
                  v-model="newCvv"
                  placeholder="XXX"
                  maxlength="4"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none text-center"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="newIsDefault"
              type="checkbox"
              v-model="newIsDefault"
              class="h-4.5 w-4.5 text-orange-600 dark:text-orange-400 focus:ring-orange-500 border-slate-300 rounded"
            />
            <label for="newIsDefault" class="ml-2 block text-sm text-slate-700">
              Définir comme moyen de paiement par défaut
            </label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="showAddModal = false"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="adding"
              class="px-6 py-2.5 text-sm font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 active:scale-95 transition-all shadow-sm flex items-center disabled:opacity-50"
            >
              <Loader2 v-if="adding" class="w-4 h-4 mr-2 animate-spin" />
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Verify OTP Modal -->
    <div v-if="showVerifyModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100">
        <h3 class="font-bold text-slate-800 text-lg mb-2">Vérifier le moyen de paiement</h3>
        <p class="text-xs text-slate-500 mb-6">
          Un code de vérification à 6 chiffres a été simulé pour votre compte. Entrez n'importe quel code entre 4 et 8 chiffres pour valider ce moyen de paiement.
        </p>

        <form @submit.prevent="verifyMethod" class="space-y-4">
          <div v-if="verifyError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl p-3 text-xs text-red-800 dark:text-red-200">
            {{ verifyError }}
          </div>

          <div>
            <label for="verificationCode" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Code de vérification</label>
            <input
              id="verificationCode"
              type="text"
              v-model="verificationCode"
              placeholder="Ex: 123456"
              required
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm outline-none text-center font-bold tracking-widest text-lg"
            />
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="showVerifyModal = false"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="verifying"
              class="px-6 py-2.5 text-sm font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 active:scale-95 transition-all shadow-sm flex items-center disabled:opacity-50"
            >
              <Loader2 v-if="verifying" class="w-4 h-4 mr-2 animate-spin" />
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100">
        <h3 class="font-bold text-slate-800 text-lg mb-2">Supprimer le moyen de paiement</h3>
        <p class="text-xs text-slate-500 mb-6">
          Êtes-vous sûr de vouloir supprimer {{ selectedMethod?.label }} ? Cette opération est irréversible.
        </p>

        <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            @click="deleteMethod"
            :disabled="deleting"
            class="px-6 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-sm flex items-center disabled:opacity-50"
          >
            <Loader2 v-if="deleting" class="w-4 h-4 mr-2 animate-spin" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import {
  CreditCard,
  Plus,
  Trash2,
  X,
  Wallet,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  LogOut,
  Loader2,
} from "lucide-vue-next";

definePageMeta({
  layout: false, // Clean custom portal layout
});

interface SavedPaymentMethod {
  id: string;
  type: "MOBILE_MONEY" | "CARD";
  label: string;
  isDefault: boolean;
  cardLast4?: string | null;
  cardBrand?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
  mobileOperator?: string | null;
  mobileNumber?: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface ApiError {
  data?: {
    message?: string;
  };
}

const authStore = useAuthStore();

const paymentMethods = ref<SavedPaymentMethod[]>([]);
const loading = ref(true);
const checking = ref(false);

const showAddModal = ref(false);
const newType = ref<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
const newOperator = ref("orange_money");
const newMobileNumber = ref("");
const newCardBrand = ref("visa");
const newCardNumber = ref("");
const newExpMonth = ref(1);
const newExpYear = ref(2026);
const newCvv = ref("");
const newIsDefault = ref(false);
const adding = ref(false);
const addError = ref("");

const showVerifyModal = ref(false);
const selectedMethod = ref<SavedPaymentMethod | null>(null);
const verificationCode = ref("");
const verifying = ref(false);
const verifyError = ref("");

const showDeleteModal = ref(false);
const deleting = ref(false);

const operators = [
  { value: "orange_money", label: "Orange Money", icon: "🟠" },
  { value: "mtn_money", label: "MTN MoMo", icon: "🟡" },
  { value: "moov_money", label: "Moov Money", icon: "🔵" },
  { value: "wave", label: "Wave", icon: "🌊" },
];

const hasVerifiedMethod = computed(() => {
  return paymentMethods.value.some((m) => m.isVerified);
});

const handleLogout = async () => {
  await authStore.logout();
  navigateTo("/auth/login");
};

const fetchPaymentMethods = async () => {
  loading.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SavedPaymentMethod[];
    }>("/payments/methods");

    if (response.success) {
      paymentMethods.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching payment methods:", error);
  } finally {
    loading.value = false;
  }
};

const addMethod = async () => {
  adding.value = true;
  addError.value = "";

  try {
    const body: Record<string, string | number | boolean> = {
      type: newType.value,
      isDefault: newIsDefault.value,
    };

    if (newType.value === "MOBILE_MONEY") {
      body.mobileOperator = newOperator.value;
      body.mobileNumber = newMobileNumber.value;
    } else {
      body.cardLast4 = newCardNumber.value.replace(/\s/g, "").slice(-4);
      body.cardBrand = newCardBrand.value;
      body.cardExpMonth = newExpMonth.value;
      body.cardExpYear = newExpYear.value;
    }

    await useAuthenticatedFetch("/payments/methods", {
      method: "POST",
      body,
    });

    showAddModal.value = false;
    resetForm();
    await fetchPaymentMethods();
  } catch (error: unknown) {
    addError.value =
      (error as ApiError)?.data?.message ||
      "Erreur lors de l'ajout du moyen de paiement";
  } finally {
    adding.value = false;
  }
};

const openVerifyModal = (method: SavedPaymentMethod) => {
  selectedMethod.value = method;
  verificationCode.value = "";
  verifyError.value = "";
  showVerifyModal.value = true;
};

const verifyMethod = async () => {
  if (!selectedMethod.value) return;
  verifying.value = true;
  verifyError.value = "";

  try {
    await useAuthenticatedFetch(
      `/payments/methods/${selectedMethod.value.id}/verify`,
      {
        method: "POST",
        body: { verificationCode: verificationCode.value },
      },
    );

    showVerifyModal.value = false;
    await fetchPaymentMethods();
  } catch (error: unknown) {
    verifyError.value =
      (error as ApiError)?.data?.message || "Erreur lors de la vérification";
  } finally {
    verifying.value = false;
  }
};

const openDeleteModal = (method: SavedPaymentMethod) => {
  selectedMethod.value = method;
  showDeleteModal.value = true;
};

const deleteMethod = async () => {
  if (!selectedMethod.value) return;
  deleting.value = true;

  try {
    await useAuthenticatedFetch(
      `/payments/methods/${selectedMethod.value.id}`,
      { method: "DELETE" },
    );
    showDeleteModal.value = false;
    await fetchPaymentMethods();
  } catch (error: unknown) {
    alert(
      (error as ApiError)?.data?.message || "Erreur lors de la suppression",
    );
  } finally {
    deleting.value = false;
  }
};

const setDefault = async (methodId: string) => {
  try {
    await useAuthenticatedFetch(`/payments/methods/${methodId}/default`, {
      method: "PATCH",
    });
    await fetchPaymentMethods();
  } catch (error: unknown) {
    alert(
      (error as ApiError)?.data?.message || "Erreur lors de la mise à jour",
    );
  }
};

const checkSubscriptionStatus = async () => {
  checking.value = true;
  try {
    // Calling the endpoint that gets the practitioner profile
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { isUnpaid: boolean };
    }>("/practitioner/dashboard/profile");

    if (response.success && response.data) {
      if (!response.data.isUnpaid) {
        // Success: the user is no longer unpaid!
        authStore.updateUser({ isUnpaid: false });
        navigateTo("/practitioner/dashboard");
      } else {
        alert("Aucun moyen de paiement vérifié trouvé. Veuillez ajouter et vérifier un moyen de paiement.");
      }
    }
  } catch (error) {
    console.error("Error verifying subscription:", error);
    alert("Erreur lors de la vérification de l'abonnement. Veuillez réessayer.");
  } finally {
    checking.value = false;
  }
};

const resetForm = () => {
  newType.value = "MOBILE_MONEY";
  newOperator.value = "orange_money";
  newMobileNumber.value = "";
  newCardBrand.value = "visa";
  newCardNumber.value = "";
  newExpMonth.value = 1;
  newExpYear.value = 2026;
  newCvv.value = "";
  newIsDefault.value = false;
};

onMounted(() => {
  fetchPaymentMethods();
});
</script>
