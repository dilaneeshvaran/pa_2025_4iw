<template>
  <div :class="['rounded-2xl border border-[#E5E3DC] bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md', className || 'p-6']">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

defineProps<Props>();
</script>
