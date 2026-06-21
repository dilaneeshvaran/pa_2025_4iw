<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout :key="route.meta.layout || 'default'">
      <NuxtPage />
    </NuxtLayout>
    <ConsentBanner />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>

