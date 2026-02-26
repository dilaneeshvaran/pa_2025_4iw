<template>
  <!-- practitioner public profil  -->
  <div :class="cn('rounded-lg border bg-white p-6 shadow-sm', className)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from "~/utils/cn";

interface Props {
  className?: string;
}

defineProps<Props>();
</script>
