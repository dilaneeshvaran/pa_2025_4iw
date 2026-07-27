<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm overflow-hidden">
    <!-- summary -->
    <div class="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-2">
      <component :is="booking.type === 'TELECONSULTATION' ? Video : MapPin" class="h-4 w-4 text-green-600" />
      <p class="font-display font-bold text-sm text-gray-900 dark:text-gray-100">
        {{ booking.type === "TELECONSULTATION" ? "Téléconsultation" : "Rendez-vous au cabinet" }}
      </p>
    </div>

    <div class="p-4 space-y-2.5">
      <dl class="space-y-1.5 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-gray-500 dark:text-gray-400">Praticien</dt>
          <dd class="font-semibold text-gray-900 dark:text-gray-100 text-right">{{ booking.practitionerName }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-gray-500 dark:text-gray-400">Date</dt>
          <dd class="font-semibold text-gray-900 dark:text-gray-100 text-right">{{ humanDate }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-gray-500 dark:text-gray-400">Heure</dt>
          <dd class="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{{ booking.startTime }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-gray-500 dark:text-gray-400">Tarif</dt>
          <dd class="font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ formatFcfa(booking.fee) }}</dd>
        </div>
      </dl>

      <!-- confirmed -->
      <div
        v-if="status === 'confirmed'"
        class="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 px-3 py-2.5 text-sm font-semibold text-green-700 dark:text-green-300"
      >
        <CheckCircle2 class="h-4 w-4" /> Rendez-vous confirmé
      </div>

      <!-- payment step -->
      <MedibotPaymentCard
        v-else-if="status === 'payment' && appointmentId"
        :appointment-id="appointmentId"
        :amount="booking.fee"
        @paid="onPaid"
        @skip="onSkipPayment"
      />

      <!-- confirm button -->
      <template v-else>
        <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <button
          type="button"
          :disabled="status === 'confirming'"
          class="w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition active:scale-[0.98] flex items-center justify-center gap-2"
          @click="confirm"
        >
          <Loader2 v-if="status === 'confirming'" class="h-4 w-4 animate-spin" />
          {{ booking.requiresPayment ? "Confirmer et payer" : "Confirmer le rendez-vous" }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { MapPin, Video, CheckCircle2, Loader2 } from "lucide-vue-next";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";
import { useMedibotStore } from "~/stores/medibot";
import type { MedibotBooking } from "~/types/medibot";

const props = defineProps<{ booking: MedibotBooking }>();
const medibot = useMedibotStore();

const status = ref<"idle" | "confirming" | "payment" | "confirmed">("idle");
const appointmentId = ref<string | null>(null);
const errorMessage = ref("");

const humanDate = computed(() =>
  new Date(`${props.booking.appointmentDate}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }),
);

function formatFcfa(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`;
}

async function confirm() {
  status.value = "confirming";
  errorMessage.value = "";
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: { id: string } }>(
      "/appointments",
      {
        method: "POST",
        body: {
          practitionerId: props.booking.practitionerId,
          appointmentDate: props.booking.appointmentDate,
          startTime: props.booking.startTime,
          type: props.booking.type,
          reason: props.booking.reason ?? undefined,
        },
      },
    );
    appointmentId.value = res.data.id;
    if (props.booking.requiresPayment) {
      status.value = "payment";
    } else {
      status.value = "confirmed";
      medibot.pushSystemNote(
        `C'est fait ! 🌿 Votre rendez-vous avec ${props.booking.practitionerName} le ${humanDate.value} à ${props.booking.startTime} est confirmé. Vous le retrouverez dans « Mes rendez-vous ».`,
      );
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } };
    status.value = "idle";
    errorMessage.value =
      e.data?.message || "Ce créneau n'est plus disponible. Choisissez-en un autre.";
  }
}

function onPaid() {
  status.value = "confirmed";
  medibot.pushSystemNote(
    `Paiement reçu ✓ Votre téléconsultation avec ${props.booking.practitionerName} le ${humanDate.value} à ${props.booking.startTime} est confirmée. Le lien sera disponible dans « Mes téléconsultations » le jour J.`,
  );
}

function onSkipPayment() {
  status.value = "confirmed";
  medibot.pushSystemNote(
    "Votre rendez-vous est réservé. Vous pourrez régler la téléconsultation plus tard depuis « Mes rendez-vous ».",
  );
}
</script>
