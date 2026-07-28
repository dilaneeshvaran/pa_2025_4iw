<template>
  <div class="space-y-6">
    <PractitionerPaymentMethods />
  </div>
</template>

<script setup lang="ts">
import PractitionerPaymentMethods from "~/components/practitioner/PaymentMethods.vue";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const router = useRouter();

onMounted(() => {
  router.replace("/practitioner/billing?tab=methods");
});
</script>
