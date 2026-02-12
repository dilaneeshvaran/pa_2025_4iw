<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Facturation</h1>
      <p class="text-gray-600">Suivez vos paiements et factures</p>
    </div>
    <UiCard>
      <div class="py-12 text-center">
        <CreditCard class="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p class="text-gray-500">Cette section sera bientôt disponible</p>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { CreditCard } from "lucide-vue-next";

definePageMeta({
  layout: "practitioner",
  middleware: "auth",
});
</script>
