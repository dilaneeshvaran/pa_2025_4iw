<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Facturation</h1>
      <p class="text-gray-600 dark:text-gray-400">Suivez vos paiements, configurez vos tarifs et gérez vos moyens de paiement</p>
    </div>

    <div class="mb-6 border-b border-gray-200 dark:border-gray-800">
      <nav class="scrollbar-hide -mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        <button
          @click="selectTab('received')"
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
          @click="selectTab('config')"
          :class="[
            activeTab === 'config'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
            'shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Configuration
        </button>
        <button
          @click="selectTab('methods')"
          :class="[
            activeTab === 'methods'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
            'shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors duration-200',
          ]"
        >
          Moyens de paiement (Abonnement)
        </button>
      </nav>
    </div>

    <div v-show="activeTab === 'received'">
      <PractitionerBillingReceived />
    </div>
    <div v-show="activeTab === 'config'">
      <PractitionerBillingConfiguration />
    </div>
    <div v-show="activeTab === 'methods'">
      <PractitionerPaymentMethods />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PractitionerBillingReceived from "~/components/practitioner/BillingReceived.vue";
import PractitionerBillingConfiguration from "~/components/practitioner/BillingConfiguration.vue";
import PractitionerPaymentMethods from "~/components/practitioner/PaymentMethods.vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const route = useRoute();
const router = useRouter();
const activeTab = ref("received");

const selectTab = (tab: string) => {
  activeTab.value = tab;
  router.replace({ query: { ...route.query, tab } });
};

onMounted(() => {
  const queryTab = route.query.tab as string;
  if (queryTab && ["received", "config", "methods"].includes(queryTab)) {
    activeTab.value = queryTab;
  }
});

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === "string" && ["received", "config", "methods"].includes(newTab)) {
      activeTab.value = newTab;
    }
  }
);
</script>
