<template>
  <div class="flex flex-col gap-2" :class="isUser ? 'items-end' : 'items-start'">
    <!-- bubble -->
    <div class="flex items-end gap-2 max-w-[92%]" :class="isUser ? 'flex-row-reverse' : ''">
      <div
        v-if="!isUser"
        class="h-6 w-6 shrink-0 rounded-lg grid place-items-center bg-[#00804A]"
        aria-hidden="true"
      >
        <MedibotBotGlyph class="h-4 w-4 text-white" />
      </div>

      <div
        class="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="
          isUser
            ? 'bg-green-600 text-white rounded-br-md'
            : message.error
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-bl-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md'
        "
      >
        <span v-if="message.pending" class="inline-flex gap-1 py-1" aria-label="Medibot écrit">
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms" />
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms" />
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms" />
        </span>
        <template v-else>{{ displayContent }}</template>
      </div>

      <button
        v-if="!isUser && !message.pending && message.content && ttsSupported"
        type="button"
        class="shrink-0 h-6 w-6 grid place-items-center rounded-md text-gray-400 hover:text-green-600 transition"
        :aria-label="isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse'"
        @click="toggleSpeak"
      >
        <VolumeX v-if="isSpeaking" class="h-3.5 w-3.5" />
        <Volume2 v-else class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- action cards -->
    <div v-if="message.actions?.length" class="w-full space-y-2 pl-8">
      <template v-for="(action, i) in message.actions" :key="i">
        <div v-if="action.type === 'practitioners'" class="space-y-2">
          <MedibotPractitionerCard
            v-for="p in action.practitioners"
            :key="p.id"
            :practitioner="p"
          />
        </div>

        <MedibotSlotsCard
          v-else-if="action.type === 'slots'"
          :practitioner-id="action.practitionerId"
          :practitioner-name="action.practitionerName"
          :days="action.days"
        />

        <MedibotBookingCard
          v-else-if="action.type === 'booking_confirm'"
          :booking="action.booking"
        />

        <MedibotAuthCard v-else-if="action.type === 'auth'" :mode="action.mode" />

        <button
          v-else-if="action.type === 'navigate'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-green-600/40 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-300 transition hover:bg-green-100 dark:hover:bg-green-900/40"
          @click="goTo(action.path)"
        >
          <ArrowRight class="h-4 w-4" /> {{ action.label }}
        </button>

        <button
          v-else-if="action.type === 'logout'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="doLogout"
        >
          <LogOut class="h-4 w-4" /> Se déconnecter
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Volume2, VolumeX, ArrowRight, LogOut } from "lucide-vue-next";
import { useMedibotSpeech } from "~/composables/useMedibotSpeech";
import { useMedibotStore } from "~/stores/medibot";
import { useAuthStore } from "~/stores/auth";
import type { MedibotMessage } from "~/types/medibot";

const props = defineProps<{ message: MedibotMessage }>();

const medibot = useMedibotStore();
const authStore = useAuthStore();
const { speak, stopSpeaking, isSpeaking, ttsSupported } = useMedibotSpeech();

const isUser = computed(() => props.message.role === "user");

// Hide the internal reference hint we append to some card-triggered messages.
const displayContent = computed(() =>
  props.message.content.replace(/\n*\(Référence interne:[^)]*\)\s*$/i, "").trim(),
);

function toggleSpeak() {
  if (isSpeaking.value) stopSpeaking();
  else speak(props.message.content);
}

function goTo(path: string) {
  medibot.close();
  navigateTo(path);
}

async function doLogout() {
  await authStore.logout();
  medibot.resetLocal();
  medibot.pushSystemNote("Vous êtes déconnecté. À bientôt sur Medicote 🌿");
}
</script>
