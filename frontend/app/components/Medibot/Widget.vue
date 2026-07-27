<template>
  <Teleport to="body">
    <div v-if="medibot.isAvailable">
      <!-- floating "vital sign" orb -->
      <Transition name="mb-orb">
        <button
          v-if="!medibot.isOpen"
          type="button"
          class="mb-orb fixed bottom-5 right-5 z-[55] h-14 w-14 rounded-2xl grid place-items-center bg-[#00804A] text-white shadow-xl shadow-green-900/30 transition active:scale-95"
          aria-label="Ouvrir Medibot, votre guide santé"
          @click="medibot.open()"
        >
          <span class="mb-ring" aria-hidden="true" />
          <span class="mb-ring mb-ring-2" aria-hidden="true" />
          <MedibotBotGlyph class="h-8 w-8" />
        </button>
      </Transition>

      <!-- backdrop (mobile) -->
      <Transition name="mb-fade">
        <div
          v-if="medibot.isOpen"
          class="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
          @click="medibot.close()"
        />
      </Transition>

      <!-- panel -->
      <Transition name="mb-panel">
        <div
          v-if="medibot.isOpen"
          class="fixed z-[60] inset-0 sm:inset-auto sm:right-5 sm:bottom-5 sm:top-5 sm:w-[400px] sm:max-h-[calc(100vh-2.5rem)] bg-white dark:bg-gray-900 sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          role="dialog"
          aria-label="Medibot"
        >
          <MedibotPanel v-if="medibot.isConfigured" />
          <MedibotUnavailable v-else />
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useMedibotStore } from "~/stores/medibot";
import { useAuthStore } from "~/stores/auth";

const medibot = useMedibotStore();
const authStore = useAuthStore();

onMounted(() => {
  medibot.checkStatus();
});

// If the authentication state flips (login/logout elsewhere), refresh the thread.
watch(
  () => authStore.isAuthenticated,
  (isAuth, was) => {
    if (isAuth && !was) {
      medibot.onAuthenticated();
    }
  },
);
</script>

<style scoped>
.mb-ring,
.mb-ring-2 {
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  border: 2px solid rgba(0, 128, 74, 0.6);
  animation: mb-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.mb-ring-2 {
  animation-delay: 1.3s;
}
@keyframes mb-ping {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}

.mb-orb-enter-active,
.mb-orb-leave-active,
.mb-fade-enter-active,
.mb-fade-leave-active {
  transition: opacity 0.2s ease;
}
.mb-orb-enter-from,
.mb-orb-leave-to,
.mb-fade-enter-from,
.mb-fade-leave-to {
  opacity: 0;
}

.mb-panel-enter-active,
.mb-panel-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.mb-panel-enter-from,
.mb-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .mb-ring,
  .mb-ring-2 {
    animation: none;
  }
  .mb-panel-enter-active,
  .mb-panel-leave-active,
  .mb-orb-enter-active,
  .mb-orb-leave-active {
    transition: none;
  }
}
</style>
