<template>
  <div
    class="flex flex-col gap-2"
    :class="isUser ? 'items-end' : 'items-start'"
  >
    <!-- bubble -->
    <div
      class="flex max-w-[92%] items-end gap-2"
      :class="isUser ? 'flex-row-reverse' : ''"
    >
      <div
        v-if="!isUser"
        class="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#00804A]"
        aria-hidden="true"
      >
        <MedibotBotGlyph class="h-4 w-4 text-white" />
      </div>

      <div
        class="whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        :class="[
          isUser
            ? 'rounded-br-md bg-green-600 text-white'
            : message.error
              ? 'rounded-bl-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              : 'rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
          isTyping ? 'cursor-pointer' : '',
        ]"
        :aria-busy="isTyping"
        :title="isTyping ? 'Afficher toute la réponse' : undefined"
        @click="isTyping && finishTyping()"
      >
        <span
          v-if="message.pending"
          class="inline-flex gap-1 py-1"
          aria-label="Medibot écrit"
        >
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 0ms"
          />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 150ms"
          />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 300ms"
          />
        </span>
        <template v-else>
          <!-- eslint-disable-next-line vue/no-v-html -- sanitized by renderMedibotMarkdown -->
          <span v-html="renderedContent" /><span
            v-if="isTyping"
            class="mb-caret"
            aria-hidden="true"
          />
        </template>
      </div>

      <button
        v-if="!isUser && !message.pending && message.content && ttsSupported"
        type="button"
        class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-gray-400 transition hover:text-green-600"
        :aria-label="isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse'"
        @click="toggleSpeak"
      >
        <VolumeX v-if="isSpeaking" class="h-3.5 w-3.5" />
        <Volume2 v-else class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- action cards (revealed once the text is fully typed) -->
    <div
      v-if="message.actions?.length && !isTyping"
      class="w-full space-y-2 pl-8"
    >
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

        <MedibotAuthCard
          v-else-if="action.type === 'auth'"
          :mode="action.mode"
        />

        <!-- one-tap answers for a closed question; only on the latest message -->
        <div
          v-else-if="action.type === 'quick_replies' && isLast"
          class="flex flex-wrap gap-2"
        >
          <button
            v-for="option in action.options"
            :key="option"
            type="button"
            :disabled="medibot.isLoading"
            class="rounded-full border border-green-600/50 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 active:scale-95 disabled:opacity-40 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
            @click="medibot.sendMessage(option)"
          >
            {{ option }}
          </button>
        </div>

        <button
          v-else-if="action.type === 'navigate'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-green-600/40 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
          @click="goTo(action.path)"
        >
          <ArrowRight class="h-4 w-4" /> {{ action.label }}
        </button>

        <button
          v-else-if="action.type === 'logout'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="doLogout"
        >
          <LogOut class="h-4 w-4" /> Se déconnecter
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { Volume2, VolumeX, ArrowRight, LogOut } from "lucide-vue-next";
import { useMedibotSpeech } from "~/composables/useMedibotSpeech";
import { useMedibotStore } from "~/stores/medibot";
import { useAuthStore } from "~/stores/auth";
import { renderMedibotMarkdown } from "~/utils/medibotMarkdown";
import type { MedibotMessage } from "~/types/medibot";

const props = defineProps<{ message: MedibotMessage; isLast?: boolean }>();
/** Emitted on every reveal step so the panel can follow the growing bubble. */
const emit = defineEmits<{ grow: [] }>();

const medibot = useMedibotStore();
const authStore = useAuthStore();
const { speak, stopSpeaking, isSpeaking, ttsSupported } = useMedibotSpeech();

const isUser = computed(() => props.message.role === "user");

const fullText = computed(() =>
  props.message.content
    .replace(/\n*\(Référence interne:[^)]*\)\s*$/i, "")
    .trim(),
);

const revealed = ref(0);
const isTyping = computed(() => revealed.value < fullText.value.length);
const renderedContent = computed(() =>
  renderMedibotMarkdown(fullText.value.slice(0, revealed.value)),
);

interface RevealStep {
  /** how many characters are visible after this step */
  index: number;
  /** delay before the next step, in ms */
  pause: number;
}

function buildSteps(text: string): RevealStep[] {
  const words = text.match(/\s*\S+/g) ?? [];
  const fast = words.length > 100;
  const base = fast ? 12 : 32;

  const steps: RevealStep[] = [];
  let index = 0;
  for (const word of words) {
    index += word.length;
    let pause = base;
    const next = text.slice(index, index + 2);
    if (next.startsWith("\n\n")) pause += fast ? 140 : 340;
    else if (next.startsWith("\n")) pause += fast ? 70 : 180;
    else if (/[.!?:;]$/.test(word)) pause += fast ? 40 : 130;
    steps.push({ index, pause });
  }
  return steps;
}

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function finishTyping() {
  clearTimer();
  revealed.value = fullText.value.length;
  medibot.markAnimated(props.message.id);
  emit("grow");
}

function startTyping() {
  clearTimer();
  const text = fullText.value;
  const steps = buildSteps(text);
  if (steps.length === 0) {
    finishTyping();
    return;
  }

  revealed.value = 0;
  let i = 0;
  const tick = () => {
    const step = steps[i];
    if (!step) {
      finishTyping();
      return;
    }
    revealed.value = step.index;
    emit("grow");
    i += 1;
    timer = setTimeout(tick, step.pause);
  };
  tick();
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

watch(
  () => [props.message.pending, fullText.value] as const,
  () => {
    if (isUser.value || props.message.pending || props.message.error) {
      clearTimer();
      revealed.value = fullText.value.length;
      return;
    }
    if (props.message.animate && !prefersReducedMotion()) startTyping();
    else finishTyping();
  },
  { immediate: true },
);

onBeforeUnmount(clearTimer);

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

<style scoped>
.mb-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: currentColor;
  opacity: 0.6;
  animation: mb-blink 1s steps(2, start) infinite;
}
@keyframes mb-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mb-caret {
    animation: none;
  }
}
</style>
