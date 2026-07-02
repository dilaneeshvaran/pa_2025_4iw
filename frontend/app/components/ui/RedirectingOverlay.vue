<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="redirect-title"
    >
      <div
        class="w-full max-w-sm transform rounded-2xl bg-white p-8 shadow-2xl transition-all dark:bg-gray-800"
      >
        <div class="flex flex-col items-center text-center">
          <div class="relative mb-6 h-20 w-20">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"
            ></div>
            
            <div
              class="absolute inset-4 rounded-full border-4 border-transparent border-b-green-600 animate-spin [animation-duration:1.5s] [animation-direction:reverse]"
            ></div>

            <div class="absolute inset-8 flex items-center justify-center">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            </div>
          </div>

          <h3
            id="redirect-title"
            class="text-xl font-bold text-gray-900 dark:text-white font-display mb-2"
          >
            {{ title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ message }}
          </p>

          <div class="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              class="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 to-green-600 animate-pulse w-full"
              style="animation-duration: 2s;"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from "vue";

interface Props {
  show: boolean;
  title?: string;
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Redirection en cours...",
  message: "Veuillez patienter pendant que nous vous redirigeons.",
});

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
