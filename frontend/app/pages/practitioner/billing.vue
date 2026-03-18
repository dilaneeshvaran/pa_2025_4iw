<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Facturation</h1>
      <p class="text-gray-600">Suivez vos paiements et configurez vos tarifs</p>
    </div>

    <div class="mb-6 border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'received'"
          :class="[
            activeTab === 'received'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Paiements reçus / Factures
        </button>
        <button
          @click="activeTab = 'config'"
          :class="[
            activeTab === 'config'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Configuration
        </button>
      </nav>
    </div>

    <div v-show="activeTab === 'received'">
      <PractitionerBillingReceived />
    </div>
    <div v-show="activeTab === 'config'">
      <PractitionerBillingConfiguration />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PractitionerBillingReceived from "~/components/practitioner/BillingReceived.vue";
import PractitionerBillingConfiguration from "~/components/practitioner/BillingConfiguration.vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const activeTab = ref("received");
</script>
