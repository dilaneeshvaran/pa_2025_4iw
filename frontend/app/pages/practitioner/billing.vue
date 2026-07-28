<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Facturation</h1>
      <p class="text-gray-600 dark:text-gray-400">Suivez vos paiements et configurez vos tarifs</p>
    </div>

    <div class="mb-6 border-b border-gray-200 dark:border-gray-800">
      <nav class="scrollbar-hide -mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        <button
          @click="activeTab = 'received'"
          :class="[
            activeTab === 'received'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
            'shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Paiements reçus / Factures
        </button>
        <button
          @click="activeTab = 'config'"
          :class="[
            activeTab === 'config'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
            'shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Configuration
        </button>
        <NuxtLink
          to="/practitioner/payment-methods"
          class="shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          Moyens de paiement (Abonnement)
        </NuxtLink>
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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import PractitionerBillingReceived from "~/components/practitioner/BillingReceived.vue";
import PractitionerBillingConfiguration from "~/components/practitioner/BillingConfiguration.vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const route = useRoute();
const router = useRouter();
const activeTab = ref("received");

onMounted(() => {
  if (route.query.tab === "methods") {
    router.replace("/practitioner/payment-methods");
  }
});
</script>
