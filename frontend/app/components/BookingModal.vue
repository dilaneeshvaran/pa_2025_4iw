<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="close"
      >
        <div
          class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        >
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold">Réserver un rendez-vous</h2>
            <button
              class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
              @click="close"
            >
              <IconX class="h-6 w-6" />
            </button>
          </div>

          <!-- step indicator -->
          <div class="mb-6">
            <div class="flex items-center justify-between">
              <div
                v-for="(step, index) in steps"
                :key="index"
                class="flex items-center"
              >
                <div
                  :class="[
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    currentStep > index
                      ? 'bg-green-500 text-white'
                      : currentStep === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600',
                  ]"
                >
                  <IconCheck v-if="currentStep > index" class="h-4 w-4" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span
                  v-if="index < steps.length - 1"
                  class="mx-2 hidden h-0.5 w-8 bg-gray-200 sm:block"
                  :class="{ 'bg-green-500': currentStep > index }"
                />
              </div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-gray-500">
              <span
                v-for="(step, index) in steps"
                :key="index"
                :class="{ 'font-medium text-blue-600': currentStep === index }"
              >
                {{ step }}
              </span>
            </div>
          </div>

          <!-- practitioner info -->
          <div
            v-if="practitioner"
            class="mb-6 flex items-center gap-4 rounded-lg bg-gray-50 p-4"
          >
            <div
              class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-200"
            >
              <img
                v-if="practitioner.photo"
                :src="practitioner.photo"
                :alt="`${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400"
              >
                {{ practitioner.firstName?.charAt(0)
                }}{{ practitioner.lastName?.charAt(0) }}
              </div>
            </div>
            <div>
              <h3 class="font-semibold">
                {{ practitioner.title }} {{ practitioner.firstName }}
                {{ practitioner.lastName }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ practitioner.specialties?.[0]?.name || "Généraliste" }}
              </p>
            </div>
          </div>

          <div v-if="currentStep === 0" class="space-y-4">
            <h3 class="font-medium text-gray-800">
              Sélectionnez une date et un créneau
            </h3>

            <div
              v-if="loadingSlots"
              class="flex items-center justify-center py-8"
            >
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
              />
              <span class="ml-3 text-gray-600"
                >Chargement des disponibilités...</span
              >
            </div>

            <div
              v-else-if="filteredAvailableSlots.length > 0"
              class="space-y-4"
            >
              <!-- week navigation -->
              <div
                class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <button
                  type="button"
                  :disabled="currentWeekIndex <= 0"
                  class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="currentWeekIndex--"
                >
                  <IconChevronLeft class="h-5 w-5" />
                </button>
                <span class="text-sm font-medium text-gray-700">
                  {{ weekLabel }}
                </span>
                <button
                  type="button"
                  :disabled="currentWeekIndex >= totalWeeks - 1"
                  class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="currentWeekIndex++"
                >
                  <IconChevronRight class="h-5 w-5" />
                </button>
              </div>

              <!-- days of current week -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="day in currentWeekDays"
                  :key="day.date"
                  type="button"
                  :disabled="!day.hasSlots"
                  :class="[
                    'flex flex-col items-center rounded-lg border-2 px-1 py-2 text-sm transition-all',
                    selectedDate === day.date
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : day.hasSlots
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300',
                  ]"
                  @click="day.hasSlots && selectDate(day.date)"
                >
                  <span class="text-xs uppercase">{{ day.dayShort }}</span>
                  <span class="text-lg font-bold">{{ day.dayNumber }}</span>
                  <span v-if="day.hasSlots" class="text-[10px] text-gray-500">{{
                    day.slotCount
                  }}</span>
                </button>
              </div>

              <!-- Time slots for selected date -->
              <div v-if="selectedDate && selectedDateSlots.length > 0">
                <p class="mb-3 text-sm font-medium text-gray-700">
                  Créneaux disponibles le {{ formatDateLong(selectedDate) }}
                  <span class="ml-1 text-xs text-gray-400"
                    >({{ selectedDateSlots.length }} créneaux)</span
                  >
                </p>

                <div
                  class="max-h-60 overflow-y-auto rounded-lg border border-gray-100 p-3"
                >
                  <!-- Morning slots -->
                  <div v-if="selectedDateMorningSlots.length > 0" class="mb-3">
                    <p class="mb-2 text-xs font-medium uppercase text-gray-500">
                      Matin
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="time in selectedDateMorningSlots"
                        :key="time"
                        type="button"
                        :class="[
                          'rounded-lg border-2 px-3 py-2 text-sm transition-all',
                          selectedTime === time
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300',
                        ]"
                        @click="selectTime(time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>

                  <!-- afternoon slots -->
                  <div v-if="selectedDateAfternoonSlots.length > 0">
                    <p class="mb-2 text-xs font-medium uppercase text-gray-500">
                      Après-midi
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="time in selectedDateAfternoonSlots"
                        :key="time"
                        type="button"
                        :class="[
                          'rounded-lg border-2 px-3 py-2 text-sm transition-all',
                          selectedTime === time
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300',
                        ]"
                        @click="selectTime(time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-8 text-center text-gray-500">
              <IconCalendarOff class="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>Aucune disponibilité dans les 3 prochains mois</p>
            </div>
          </div>

          <div v-if="currentStep === 1" class="space-y-4">
            <h3 class="font-medium text-gray-800">Type de consultation</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                :class="[
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all',
                  appointmentType === 'IN_PERSON'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="appointmentType = 'IN_PERSON'"
              >
                <IconMapPin class="h-8 w-8 text-blue-600" />
                <span class="font-medium">Au cabinet</span>
                <span class="text-lg font-bold text-blue-600">
                  {{ practitioner?.baseConsultationFee?.toLocaleString() }} FCFA
                </span>
                <span class="text-xs text-gray-500">{{
                  practitioner?.address
                }}</span>
              </button>
              <button
                v-if="practitioner?.teleconsultationEnabled"
                type="button"
                :class="[
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all',
                  appointmentType === 'TELECONSULTATION'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="appointmentType = 'TELECONSULTATION'"
              >
                <IconVideo class="h-8 w-8 text-green-600" />
                <span class="font-medium">Téléconsultation</span>
                <span class="text-lg font-bold text-green-600">
                  {{
                    (
                      practitioner.teleconsultationFee ||
                      practitioner.baseConsultationFee
                    )?.toLocaleString()
                  }}
                  FCFA
                </span>
                <span class="text-xs text-gray-500">Consultation vidéo</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 2" class="space-y-4">
            <h3 class="font-medium text-gray-800">Motif de consultation</h3>
            <p class="text-sm text-gray-500">
              Décrivez brièvement la raison de votre consultation (optionnel)
            </p>
            <textarea
              v-model="reason"
              rows="4"
              placeholder="Ex: Douleurs au niveau du dos depuis une semaine..."
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div v-if="currentStep === 3" class="space-y-4">
            <h3 class="font-medium text-gray-800">
              Récapitulatif de votre rendez-vous
            </h3>

            <div
              class="divide-y divide-gray-100 rounded-lg border border-gray-200"
            >
              <div class="flex justify-between p-4">
                <span class="text-gray-600">Date</span>
                <span class="font-medium">{{
                  formatDateLong(selectedDate)
                }}</span>
              </div>
              <div class="flex justify-between p-4">
                <span class="text-gray-600">Heure</span>
                <span class="font-medium">{{ selectedTime }}</span>
              </div>
              <div class="flex justify-between p-4">
                <span class="text-gray-600">Type</span>
                <span class="font-medium">
                  {{
                    appointmentType === "TELECONSULTATION"
                      ? "Téléconsultation"
                      : "Cabinet"
                  }}
                </span>
              </div>
              <div v-if="reason" class="p-4">
                <span class="text-gray-600">Motif</span>
                <p class="mt-1 text-sm">{{ reason }}</p>
              </div>
              <div class="flex justify-between bg-blue-50 p-4">
                <span class="font-medium text-gray-800">Total à payer</span>
                <span class="text-xl font-bold text-blue-600">
                  {{ consultationFee?.toLocaleString() }} FCFA
                </span>
              </div>
            </div>

            <div class="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <p>
                <strong>Important :</strong> Vous recevrez un email de
                confirmation ainsi que des rappels 24h et 1h avant votre
                rendez-vous.
              </p>
            </div>

            <!-- cancellation rule for teleconsultation -->
            <div
              v-if="appointmentType === 'TELECONSULTATION'"
              class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800"
            >
              <p class="mb-1 font-medium">Politique de remboursement :</p>
              <ul class="list-inside list-disc space-y-1 text-xs">
                <li>
                  Annulation &gt; 24h avant le RDV : remboursement intégral
                </li>
                <li>Annulation entre 12h et 24h : remboursement de 50%</li>
                <li>Annulation &lt; 12h avant le RDV : aucun remboursement</li>
              </ul>
            </div>
          </div>

          <!-- step 4 : payment (teleconsultation only) -->
          <div v-if="currentStep === 4" class="space-y-4">
            <h3 class="font-medium text-gray-800">
              Paiement de la consultation
            </h3>
            <p class="text-sm text-gray-500">
              Le paiement est requis pour confirmer votre téléconsultation.
            </p>

            <div class="rounded-lg border border-gray-200 p-4">
              <div class="mb-3 flex justify-between">
                <span class="text-gray-600">Montant à payer</span>
                <span class="text-xl font-bold text-blue-600">
                  {{ consultationFee?.toLocaleString() }} FCFA
                </span>
              </div>
            </div>

            <!-- payment method selection -->
            <div class="space-y-3">
              <label class="text-sm font-medium text-gray-700"
                >Moyen de paiement</label
              >
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="pm in paymentOptions"
                  :key="pm.value"
                  type="button"
                  class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all"
                  :class="[
                    selectedPaymentMethod === pm.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="selectedPaymentMethod = pm.value"
                >
                  <span class="text-2xl">{{ pm.icon }}</span>
                  <span class="text-sm font-medium">{{ pm.label }}</span>
                </button>
              </div>
            </div>

            <!-- mobile money operator selection -->
            <div
              v-if="selectedPaymentMethod === 'MOBILE_MONEY'"
              class="space-y-3"
            >
              <label class="text-sm font-medium text-gray-700"
                >Opérateur mobile</label
              >
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="op in mobileOperators"
                  :key="op.value"
                  type="button"
                  class="flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all"
                  :class="[
                    selectedMobileOperator === op.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="selectedMobileOperator = op.value"
                >
                  <span>{{ op.icon }}</span>
                  <span class="font-medium">{{ op.label }}</span>
                </button>
              </div>
              <div>
                <label class="text-sm text-gray-600">Numéro de téléphone</label>
                <input
                  v-model="mobilePaymentNumber"
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <!-- card payment fields -->
            <div v-if="selectedPaymentMethod === 'CARD'" class="space-y-3">
              <div>
                <label class="text-sm text-gray-600">Numéro de carte</label>
                <input
                  v-model="cardNumber"
                  type="text"
                  placeholder="4XXX XXXX XXXX XXXX"
                  maxlength="19"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm text-gray-600">Expiration</label>
                  <input
                    v-model="cardExpiry"
                    type="text"
                    placeholder="MM/AA"
                    maxlength="5"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600">CVV</label>
                  <input
                    v-model="cardCvv"
                    type="text"
                    placeholder="XXX"
                    maxlength="4"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <p>🔒 Paiement sécurisé. Vos informations sont chiffrées.</p>
            </div>
          </div>

          <div
            v-if="error"
            class="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600"
          >
            {{ error }}
          </div>

          <!-- success message -->
          <div
            v-if="success"
            class="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-600"
          >
            <p class="font-medium">
              Votre rendez-vous a été réservé avec succès !
            </p>
            <p class="mt-1">Un email de confirmation vous a été envoyé.</p>
          </div>

          <div class="mt-6 flex gap-3">
            <Button
              v-if="currentStep > 0 && !success"
              type="button"
              variant="outline"
              class="flex-1"
              @click="previousStep"
            >
              Retour
            </Button>
            <Button
              v-if="currentStep === 0"
              type="button"
              variant="outline"
              class="flex-1"
              @click="close"
            >
              Annuler
            </Button>
            <Button
              v-if="currentStep < lastStep && !success"
              type="button"
              class="flex-1"
              :disabled="!canProceed"
              @click="nextStep"
            >
              Continuer
            </Button>
            <Button
              v-if="currentStep === lastStep && !success"
              type="button"
              class="flex-1"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting">{{
                requiresPayment
                  ? "Paiement en cours..."
                  : "Réservation en cours..."
              }}</span>
              <span v-else>{{
                requiresPayment
                  ? "Payer et confirmer"
                  : "Confirmer la réservation"
              }}</span>
            </Button>
            <Button v-if="success" type="button" class="flex-1" @click="close">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, navigateTo } from "#app";
import {
  X as IconX,
  MapPin as IconMapPin,
  Video as IconVideo,
  Check as IconCheck,
  CalendarOff as IconCalendarOff,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
} from "lucide-vue-next";
import Button from "~/components/ui/Button.vue";
import { useAuthStore } from "~/stores/auth";

interface Practitioner {
  id: string;
  title?: string;
  firstName: string;
  lastName: string;
  photo?: string;
  specialties?: { name: string }[];
  baseConsultationFee: number;
  teleconsultationEnabled?: boolean;
  teleconsultationFee?: number | null;
  address?: string;
}

interface AvailableSlot {
  date: string;
  slots: string[];
}

interface Props {
  isOpen: boolean;
  practitioner: Practitioner | null;
  cabinetId?: string;
  preselectedDate?: string | null;
  preselectedTime?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close" | "success"): void;
}>();

const config = useRuntimeConfig();
const authStore = useAuthStore();

const baseSteps = ["Date & Heure", "Type", "Motif", "Récapitulatif"];
const currentStep = ref(0);
const appointmentType = ref<"IN_PERSON" | "TELECONSULTATION">("IN_PERSON");
const selectedDate = ref("");
const selectedTime = ref("");
const reason = ref("");
const submitting = ref(false);
const error = ref("");
const success = ref(false);
const loadingSlots = ref(false);
const availableSlots = ref<AvailableSlot[]>([]);

const selectedPaymentMethod = ref<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
const selectedMobileOperator = ref("orange_money");
const mobilePaymentNumber = ref("");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");

const requiresPayment = computed(
  () => appointmentType.value === "TELECONSULTATION",
);
const steps = computed(() =>
  requiresPayment.value ? [...baseSteps, "Paiement"] : baseSteps,
);
const lastStep = computed(() => steps.value.length - 1);

const paymentOptions = [
  { value: "MOBILE_MONEY" as const, label: "Mobile Money", icon: "📱" },
  { value: "CARD" as const, label: "Carte bancaire", icon: "💳" },
];

const mobileOperators = [
  { value: "orange_money", label: "Orange Money", icon: "🟠" },
  { value: "mtn_money", label: "MTN MoMo", icon: "🟡" },
  { value: "moov_money", label: "Moov Money", icon: "🔵" },
  { value: "wave", label: "Wave", icon: "🌊" },
];
const slotReserved = ref(false);
const currentWeekIndex = ref(0);

const selectedDateSlots = computed(() => {
  const slot = filteredAvailableSlots.value.find(
    (s) => s.date === selectedDate.value,
  );
  return slot?.slots || [];
});

const selectedDateMorningSlots = computed(() =>
  selectedDateSlots.value.filter(
    (s) => parseInt(s.split(":")[0] || "0", 10) < 12,
  ),
);

const selectedDateAfternoonSlots = computed(() =>
  selectedDateSlots.value.filter(
    (s) => parseInt(s.split(":")[0] || "0", 10) >= 12,
  ),
);

// Week by week navigation
const slotsGroupedByWeek = computed(() => {
  const slots = filteredAvailableSlots.value;
  if (!slots.length) return [];

  // build a map of date -> slot data
  const slotMap = new Map<string, AvailableSlot>();
  for (const s of slots) slotMap.set(s.date, s);

  // find the monday of the first available date's week
  const firstSlot = slots[0];
  if (!firstSlot) return [];
  const firstDate = new Date(firstSlot.date + "T00:00:00");
  const firstDow = firstDate.getDay(); // 0=Sun
  const mondayOffset = firstDow === 0 ? -6 : 1 - firstDow;
  const weekStart = new Date(firstDate);
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  // find the last available date
  const lastSlot = slots[slots.length - 1];
  if (!lastSlot) return [];
  const lastDate = new Date(lastSlot.date + "T00:00:00");

  const weeks: {
    startDate: Date;
    days: {
      date: string;
      dayShort: string;
      dayNumber: number;
      hasSlots: boolean;
      slotCount: number;
    }[];
  }[] = [];

  const current = new Date(weekStart);
  while (current <= lastDate) {
    const weekDays: {
      date: string;
      dayShort: string;
      dayNumber: number;
      hasSlots: boolean;
      slotCount: number;
    }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);

      // format date string in local timezone to match toLocaleDateString()
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const ds = `${year}-${month}-${day}`;

      const found = slotMap.get(ds);
      weekDays.push({
        date: ds,
        dayShort: d
          .toLocaleDateString("fr-FR", { weekday: "short" })
          .slice(0, 3),
        dayNumber: d.getDate(),
        hasSlots: !!found && found.slots.length > 0,
        slotCount: found?.slots.length || 0,
      });
    }
    weeks.push({ startDate: new Date(current), days: weekDays });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
});

const totalWeeks = computed(() => slotsGroupedByWeek.value.length);

const currentWeekDays = computed(() => {
  const week = slotsGroupedByWeek.value[currentWeekIndex.value];
  return week?.days || [];
});

const weekLabel = computed(() => {
  const week = slotsGroupedByWeek.value[currentWeekIndex.value];
  if (!week) return "";
  const days = week.days;
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return "";
  const f = new Date(first.date + "T00:00:00");
  const l = new Date(last.date + "T00:00:00");
  const fStr = f.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const lStr = l.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fStr} – ${lStr}`;
});

const navigateToDateWeek = (dateStr: string) => {
  const weeks = slotsGroupedByWeek.value;
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    if (week && week.days.some((d) => d.date === dateStr)) {
      currentWeekIndex.value = i;
      return;
    }
  }
};

const filteredAvailableSlots = computed(() => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0] || "";
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return availableSlots.value
    .filter((day) => day.date >= todayStr)
    .map((day) => {
      if (day.date === todayStr) {
        // filter out past time slots for today
        const futureSlots = day.slots.filter((slot) => {
          const parts = slot.split(":");
          const hour = parseInt(parts[0] || "0", 10);
          const minute = parseInt(parts[1] || "0", 10);
          return (
            hour > currentHour ||
            (hour === currentHour && minute > currentMinute)
          );
        });
        return { ...day, slots: futureSlots };
      }
      return day;
    })
    .filter((day) => day.slots.length > 0);
});

const consultationFee = computed(() => {
  if (!props.practitioner) return 0;
  if (
    appointmentType.value === "TELECONSULTATION" &&
    props.practitioner.teleconsultationFee
  ) {
    return props.practitioner.teleconsultationFee;
  }
  return props.practitioner.baseConsultationFee;
});

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return selectedDate.value && selectedTime.value;
  }
  if (currentStep.value === 1) {
    return appointmentType.value;
  }
  if (currentStep.value === 4 && requiresPayment.value) {
    if (selectedPaymentMethod.value === "MOBILE_MONEY") {
      return (
        selectedMobileOperator.value && mobilePaymentNumber.value.length >= 8
      );
    }
    if (selectedPaymentMethod.value === "CARD") {
      return (
        cardNumber.value.length >= 16 &&
        cardExpiry.value.length >= 4 &&
        cardCvv.value.length >= 3
      );
    }
    return false;
  }
  return true;
});

const formatDateLong = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const detectCardBrand = (number: string): string => {
  const cleaned = number.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "Amex";
  return "Carte";
};

const fetchAvailableSlots = async () => {
  if (!props.practitioner?.id) return;

  loadingSlots.value = true;
  error.value = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data: AvailableSlot[];
    }>(`/practitioners/${props.practitioner.id}/available-slots?days=90`, {
      baseURL: config.public.apiBase,
    });

    if (response.success) {
      availableSlots.value = response.data;

      // handle preselection
      if (props.preselectedDate && props.preselectedTime) {
        const preselectedSlot = filteredAvailableSlots.value.find(
          (s) => s.date === props.preselectedDate,
        );
        if (preselectedSlot?.slots.includes(props.preselectedTime)) {
          selectedDate.value = props.preselectedDate;
          selectedTime.value = props.preselectedTime;
          // navigate to the correct week
          navigateToDateWeek(props.preselectedDate);
        }
      }
    }
  } catch (err) {
    error.value = "Erreur lors du chargement des disponibilités";
    console.error("Error fetching slots:", err);
  } finally {
    loadingSlots.value = false;
  }
};

const selectDate = (date: string) => {
  selectedDate.value = date;
  selectedTime.value = "";
};

const selectTime = async (time: string) => {
  selectedTime.value = time;

  if (authStore.isAuthenticated && props.practitioner) {
    try {
      await useAuthenticatedFetch("/appointments/reserve-slot", {
        method: "POST",
        body: {
          practitionerId: props.practitioner.id,
          appointmentDate: selectedDate.value,
          startTime: time,
        },
      });
      slotReserved.value = true;
    } catch (err) {
      console.warn("Could not reserve slot:", err);
    }
  }
};

const nextStep = () => {
  if (currentStep.value === 0 && !authStore.isAuthenticated) {
    const route = useRoute();
    const returnUrl = route.fullPath;
    navigateTo(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
    return;
  }
  currentStep.value++;
};

const previousStep = () => {
  currentStep.value--;
};

const close = () => {
  // release slot reservation if any
  if (
    slotReserved.value &&
    props.practitioner &&
    selectedDate.value &&
    selectedTime.value
  ) {
    useAuthenticatedFetch("/appointments/reserve-slot", {
      method: "DELETE",
      body: {
        practitionerId: props.practitioner.id,
        appointmentDate: selectedDate.value,
        startTime: selectedTime.value,
      },
    }).catch(() => {});
  }

  // reset state
  currentStep.value = 0;
  appointmentType.value = "IN_PERSON";
  selectedDate.value = "";
  selectedTime.value = "";
  reason.value = "";
  error.value = "";
  success.value = false;
  slotReserved.value = false;
  currentWeekIndex.value = 0;
  selectedPaymentMethod.value = "MOBILE_MONEY";
  selectedMobileOperator.value = "orange_money";
  mobilePaymentNumber.value = "";
  cardNumber.value = "";
  cardExpiry.value = "";
  cardCvv.value = "";

  emit("close");
};

const handleSubmit = async () => {
  if (!authStore.isAuthenticated) {
    const route = useRoute();
    const returnUrl = route.fullPath;
    navigateTo(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
    return;
  }

  if (!selectedDate.value || !selectedTime.value || !props.practitioner) {
    error.value = "Veuillez sélectionner une date et une heure.";
    return;
  }

  submitting.value = true;
  error.value = "";
  success.value = false;

  try {
    // create  appointment
    const aptResponse = await useAuthenticatedFetch<{
      success: boolean;
      data: { id: string };
    }>("/appointments", {
      method: "POST",
      body: {
        practitionerId: props.practitioner.id,
        cabinetId: props.cabinetId,
        appointmentDate: selectedDate.value,
        startTime: selectedTime.value,
        type: appointmentType.value,
        reason: reason.value || undefined,
      },
    });

    // if teleconsultation, process payment
    if (requiresPayment.value && aptResponse.data?.id) {
      try {
        await useAuthenticatedFetch("/payments", {
          method: "POST",
          body: {
            appointmentId: aptResponse.data.id,
            method: selectedPaymentMethod.value,
            mobileOperator:
              selectedPaymentMethod.value === "MOBILE_MONEY"
                ? selectedMobileOperator.value
                : undefined,
            mobileNumber:
              selectedPaymentMethod.value === "MOBILE_MONEY"
                ? mobilePaymentNumber.value
                : undefined,
            cardLast4:
              selectedPaymentMethod.value === "CARD"
                ? cardNumber.value.slice(-4)
                : undefined,
            cardBrand:
              selectedPaymentMethod.value === "CARD"
                ? detectCardBrand(cardNumber.value)
                : undefined,
          },
        });
      } catch (payErr: unknown) {
        const payError = payErr as { data?: { message?: string } };
        error.value =
          payError.data?.message ||
          "Le paiement a échoué. Votre rendez-vous a été créé sans paiement.";
        // dont block bcoz appointment is created and payment can be retried
      }
    }

    success.value = true;
    slotReserved.value = false;
    emit("success");

    // close modal after 3 seconds
    setTimeout(() => {
      close();
    }, 3000);
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    error.value =
      fetchError.data?.message ||
      "Une erreur est survenue lors de la réservation.";
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchAvailableSlots();
    }
  },
);

watch(
  () => props.preselectedDate,
  (date) => {
    if (date) {
      selectedDate.value = date;
    }
  },
);

watch(
  () => props.preselectedTime,
  (time) => {
    if (time) {
      selectedTime.value = time;
    }
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
