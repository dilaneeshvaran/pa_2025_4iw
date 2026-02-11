<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">
        Factures & Paiements
      </h1>
      <p class="text-gray-600">Gérez vos factures et moyens de paiement</p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'border-b-2 pb-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="mr-2 inline-block h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- invoice History -->
    <div v-if="activeTab === 'invoices'">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <select
          v-model="statusFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="COMPLETED">Payé</option>
          <option value="PENDING">En attente</option>
          <option value="REFUNDED">Remboursé</option>
          <option value="FAILED">Échoué</option>
        </select>
      </div>

      <!-- loading -->
      <div v-if="loadingPayments" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-lg border bg-white p-4"
        >
          <div class="flex items-center justify-between">
            <div class="space-y-2">
              <div class="h-4 w-48 rounded bg-gray-200"></div>
              <div class="h-3 w-32 rounded bg-gray-200"></div>
            </div>
            <div class="h-8 w-24 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      <!-- empty state -->
      <div
        v-else-if="payments.length === 0"
        class="rounded-lg border bg-white py-12 text-center"
      >
        <Receipt class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucune facture pour le moment</p>
        <p class="mt-1 text-sm text-gray-400">
          Vos factures apparaîtront ici après un paiement
        </p>
      </div>

      <!-- payment/invoice list -->
      <div v-else class="space-y-3">
        <div
          v-for="payment in payments"
          :key="payment.id"
          class="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">
                  {{ payment.appointment.practitioner.title }}
                  {{ payment.appointment.practitioner.firstName }}
                  {{ payment.appointment.practitioner.lastName }}
                </span>
                <UiBadge :variant="getPaymentStatusVariant(payment.status)">
                  {{ getPaymentStatusLabel(payment.status) }}
                </UiBadge>
              </div>
              <div
                class="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500"
              >
                <span class="flex items-center gap-1">
                  <Calendar class="h-3.5 w-3.5" />
                  {{ formatDate(payment.appointment.appointmentDate) }}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="h-3.5 w-3.5" />
                  {{ payment.appointment.startTime }}
                </span>
                <span class="flex items-center gap-1">
                  <component
                    :is="
                      payment.appointment.type === 'TELECONSULTATION'
                        ? Video
                        : MapPin
                    "
                    class="h-3.5 w-3.5"
                  />
                  {{
                    payment.appointment.type === "TELECONSULTATION"
                      ? "Téléconsultation"
                      : "Cabinet"
                  }}
                </span>
              </div>
              <div class="mt-1 text-xs text-gray-400">
                <span>{{ getPaymentMethodLabel(payment.method) }}</span>
                <span class="mx-1">·</span>
                <span>N° {{ payment.invoiceNumber }}</span>
              </div>
              <div
                v-if="payment.refundedAmount"
                class="mt-1 text-xs text-orange-600"
              >
                Remboursé : {{ payment.refundedAmount.toLocaleString() }} FCFA
                <span v-if="payment.refundReason"
                  >— {{ payment.refundReason }}</span
                >
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="text-lg font-bold text-gray-900">
                {{ payment.amount.toLocaleString() }}
                <span class="text-sm font-normal text-gray-500">FCFA</span>
              </span>
              <div class="flex gap-2">
                <button
                  v-if="payment.invoice"
                  class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                  @click="
                    downloadInvoice(payment.invoice!.id, payment.invoiceNumber)
                  "
                >
                  <Download class="h-3.5 w-3.5" />
                  PDF
                </button>
                <button
                  v-if="canRefund(payment)"
                  class="flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-xs text-orange-600 transition-colors hover:bg-orange-50"
                  @click="openRefundModal(payment)"
                >
                  <RotateCcw class="h-3.5 w-3.5" />
                  Rembourser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">
          Page {{ currentPage }} sur {{ totalPages }} ({{ totalPayments }}
          résultats)
        </p>
        <div class="flex gap-2">
          <UiButton
            size="sm"
            variant="outline"
            :disabled="currentPage <= 1"
            @click="
              currentPage--;
              fetchPayments();
            "
          >
            Précédent
          </UiButton>
          <UiButton
            size="sm"
            variant="outline"
            :disabled="currentPage >= totalPages"
            @click="
              currentPage++;
              fetchPayments();
            "
          >
            Suivant
          </UiButton>
        </div>
      </div>
    </div>

    <!-- saved Payment Methods -->
    <div v-if="activeTab === 'methods'">
      <div class="mb-4 flex justify-end">
        <UiButton size="sm" @click="showAddMethodModal = true">
          <Plus class="mr-1 h-4 w-4" />
          Ajouter un moyen de paiement
        </UiButton>
      </div>

      <div v-if="loadingMethods" class="space-y-3">
        <div
          v-for="i in 2"
          :key="i"
          class="animate-pulse rounded-lg border bg-white p-4"
        >
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 rounded-full bg-gray-200"></div>
            <div class="space-y-2">
              <div class="h-4 w-36 rounded bg-gray-200"></div>
              <div class="h-3 w-24 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- empty state -->
      <div
        v-else-if="paymentMethods.length === 0"
        class="rounded-lg border bg-white py-12 text-center"
      >
        <Wallet class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">Aucun moyen de paiement enregistré</p>
        <p class="mt-1 text-sm text-gray-400">
          Ajoutez Orange Money, MTN, Wave ou une carte bancaire
        </p>
        <UiButton size="sm" class="mt-4" @click="showAddMethodModal = true">
          Ajouter un moyen de paiement
        </UiButton>
      </div>

      <!-- payment methods list -->
      <div v-else class="space-y-3">
        <div
          v-for="method in paymentMethods"
          :key="method.id"
          class="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                :class="[
                  'flex h-12 w-12 items-center justify-center rounded-full text-xl',
                  method.type === 'MOBILE_MONEY'
                    ? 'bg-orange-100'
                    : 'bg-blue-100',
                ]"
              >
                {{ getMethodIcon(method) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{
                    method.label
                  }}</span>
                  <UiBadge v-if="method.isDefault" variant="primary">
                    Par défaut
                  </UiBadge>
                  <UiBadge v-if="!method.isVerified" variant="warning">
                    Non vérifié
                  </UiBadge>
                  <UiBadge v-else variant="success"> Vérifié </UiBadge>
                </div>
                <p class="text-sm text-gray-500">
                  <span v-if="method.type === 'MOBILE_MONEY'">
                    {{ getOperatorLabel(method.mobileOperator) }}
                    <span v-if="method.mobileNumber">
                      · {{ method.mobileNumber }}</span
                    >
                  </span>
                  <span v-else>
                    {{ method.cardBrand }} •••• {{ method.cardLast4 }}
                    <span v-if="method.cardExpMonth && method.cardExpYear">
                      · Exp.
                      {{ String(method.cardExpMonth).padStart(2, "0") }}/{{
                        method.cardExpYear
                      }}
                    </span>
                  </span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="!method.isVerified"
                class="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                @click="openVerifyModal(method)"
              >
                Vérifier
              </button>
              <button
                v-if="!method.isDefault"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                @click="setDefault(method.id)"
              >
                Par défaut
              </button>
              <button
                class="rounded-lg border border-red-200 p-1.5 text-red-500 transition-colors hover:bg-red-50"
                @click="openDeleteMethodModal(method)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- modals -->

    <Teleport to="body">
      <div
        v-if="showAddMethodModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showAddMethodModal = false"
      >
        <div class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Ajouter un moyen de paiement
            </h3>
            <button
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              @click="showAddMethodModal = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- payment type selection -->
          <div class="mb-4 space-y-3">
            <label class="text-sm font-medium text-gray-700">Type</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all"
                :class="[
                  newMethodType === 'MOBILE_MONEY'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="newMethodType = 'MOBILE_MONEY'"
              >
                <span class="text-2xl">📱</span>
                <span class="text-sm font-medium">Mobile Money</span>
              </button>
              <button
                type="button"
                class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all"
                :class="[
                  newMethodType === 'CARD'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="newMethodType = 'CARD'"
              >
                <span class="text-2xl">💳</span>
                <span class="text-sm font-medium">Carte bancaire</span>
              </button>
            </div>
          </div>

          <!-- mobile money form -->
          <div v-if="newMethodType === 'MOBILE_MONEY'" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Opérateur</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  v-for="op in mobileOperatorOptions"
                  :key="op.value"
                  type="button"
                  class="flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all"
                  :class="[
                    newMobileOperator === op.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="newMobileOperator = op.value"
                >
                  <span>{{ op.icon }}</span>
                  <span class="font-medium">{{ op.label }}</span>
                </button>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700"
                >Numéro de téléphone</label
              >
              <input
                v-model="newMobileNumber"
                type="tel"
                placeholder="07 XX XX XX XX"
                class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <!-- card form -->
          <div v-if="newMethodType === 'CARD'" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700"
                >Numéro de carte</label
              >
              <input
                v-model="newCardNumber"
                type="text"
                placeholder="4XXX XXXX XXXX XXXX"
                maxlength="19"
                class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-sm font-medium text-gray-700">Mois</label>
                <select
                  v-model="newCardExpMonth"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-600 focus:outline-none"
                >
                  <option v-for="m in 12" :key="m" :value="m">
                    {{ String(m).padStart(2, "0") }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Année</label>
                <select
                  v-model="newCardExpYear"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-600 focus:outline-none"
                >
                  <option v-for="y in 10" :key="y" :value="2025 + y">
                    {{ 2025 + y }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">CVV</label>
                <input
                  v-model="newCardCvv"
                  type="text"
                  placeholder="XXX"
                  maxlength="4"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- set as default checkbox -->
          <div class="mt-4">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="newMethodIsDefault"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Définir comme moyen de paiement par défaut
            </label>
          </div>

          <div
            v-if="addMethodError"
            class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {{ addMethodError }}
          </div>

          <div class="mt-6 flex gap-3">
            <UiButton
              variant="outline"
              class="flex-1"
              @click="showAddMethodModal = false"
            >
              Annuler
            </UiButton>
            <UiButton
              class="flex-1"
              :disabled="!canAddMethod || addingMethod"
              @click="addMethod"
            >
              {{ addingMethod ? "Ajout en cours..." : "Ajouter" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- verify payment method modal -->
    <Teleport to="body">
      <div
        v-if="showVerifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showVerifyModal = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            Vérifier le moyen de paiement
          </h3>
          <p class="mb-4 text-sm text-gray-600">
            Entrez le code de vérification envoyé à votre numéro
            <strong>{{ verifyingMethod?.label }}</strong
            >.
          </p>
          <input
            v-model="verificationCode"
            type="text"
            placeholder="Code à 4-6 chiffres"
            maxlength="8"
            class="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div
            v-if="verifyError"
            class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {{ verifyError }}
          </div>
          <div class="flex gap-3">
            <UiButton
              variant="outline"
              class="flex-1"
              @click="showVerifyModal = false"
            >
              Annuler
            </UiButton>
            <UiButton
              class="flex-1"
              :disabled="verificationCode.length < 4 || verifying"
              @click="verifyMethod"
            >
              {{ verifying ? "Vérification..." : "Vérifier" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- delete method confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteMethodModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteMethodModal = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Confirmer la suppression
            </h3>
          </div>
          <p class="mb-4 text-sm text-gray-600">
            Voulez-vous supprimer <strong>{{ deletingMethod?.label }}</strong> ?
            Cette action est irréversible.
          </p>
          <div class="flex gap-3">
            <UiButton
              variant="outline"
              class="flex-1"
              @click="showDeleteMethodModal = false"
            >
              Annuler
            </UiButton>
            <UiButton
              variant="danger"
              class="flex-1"
              :disabled="deletingMethodLoading"
              @click="confirmDeleteMethod"
            >
              {{ deletingMethodLoading ? "Suppression..." : "Supprimer" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- refund modal -->
    <Teleport to="body">
      <div
        v-if="showRefundModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showRefundModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <RotateCcw class="h-5 w-5 text-orange-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Demander un remboursement
            </h3>
          </div>

          <div class="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <p class="mb-2 font-medium">Politique de remboursement :</p>
            <ul class="list-inside list-disc space-y-1 text-xs">
              <li>
                Annulation &gt; 24h avant le RDV : remboursement intégral ({{
                  refundingPayment?.amount.toLocaleString()
                }}
                FCFA)
              </li>
              <li>
                Annulation entre 12h et 24h : remboursement de 50% ({{
                  Math.round(
                    (refundingPayment?.amount || 0) * 0.5,
                  ).toLocaleString()
                }}
                FCFA)
              </li>
              <li>Annulation &lt; 12h avant le RDV : aucun remboursement</li>
            </ul>
          </div>

          <div class="mb-4">
            <label class="text-sm font-medium text-gray-700"
              >Raison (optionnel)</label
            >
            <textarea
              v-model="refundReason"
              rows="2"
              placeholder="Décrivez la raison du remboursement..."
              class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            ></textarea>
          </div>

          <div
            v-if="refundError"
            class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {{ refundError }}
          </div>
          <div
            v-if="refundSuccess"
            class="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700"
          >
            {{ refundSuccess }}
          </div>

          <div class="flex gap-3">
            <UiButton
              variant="outline"
              class="flex-1"
              @click="showRefundModal = false"
            >
              Annuler
            </UiButton>
            <UiButton
              variant="danger"
              class="flex-1"
              :disabled="refunding || !!refundSuccess"
              @click="confirmRefund"
            >
              {{ refunding ? "Traitement..." : "Confirmer le remboursement" }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  Clock,
  CreditCard,
  Download,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  Trash2,
  Video,
  Wallet,
  X,
  AlertTriangle,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

const authStore = useAuthStore();

interface ApiError {
  data?: {
    message?: string;
  };
}

interface PaymentPractitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string | null;
}

interface PaymentAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  practitioner: PaymentPractitioner;
}

interface PaymentInvoice {
  id: string;
  invoiceNumber: string;
  pdfPath: string | null;
}

interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  invoiceNumber: string;
  paidAt: string | null;
  refundedAmount: number | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
  appointment: PaymentAppointment;
  invoice: PaymentInvoice | null;
}

interface SavedPaymentMethod {
  id: string;
  type: string;
  label: string;
  isDefault: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  mobileOperator: string | null;
  mobileNumber: string | null;
  isVerified: boolean;
  createdAt: string;
}

const activeTab = ref<"invoices" | "methods">("invoices");

const tabs = [
  { key: "invoices" as const, label: "Historique des factures", icon: Receipt },
  { key: "methods" as const, label: "Moyens de paiement", icon: CreditCard },
];

const payments = ref<Payment[]>([]);
const loadingPayments = ref(true);
const statusFilter = ref("all");
const currentPage = ref(1);
const totalPages = ref(1);
const totalPayments = ref(0);

const paymentMethods = ref<SavedPaymentMethod[]>([]);
const loadingMethods = ref(true);

const showAddMethodModal = ref(false);
const newMethodType = ref<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
const newMobileOperator = ref("orange_money");
const newMobileNumber = ref("");
const newCardNumber = ref("");
const newCardExpMonth = ref(1);
const newCardExpYear = ref(2026);
const newCardCvv = ref("");
const newMethodIsDefault = ref(false);
const addingMethod = ref(false);
const addMethodError = ref("");

const showVerifyModal = ref(false);
const verifyingMethod = ref<SavedPaymentMethod | null>(null);
const verificationCode = ref("");
const verifying = ref(false);
const verifyError = ref("");

const showDeleteMethodModal = ref(false);
const deletingMethod = ref<SavedPaymentMethod | null>(null);
const deletingMethodLoading = ref(false);

const showRefundModal = ref(false);
const refundingPayment = ref<Payment | null>(null);
const refundReason = ref("");
const refunding = ref(false);
const refundError = ref("");
const refundSuccess = ref("");

// mobile operators
const mobileOperatorOptions = [
  { value: "orange_money", label: "Orange Money", icon: "🟠" },
  { value: "mtn_money", label: "MTN MoMo", icon: "🟡" },
  { value: "moov_money", label: "Moov Money", icon: "🔵" },
  { value: "wave", label: "Wave", icon: "🌊" },
];

const canAddMethod = computed(() => {
  if (newMethodType.value === "MOBILE_MONEY") {
    return newMobileOperator.value && newMobileNumber.value.length >= 8;
  }
  if (newMethodType.value === "CARD") {
    return (
      newCardNumber.value.length >= 16 &&
      newCardExpMonth.value >= 1 &&
      newCardExpYear.value >= 2025 &&
      newCardCvv.value.length >= 3
    );
  }
  return false;
});

const fetchPayments = async () => {
  loadingPayments.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Payment[];
      total: number;
      page: number;
      totalPages: number;
    }>(
      `/payments?page=${currentPage.value}&limit=10&status=${statusFilter.value}`,
    );

    if (response.success) {
      payments.value = response.data;
      totalPages.value = response.totalPages;
      totalPayments.value = response.total;
    }
  } catch (error) {
    console.error("Error fetching payments:", error);
  } finally {
    loadingPayments.value = false;
  }
};

const fetchPaymentMethods = async () => {
  loadingMethods.value = true;
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
    loadingMethods.value = false;
  }
};

const downloadInvoice = async (invoiceId: string, _invoiceNumber: string) => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch<Blob>(
      `/payments/invoices/${invoiceId}/download`,
      {
        baseURL: config.public.apiBase,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        responseType: "blob",
      },
    );

    // open in new window for printing/saving as pdf
    const blob = new Blob([response], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (error) {
    console.error("Error downloading invoice:", error);
    alert("Erreur lors du téléchargement de la facture");
  }
};

const addMethod = async () => {
  addingMethod.value = true;
  addMethodError.value = "";

  try {
    const body: Record<string, string | number | boolean> = {
      type: newMethodType.value,
      isDefault: newMethodIsDefault.value,
    };

    if (newMethodType.value === "MOBILE_MONEY") {
      body.mobileOperator = newMobileOperator.value;
      body.mobileNumber = newMobileNumber.value;
    } else {
      body.cardLast4 = newCardNumber.value.replace(/\s/g, "").slice(-4);
      body.cardBrand = detectCardBrand(newCardNumber.value);
      body.cardExpMonth = newCardExpMonth.value;
      body.cardExpYear = newCardExpYear.value;
    }

    await useAuthenticatedFetch("/payments/methods", {
      method: "POST",
      body,
    });

    showAddMethodModal.value = false;
    resetAddMethodForm();
    await fetchPaymentMethods();
  } catch (error: unknown) {
    addMethodError.value =
      (error as ApiError)?.data?.message ||
      "Erreur lors de l'ajout du moyen de paiement";
  } finally {
    addingMethod.value = false;
  }
};

const openVerifyModal = (method: SavedPaymentMethod) => {
  verifyingMethod.value = method;
  verificationCode.value = "";
  verifyError.value = "";
  showVerifyModal.value = true;
};

const verifyMethod = async () => {
  if (!verifyingMethod.value) return;
  verifying.value = true;
  verifyError.value = "";

  try {
    await useAuthenticatedFetch(
      `/payments/methods/${verifyingMethod.value.id}/verify`,
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

const openDeleteMethodModal = (method: SavedPaymentMethod) => {
  deletingMethod.value = method;
  showDeleteMethodModal.value = true;
};

const confirmDeleteMethod = async () => {
  if (!deletingMethod.value) return;
  deletingMethodLoading.value = true;

  try {
    await useAuthenticatedFetch(
      `/payments/methods/${deletingMethod.value.id}`,
      { method: "DELETE" },
    );
    showDeleteMethodModal.value = false;
    await fetchPaymentMethods();
  } catch (error: unknown) {
    alert(
      (error as ApiError)?.data?.message || "Erreur lors de la suppression",
    );
  } finally {
    deletingMethodLoading.value = false;
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

const canRefund = (payment: Payment): boolean => {
  if (payment.status !== "COMPLETED") return false;
  if (payment.refundedAt) return false;
  // check appointment is in the future
  const aptDate = new Date(payment.appointment.appointmentDate);
  return aptDate > new Date();
};

const openRefundModal = (payment: Payment) => {
  refundingPayment.value = payment;
  refundReason.value = "";
  refundError.value = "";
  refundSuccess.value = "";
  showRefundModal.value = true;
};

const confirmRefund = async () => {
  if (!refundingPayment.value) return;
  refunding.value = true;
  refundError.value = "";

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { refundedAmount: number; message: string };
    }>(`/payments/${refundingPayment.value.id}/refund`, {
      method: "POST",
      body: { reason: refundReason.value || undefined },
    });

    if (response.success) {
      refundSuccess.value = response.data.message;
      await fetchPayments();
    }
  } catch (error: unknown) {
    refundError.value =
      (error as ApiError)?.data?.message || "Erreur lors du remboursement";
  } finally {
    refunding.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getPaymentStatusVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" => {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "PENDING":
      return "warning";
    case "REFUNDED":
      return "warning";
    case "FAILED":
      return "danger";
    case "CANCELLED":
      return "danger";
    default:
      return "default";
  }
};

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Payé";
    case "PENDING":
      return "En attente";
    case "REFUNDED":
      return "Remboursé";
    case "FAILED":
      return "Échoué";
    case "CANCELLED":
      return "Annulé";
    default:
      return status;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "CARD":
      return "Carte bancaire";
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "CASH":
      return "Espèces";
    case "PAYPAL":
      return "PayPal";
    default:
      return method;
  }
};

const getMethodIcon = (method: SavedPaymentMethod) => {
  if (method.type === "MOBILE_MONEY") {
    switch (method.mobileOperator) {
      case "orange_money":
        return "🟠";
      case "mtn_money":
        return "🟡";
      case "moov_money":
        return "🔵";
      case "wave":
        return "🌊";
      default:
        return "📱";
    }
  }
  return "💳";
};

const getOperatorLabel = (operator: string | null) => {
  switch (operator) {
    case "orange_money":
      return "Orange Money";
    case "mtn_money":
      return "MTN Mobile Money";
    case "moov_money":
      return "Moov Money";
    case "wave":
      return "Wave";
    default:
      return operator || "";
  }
};

const detectCardBrand = (number: string): string => {
  const cleaned = number.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "Amex";
  return "Carte";
};

const resetAddMethodForm = () => {
  newMethodType.value = "MOBILE_MONEY";
  newMobileOperator.value = "orange_money";
  newMobileNumber.value = "";
  newCardNumber.value = "";
  newCardExpMonth.value = 1;
  newCardExpYear.value = 2026;
  newCardCvv.value = "";
  newMethodIsDefault.value = false;
  addMethodError.value = "";
};

watch(statusFilter, () => {
  currentPage.value = 1;
  fetchPayments();
});

watch(activeTab, (tab) => {
  if (tab === "invoices" && payments.value.length === 0) {
    fetchPayments();
  }
  if (tab === "methods" && paymentMethods.value.length === 0) {
    fetchPaymentMethods();
  }
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (authStore.accessToken) {
    fetchPayments();
    fetchPaymentMethods();
  } else {
    loadingPayments.value = false;
    loadingMethods.value = false;
  }
});
</script>
