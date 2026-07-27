<template>
  <div
    class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm overflow-hidden"
  >
    <div class="flex items-center gap-3 p-3">
      <div
        class="h-11 w-11 shrink-0 rounded-xl grid place-items-center font-display font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-display font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
          {{ practitioner.name }}
        </p>
        <p v-if="practitioner.specialty" class="text-xs font-semibold text-green-600 dark:text-green-400">
          {{ practitioner.specialty }}
        </p>
        <p
          v-if="practitioner.city || practitioner.address"
          class="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate"
        >
          <MapPin class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ practitioner.city || practitioner.address }}</span>
        </p>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            v-if="practitioner.teleconsultationEnabled"
            class="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-300"
          >
            <Video class="h-2.5 w-2.5" /> Téléconsultation
          </span>
          <span
            v-if="practitioner.averageRating"
            class="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300"
          >
            <Star class="h-2.5 w-2.5 fill-current text-amber-500" />
            {{ practitioner.averageRating.toFixed(1) }}
          </span>
          <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            {{ formatFcfa(practitioner.baseConsultationFee) }}
          </span>
        </div>
      </div>
      <button
        type="button"
        class="shrink-0 self-stretch w-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 grid place-items-center transition hover:bg-orange-100 dark:hover:bg-orange-900/40 active:scale-95"
        :aria-label="`Voir les créneaux de ${practitioner.name}`"
        @click="chooseSlots"
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { MapPin, Video, Star, ChevronRight } from "lucide-vue-next";
import { useMedibotStore } from "~/stores/medibot";
import type { MedibotPractitioner } from "~/types/medibot";

const props = defineProps<{ practitioner: MedibotPractitioner }>();
const medibot = useMedibotStore();

const initials = computed(() => {
  const f = props.practitioner.firstName?.[0] ?? "";
  const l = props.practitioner.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "Dr";
});

function formatFcfa(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`;
}

function chooseSlots() {
  medibot.sendMessage(
    `Je souhaite voir les créneaux disponibles du ${props.practitioner.name}.\n\n(Référence interne: praticien ${props.practitioner.id})`,
  );
}
</script>
