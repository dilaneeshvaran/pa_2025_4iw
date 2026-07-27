<template>
  <div class="flex h-full flex-col bg-white dark:bg-gray-900">
    <!-- header -->
    <header class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-green-50/60 to-transparent dark:from-green-900/10">
      <div class="relative h-10 w-10 rounded-xl grid place-items-center bg-[#00804A] shadow-lg shadow-green-900/25">
        <MedibotBotGlyph class="h-6 w-6 text-white" />
        <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
      </div>
      <div class="min-w-0">
        <p class="font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">Medibot</p>
        <p class="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Votre guide santé
        </p>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <button
          v-if="ttsSupported"
          type="button"
          class="h-8 w-8 grid place-items-center rounded-lg transition"
          :class="autoRead ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          :aria-pressed="autoRead"
          aria-label="Lecture automatique des réponses"
          @click="toggleAutoRead"
        >
          <Volume2 v-if="autoRead" class="h-5 w-5" />
          <VolumeX v-else class="h-5 w-5" />
        </button>
        <button
          type="button"
          class="h-8 w-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Fermer Medibot"
          @click="medibot.close()"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </header>

    <!-- stream -->
    <div ref="streamEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-4 medibot-scroll">
      <!-- empty state -->
      <div v-if="!medibot.hasMessages" class="flex flex-col items-center text-center pt-6 pb-2">
        <div class="h-16 w-16 rounded-2xl grid place-items-center bg-[#00804A] shadow-lg shadow-green-900/25">
          <MedibotBotGlyph class="h-9 w-9 text-white" />
        </div>
        <h3 class="mt-4 font-display font-bold text-gray-900 dark:text-gray-100">Bonjour 🌿</h3>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-[16rem]">
          Je suis Medibot. Décrivez-moi ce que vous ressentez, ou dites-moi quel praticien vous cherchez.
        </p>
        <div class="mt-4 flex flex-col gap-2 w-full">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 text-left transition hover:border-green-500 hover:text-green-600"
            @click="send(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <MedibotMessage v-for="m in medibot.messages" :key="m.id" :message="m" />
    </div>

    <!-- composer -->
    <div class="border-t border-gray-100 dark:border-gray-800 px-3 py-3">
      <p
        v-if="interimTranscript"
        class="px-2 pb-1.5 text-xs italic text-green-600 dark:text-green-400"
      >
        {{ interimTranscript }}…
      </p>
      <div class="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 focus-within:ring-2 focus-within:ring-green-500/40">
        <button
          type="button"
          class="shrink-0 h-9 w-9 grid place-items-center rounded-xl text-gray-400 hover:text-green-600 transition"
          aria-label="Téléverser un document médical"
          @click="triggerUpload"
        >
          <Loader2 v-if="uploading" class="h-5 w-5 animate-spin" />
          <Paperclip v-else class="h-5 w-5" />
        </button>
        <input ref="fileInput" type="file" class="hidden" accept="application/pdf,image/png,image/jpeg,image/webp" @change="onFile" />

        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          placeholder="Écrivez ou parlez à Medibot…"
          class="flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm leading-6 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0 max-h-24 dark:!bg-transparent"
          @keydown.enter.exact.prevent="send()"
          @input="autoGrow"
        />

        <button
          v-if="sttSupported"
          type="button"
          class="shrink-0 h-9 w-9 grid place-items-center rounded-xl transition"
          :class="isListening ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'"
          :aria-label="isListening ? 'Arrêter la dictée' : 'Dicter à la voix'"
          @click="toggleMic"
        >
          <MicOff v-if="isListening" class="h-5 w-5" />
          <Mic v-else class="h-5 w-5" />
        </button>

        <button
          type="button"
          :disabled="!draft.trim() || medibot.isLoading"
          class="shrink-0 h-9 w-9 grid place-items-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-40 active:scale-95"
          aria-label="Envoyer"
          @click="send()"
        >
          <Send class="h-5 w-5" />
        </button>
      </div>
      <p class="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400">
        <ShieldCheck class="h-3 w-3" /> Assistant santé · ne remplace pas un avis médical
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import {
  X,
  Send,
  Mic,
  MicOff,
  Paperclip,
  Volume2,
  VolumeX,
  ShieldCheck,
  Loader2,
} from "lucide-vue-next";
import { useMedibotStore } from "~/stores/medibot";
import { useAuthStore } from "~/stores/auth";
import { useMedibotSpeech } from "~/composables/useMedibotSpeech";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

const medibot = useMedibotStore();
const authStore = useAuthStore();
const {
  isListening,
  interimTranscript,
  sttSupported,
  ttsSupported,
  startListening,
  stopListening,
  speak,
} = useMedibotSpeech();

const draft = ref("");
const autoRead = ref(false);
const uploading = ref(false);
const streamEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const suggestions = [
  "J'ai mal à la gorge depuis 2 jours",
  "Trouver un dermatologue à Abidjan",
  "Je voudrais prendre un rendez-vous",
  "Analyser mon ordonnance",
];

function scrollToBottom() {
  nextTick(() => {
    if (streamEl.value) streamEl.value.scrollTop = streamEl.value.scrollHeight;
  });
}

watch(
  () => medibot.messages.length,
  () => {
    scrollToBottom();
    if (autoRead.value) {
      const last = medibot.messages[medibot.messages.length - 1];
      if (last && last.role === "assistant" && !last.pending && last.content) {
        speak(last.content);
      }
    }
  },
);

function autoGrow() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
}

function send(text?: string) {
  const value = (text ?? draft.value).trim();
  if (!value) return;
  medibot.sendMessage(value);
  draft.value = "";
  nextTick(autoGrow);
}

function toggleMic() {
  if (isListening.value) {
    stopListening();
  } else {
    startListening((finalText) => {
      draft.value = draft.value ? `${draft.value} ${finalText}` : finalText;
      nextTick(autoGrow);
    });
  }
}

function toggleAutoRead() {
  autoRead.value = !autoRead.value;
}

function triggerUpload() {
  if (!authStore.isAuthenticated || authStore.currentRole !== "PATIENT") {
    medibot.pushSystemNote(
      "Pour analyser un document médical en toute confidentialité, connectez-vous d'abord à votre compte patient. 🌿",
      [{ type: "auth", mode: "login" }],
    );
    return;
  }
  fileInput.value?.click();
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = "";

  uploading.value = true;
  medibot.pushUserNote(`📎 ${file.name}`);
  try {
    const form = new FormData();
    form.append("file", file);
    if (medibot.conversationId) form.append("conversationId", medibot.conversationId);

    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: { conversationId: string; message: string };
    }>("/medibot/document", { method: "POST", body: form });

    if (res.data.conversationId) medibot.conversationId = res.data.conversationId;
    medibot.pushSystemNote(res.data.message);
  } catch (err: unknown) {
    const e2 = err as { data?: { message?: string } };
    medibot.pushSystemNote(
      e2.data?.message || "Je n'ai pas pu analyser ce document. Réessayez avec un PDF ou une image.",
    );
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.medibot-scroll::-webkit-scrollbar {
  width: 6px;
}
.medibot-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 128, 74, 0.25);
  border-radius: 8px;
}
</style>
