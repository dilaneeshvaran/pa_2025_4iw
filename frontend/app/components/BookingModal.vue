<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="close"
      >
        <div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold">Réserver un rendez-vous</h2>
            <button
              class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
              @click="close"
            >
              <IconX class="h-6 w-6" />
            </button>
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

          <!-- booking form -->
          <form @submit.prevent="handleSubmit">
            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Type de consultation
              </label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  :class="[
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    appointmentType === 'IN_PERSON'
                      ? 'border-[var(--color-primary)] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="appointmentType = 'IN_PERSON'"
                >
                  <IconMapPin class="h-6 w-6" />
                  <span class="font-medium">Au cabinet</span>
                  <span class="text-sm text-gray-600">
                    {{ practitioner?.baseConsultationFee.toLocaleString() }}
                    FCFA
                  </span>
                </button>
                <button
                  v-if="practitioner?.teleconsultationEnabled"
                  type="button"
                  :class="[
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    appointmentType === 'TELECONSULTATION'
                      ? 'border-[var(--color-primary)] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  @click="appointmentType = 'TELECONSULTATION'"
                >
                  <IconVideo class="h-6 w-6" />
                  <span class="font-medium">Téléconsultation</span>
                  <span class="text-sm text-gray-600">
                    {{
                      (
                        practitioner.teleconsultationFee ||
                        practitioner.baseConsultationFee
                      ).toLocaleString()
                    }}
                    FCFA
                  </span>
                </button>
              </div>
            </div>

            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Date du rendez-vous
              </label>
              <input
                v-model="selectedDate"
                type="date"
                :min="minDate"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Heure du rendez-vous
              </label>
              <input
                v-model="selectedTime"
                type="time"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Motif de consultation (optionnel)
              </label>
              <textarea
                v-model="reason"
                rows="3"
                placeholder="Décrivez brièvement le motif de votre consultation..."
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <Button
                type="button"
                variant="outline"
                class="flex-1"
                @click="close"
              >
                Annuler
              </Button>
              <Button type="submit" class="flex-1" :disabled="submitting">
                <span v-if="submitting">Réservation en cours...</span>
                <span v-else>Confirmer la réservation</span>
              </Button>
            </div>
          </form>

          <!-- error message -->
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
            Votre rendez-vous a été réservé avec succès !
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
  teleconsultationFee?: number;
}

interface Props {
  isOpen: boolean;
  practitioner: Practitioner | null;
  selectedDate?: string | null;
  selectedTime?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close" | "success"): void;
}>();

const authStore = useAuthStore();
const appointmentType = ref<"IN_PERSON" | "TELECONSULTATION">("IN_PERSON");
const selectedDate = ref(props.selectedDate || "");
const selectedTime = ref(props.selectedTime || "");
const reason = ref("");
const submitting = ref(false);
const error = ref("");
const success = ref(false);

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

const close = () => {
  emit("close");
};

const handleSubmit = async () => {
  if (!authStore.isAuthenticated) {
    // redirect to login with the current page as return
    const route = useRoute();
    const returnUrl = route.fullPath;
    navigateTo(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
    return;
  }

  if (!selectedDate.value || !selectedTime.value) {
    error.value = "Veuillez sélectionner une date et une heure.";
    return;
  }

  submitting.value = true;
  error.value = "";
  success.value = false;

  try {
    // todo implement real appointment
    // const response = await $fetch('/api/appointments', {
    //   method: 'POST',
    //   body: {
    //     practitionerId: props.practitioner.id,
    //     appointmentDate: selectedDate.value,
    //     startTime: selectedTime.value,
    //     type: appointmentType.value,
    //     reason: reason.value,
    //   },
    // });

    // temp simulate api call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    success.value = true;
    emit("success");

    // close modal after 2 seconds
    setTimeout(() => {
      close();
    }, 2000);
  } catch (err: unknown) {
    error.value =
      err instanceof Error
        ? err.message
        : "Une erreur est survenue lors de la réservation.";
  } finally {
    submitting.value = false;
  }
};

// watch for changes in props
watch(
  () => props.selectedDate,
  (newDate) => {
    if (newDate) {
      selectedDate.value = newDate;
    }
  },
);

watch(
  () => props.selectedTime,
  (newTime) => {
    if (newTime) {
      selectedTime.value = newTime;
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
