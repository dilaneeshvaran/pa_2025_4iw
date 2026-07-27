<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm overflow-hidden">
    <div class="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60">
      <Calendar class="h-4 w-4 text-green-600" />
      <p class="font-display font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
        {{ practitionerName }}
      </p>
    </div>

    <div class="p-3 space-y-3">
      <!-- days -->
      <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="day in days"
          :key="day.date"
          type="button"
          class="shrink-0 rounded-xl px-2.5 py-1.5 text-center transition border"
          :class="
            selectedDate === day.date
              ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-400'
          "
          @click="selectDate(day.date)"
        >
          <span class="block text-[10px] font-semibold uppercase">{{ weekday(day.date) }}</span>
          <span class="block text-sm font-display font-bold tabular-nums">{{ dayNum(day.date) }}</span>
        </button>
      </div>

      <!-- times -->
      <div v-if="activeSlots.length" class="flex flex-wrap gap-1.5">
        <button
          v-for="t in activeSlots"
          :key="t"
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums transition border"
          :class="
            selectedTime === t
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-orange-400'
          "
          @click="selectedTime = t"
        >
          {{ t }}
        </button>
      </div>

      <!-- type -->
      <div v-if="selectedTime" class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="rounded-xl border p-2.5 text-left transition"
          :class="type === 'IN_PERSON' ? 'border-green-600 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700'"
          @click="type = 'IN_PERSON'"
        >
          <span class="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
            <MapPin class="h-3.5 w-3.5" /> Au cabinet
          </span>
        </button>
        <button
          type="button"
          class="rounded-xl border p-2.5 text-left transition"
          :class="type === 'TELECONSULTATION' ? 'border-green-600 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700'"
          @click="type = 'TELECONSULTATION'"
        >
          <span class="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
            <Video class="h-3.5 w-3.5" /> Téléconsultation
          </span>
        </button>
      </div>

      <button
        v-if="selectedTime"
        type="button"
        class="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2.5 transition active:scale-[0.98]"
        @click="confirmSelection"
      >
        Continuer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Calendar, MapPin, Video } from "lucide-vue-next";
import { useMedibotStore } from "~/stores/medibot";
import type { MedibotSlotsDay } from "~/types/medibot";

const props = defineProps<{
  practitionerId: string;
  practitionerName: string;
  days: MedibotSlotsDay[];
}>();

const medibot = useMedibotStore();
const selectedDate = ref<string>(props.days[0]?.date ?? "");
const selectedTime = ref<string>("");
const type = ref<"IN_PERSON" | "TELECONSULTATION">("IN_PERSON");

const activeSlots = computed(
  () => props.days.find((d) => d.date === selectedDate.value)?.slots ?? [],
);

function selectDate(date: string) {
  selectedDate.value = date;
  selectedTime.value = "";
}
function weekday(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short" });
}
function dayNum(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric" });
}
function humanDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function confirmSelection() {
  const typeLabel = type.value === "TELECONSULTATION" ? "téléconsultation" : "au cabinet";
  medibot.sendMessage(
    `Je réserve le ${humanDate(selectedDate.value)} à ${selectedTime.value} en ${typeLabel} avec ${props.practitionerName}.\n\n(Référence interne: praticien ${props.practitionerId})`,
  );
}
</script>
