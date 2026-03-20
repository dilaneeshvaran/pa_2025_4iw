<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Encaisser un paiement
            </h3>
            <button
              @click="emit('close')"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="submitPayment" class="space-y-4">
            <!-- patient info  -->
            <div v-if="appointment" class="mb-4 rounded-lg bg-gray-50 p-3">
              <p class="font-medium text-gray-900">
                Patient : {{ appointment.patient?.firstName }}
                {{ appointment.patient?.lastName }}
              </p>
              <p class="text-sm text-gray-500">
                Date :
                {{
                  new Date(
                    appointment.appointmentDate ?? appointment.date ?? "",
                  ).toLocaleDateString("fr-FR")
                }}
                à {{ appointment.startTime }}
              </p>
              <p class="text-sm text-gray-500">
                Motif : {{ appointment.reason || "Consultation Cabinet" }}
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Montant (FCFA) *
              </label>
              <UiInput
                v-model.number="form.amount"
                type="number"
                min="0"
                required
                class="w-full"
                placeholder="Ex: 15000"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Moyen de paiement *
              </label>
              <select
                v-model="form.method"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="" disabled>Sélectionner...</option>
                <option value="CASH">Espèces</option>
                <option value="CARD">Carte Bancaire</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHECK">Chèque</option>
                <option value="TRANSFER">Virement</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Notes (optionnel)
              </label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Ex: Reste à payer, mutuelle..."
              ></textarea>
            </div>

            <div
              v-if="errorMsg"
              class="rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {{ errorMsg }}
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <UiButton
                type="button"
                variant="secondary"
                @click="emit('close')"
                :disabled="loading"
              >
                Annuler
              </UiButton>
              <UiButton
                type="submit"
                :disabled="loading || !form.amount || !form.method"
              >
                <span v-if="loading">Création...</span>
                <span v-else>Valider & Facturer</span>
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { X as XIcon } from "lucide-vue-next";

interface AppointmentData {
  id: string;
  appointmentDate?: string;
  date?: string;
  startTime: string;
  reason?: string | null;
  patient?: {
    firstName: string;
    lastName: string;
  };
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
}

const props = defineProps<{
  isOpen: boolean;
  appointment: AppointmentData | null;
  practitionerId?: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [invoice: InvoiceData];
}>();

const form = ref({
  amount: 0,
  method: "",
  notes: "",
});

const loading = ref(false);
const errorMsg = ref("");

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      // reset form and  prefilld if available
      form.value.amount = 0; // default 0, user must fill. or we fetch config.
      form.value.method = "";
      form.value.notes = "";
      errorMsg.value = "";

      // try prefill amount if we have it in appointment or practitioner info
      // we dont have practitioner fee passed directly but we can leave it empty
    }
  },
);

const submitPayment = async () => {
  if (!props.appointment || !props.appointment.id) {
    errorMsg.value = "Le rendez-vous n'est pas sélectionné.";
    return;
  }

  try {
    loading.value = true;
    errorMsg.value = "";

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: InvoiceData;
    }>("/payments/practitioner/cabinet-payment", {
      method: "POST",
      body: {
        appointmentId: props.appointment.id,
        amount: form.value.amount,
        method: form.value.method,
        notes: form.value.notes,
        ...(props.practitionerId && { practitionerId: props.practitionerId }),
      },
    });

    if (response) {
      emit("success", response.data);
    }
  } catch (error: unknown) {
    console.error("Payment creation failed:", error);
    const apiError = error as { data?: { message?: string } };
    errorMsg.value =
      apiError.data?.message || "Erreur lors de la création de la facture";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .max-w-md,
.modal-leave-active .max-w-md {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .max-w-md {
  transform: scale(0.95);
}
</style>
