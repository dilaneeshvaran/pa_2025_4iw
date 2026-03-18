<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900">Gestion utilisateurs</h1>
    <p class="text-gray-600">Page en cours de développement</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});
</script>
