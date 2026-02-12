<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Statistiques</h1>
      <p class="text-gray-600">Analysez votre activité</p>
    </div>
    <UiCard>
      <div class="py-12 text-center">
        <BarChart3 class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p class="text-gray-500">Cette section sera bientôt disponible</p>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { BarChart3 } from "lucide-vue-next";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});
</script>
