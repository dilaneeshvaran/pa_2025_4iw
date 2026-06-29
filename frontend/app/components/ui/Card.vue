<template>
  <div :class="['rounded-lg border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(26,21,16,0.07)]', className || 'p-5']">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

defineProps<Props>();
</script>
