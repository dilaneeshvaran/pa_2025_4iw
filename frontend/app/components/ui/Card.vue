<template>
  <!-- practitioner public profil  -->
  <div :class="['rounded-lg border bg-white p-6 shadow-sm', className]">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

defineProps<Props>();
</script>
