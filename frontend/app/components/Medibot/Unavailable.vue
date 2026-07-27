<template>
  <div class="flex h-full flex-col bg-white dark:bg-gray-900">
    <header class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      <div class="h-10 w-10 rounded-xl grid place-items-center bg-[#00804A]">
        <MedibotBotGlyph class="h-6 w-6 text-white" />
      </div>
      <p class="font-display font-bold text-gray-900 dark:text-gray-100">Medibot</p>
      <button
        type="button"
        class="ml-auto h-8 w-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Fermer"
        @click="medibot.close()"
      >
        <X class="h-5 w-5" />
      </button>
    </header>
    <div class="flex-1 grid place-items-center p-6 text-center">
      <div>
        <p class="text-4xl">🌿</p>
        <p class="mt-3 font-display font-semibold text-gray-900 dark:text-gray-100">
          Medibot n'est pas encore disponible
        </p>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Votre assistant santé revient très bientôt. En attendant, vous pouvez rechercher un
          praticien depuis la page de recherche.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import { useMedibotStore } from "~/stores/medibot";
const medibot = useMedibotStore();
</script>
