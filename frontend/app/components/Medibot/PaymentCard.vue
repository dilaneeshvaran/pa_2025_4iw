<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-3">
    <div class="flex items-center gap-2">
      <div class="h-7 w-7 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 grid place-items-center">
        <Lock class="h-3.5 w-3.5" />
      </div>
      <div>
        <p class="text-xs font-display font-bold text-gray-900 dark:text-gray-100">Paiement sécurisé</p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400">Total : {{ formatFcfa(amount) }}</p>
      </div>
    </div>

    <!-- saved methods -->
    <div v-if="savedMethods.length" class="space-y-1.5">
      <button
        v-for="m in savedMethods"
        :key="m.id"
        type="button"
        class="w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition"
        :class="savedMethodId === m.id ? 'border-green-600 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700'"
        @click="selectSaved(m.id)"
      >
        <CreditCard class="h-4 w-4 text-gray-500" />
        <span class="text-xs font-semibold text-gray-800 dark:text-gray-100">{{ m.label }}</span>
      </button>
    </div>

    <!-- method tabs -->
    <div v-if="!savedMethodId" class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="rounded-lg border py-1.5 text-xs font-semibold transition"
        :class="method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'"
        @click="method = 'MOBILE_MONEY'"
      >
        Mobile Money
      </button>
      <button
        type="button"
        class="rounded-lg border py-1.5 text-xs font-semibold transition"
        :class="method === 'CARD' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'"
        @click="method = 'CARD'"
      >
        Carte bancaire
      </button>
    </div>

    <!-- mobile money -->
    <div v-if="!savedMethodId && method === 'MOBILE_MONEY'" class="space-y-2">
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="op in operators"
          :key="op.value"
          type="button"
          class="rounded-lg border py-2 text-[10px] font-bold transition"
          :class="operator === op.value ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'"
          @click="operator = op.value"
        >
          {{ op.label }}
        </button>
      </div>
      <input
        v-model="mobileNumber"
        type="tel"
        inputmode="tel"
        placeholder="Numéro mobile money"
        class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40"
      />
    </div>

    <!-- card -->
    <div v-if="!savedMethodId && method === 'CARD'" class="space-y-2">
      <input
        v-model="cardNumber"
        type="text"
        inputmode="numeric"
        autocomplete="cc-number"
        placeholder="Numéro de carte"
        class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        @input="onCardInput"
      />
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="cardExpiry"
          type="text"
          autocomplete="cc-exp"
          placeholder="MM/AA"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
        <input
          v-model="cardCvv"
          type="text"
          inputmode="numeric"
          autocomplete="cc-csc"
          placeholder="CVV"
          maxlength="4"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>
    </div>

    <p v-if="errorMessage" class="text-[11px] text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <button
      type="button"
      :disabled="loading || !canPay"
      class="w-full rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition active:scale-[0.98] flex items-center justify-center gap-2"
      @click="pay"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <Lock v-else class="h-3.5 w-3.5" />
      Payer {{ formatFcfa(amount) }}
    </button>

    <button type="button" class="w-full text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="$emit('skip')">
      Payer plus tard
    </button>

    <p class="flex items-center justify-center gap-1 text-[10px] text-gray-400">
      <ShieldCheck class="h-3 w-3" /> Medibot ne voit jamais vos coordonnées bancaires
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Lock, CreditCard, Loader2, ShieldCheck } from "lucide-vue-next";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

const props = defineProps<{ appointmentId: string; amount: number }>();
const emit = defineEmits<{ paid: []; skip: [] }>();

const operators = [
  { value: "orange_money", label: "Orange" },
  { value: "mtn_money", label: "MTN" },
  { value: "moov_money", label: "Moov" },
  { value: "wave", label: "Wave" },
];

const method = ref<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
const operator = ref("orange_money");
const mobileNumber = ref("");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const cardBrand = ref("unknown");
const savedMethods = ref<Array<{ id: string; label: string }>>([]);
const savedMethodId = ref<string | null>(null);
const loading = ref(false);
const errorMessage = ref("");

function formatFcfa(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`;
}

const canPay = computed(() => {
  if (savedMethodId.value) return true;
  if (method.value === "MOBILE_MONEY") return mobileNumber.value.replace(/\D/g, "").length >= 8;
  return cardNumber.value.replace(/\D/g, "").length >= 12 && cardExpiry.value.length >= 4 && cardCvv.value.length >= 3;
});

function detectBrand(num: string): string {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
}
function onCardInput() {
  cardBrand.value = detectBrand(cardNumber.value);
}
function selectSaved(id: string) {
  savedMethodId.value = savedMethodId.value === id ? null : id;
}

onMounted(async () => {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: Array<{ id: string; label: string; isVerified: boolean }>;
    }>("/payments/methods");
    savedMethods.value = (res.data || [])
      .filter((m) => m.isVerified)
      .map((m) => ({ id: m.id, label: m.label }));
  } catch {
    /* no saved methods */
  }
});

async function pay() {
  if (!canPay.value) return;
  loading.value = true;
  errorMessage.value = "";

  const body: Record<string, unknown> = { appointmentId: props.appointmentId };
  if (savedMethodId.value) {
    body.method = "CARD";
    body.savedPaymentMethodId = savedMethodId.value;
  } else if (method.value === "MOBILE_MONEY") {
    body.method = "MOBILE_MONEY";
    body.mobileOperator = operator.value;
    body.mobileNumber = mobileNumber.value.replace(/\s/g, "");
  } else {
    body.method = "CARD";
    body.cardLast4 = cardNumber.value.replace(/\D/g, "").slice(-4);
    body.cardBrand = cardBrand.value;
  }

  try {
    await useAuthenticatedFetch("/payments", { method: "POST", body });
    emit("paid");
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } };
    errorMessage.value = e.data?.message || "Le paiement a échoué. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
}
</script>
