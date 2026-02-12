<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Paramètres</h1>
      <p class="text-gray-600">Configurez votre compte et vos préférences</p>
    </div>
    <UiCard>
      <div class="py-12 text-center">
        <Settings class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p class="text-gray-500">Cette section sera bientôt disponible</p>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { Settings } from "lucide-vue-next";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});
</script>
