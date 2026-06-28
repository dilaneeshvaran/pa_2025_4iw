<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
      Logs d'audit
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Page en cours de développement
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});
</script>
