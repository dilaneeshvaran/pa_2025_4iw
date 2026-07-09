<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
    class="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    @click="cycle"
  >
    <component :is="icon" class="h-5 w-5" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Monitor, Sun, Moon } from "lucide-vue-next";
import { useTheme } from "~/composables/useTheme";

const { preference, cycle } = useTheme();

const icon = computed(() => {
  if (preference.value === "light") return Sun;
  if (preference.value === "dark") return Moon;
  return Monitor;
});

const label = computed(() => {
  const map: Record<string, string> = {
    auto: "Thème : Système (cliquer pour Clair)",
    light: "Thème : Clair (cliquer pour Sombre)",
    dark: "Thème : Sombre (cliquer pour Système)",
  };
  return map[preference.value] ?? "Changer le thème";
});
</script>
