<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout :key="route.meta.layout || 'default'">
      <NuxtPage />
    </NuxtLayout>
    <ConsentBanner />
    <ClientOnly>
      <MedibotWidget />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>

