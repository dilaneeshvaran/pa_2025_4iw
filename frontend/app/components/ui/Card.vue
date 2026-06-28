<template>
  <!-- practitioner public profil  -->
  <div
    :class="[
      'rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900',
      className,
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

defineProps<Props>();
</script>
