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
              ></div>
              <span class="ml-3 text-gray-600"
                >Chargement des disponibilités...</span
              >
            </div>

            <div
              v-else-if="filteredAvailableSlots.length > 0"
              class="space-y-4"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="slot in filteredAvailableSlots"
                  :key="slot.date"
                  type="button"
                  :class="[
                    'rounded-lg border-2 px-4 py-2 text-sm transition-all',
                    selectedDate === slot.date
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="selectDate(slot.date)"
                >
                  <div class="font-medium">
                    {{ formatDateShort(slot.date) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ slot.slots.length }} créneaux
                  </div>
                </button>
              </div>

              <div v-if="selectedDate && selectedDateSlots.length > 0">
                <p class="mb-2 text-sm font-medium text-gray-700">
                  Créneaux disponibles le {{ formatDateLong(selectedDate) }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="time in selectedDateSlots"
                    :key="time"
                    type="button"
                    :class="[
                      'rounded-lg border-2 px-4 py-2 text-sm transition-all',
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

            <div v-else class="py-8 text-center text-gray-500">
              <IconCalendarOff class="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>Aucune disponibilité dans les 14 prochains jours</p>
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
            ></textarea>
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
              v-if="currentStep < 3 && !success"
              type="button"
              class="flex-1"
              :disabled="!canProceed"
              @click="nextStep"
            >
              Continuer
            </Button>
            <Button
              v-if="currentStep === 3 && !success"
              type="button"
              class="flex-1"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting">Réservation en cours...</span>
              <span v-else>Confirmer la réservation</span>
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
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, navigateTo } from "#app";
import {
  X as IconX,
  MapPin as IconMapPin,
  Video as IconVideo,
  Check as IconCheck,
  CalendarOff as IconCalendarOff,
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
  preselectedDate?: string | null;
  preselectedTime?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close" | "success"): void;
}>();

const config = useRuntimeConfig();
const authStore = useAuthStore();

const steps = ["Date & Heure", "Type", "Motif", "Récapitulatif"];
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
const slotReserved = ref(false);

const selectedDateSlots = computed(() => {
  const slot = filteredAvailableSlots.value.find(
    (s) => s.date === selectedDate.value,
  );
  return slot?.slots || [];
});

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
  return true;
});

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatDateLong = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fetchAvailableSlots = async () => {
  if (!props.practitioner?.id) return;

  loadingSlots.value = true;
  error.value = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data: AvailableSlot[];
    }>(`/practitioners/${props.practitioner.id}/available-slots?days=14`, {
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
    await useAuthenticatedFetch("/appointments", {
      method: "POST",
      body: {
        practitionerId: props.practitioner.id,
        appointmentDate: selectedDate.value,
        startTime: selectedTime.value,
        type: appointmentType.value,
        reason: reason.value || undefined,
      },
    });

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
