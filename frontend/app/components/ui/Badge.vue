<template>
  <!-- for doctor's info / search filter -->
  <span :class="badgeClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const badgeClass = computed(() => {
  const baseClass =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  return [baseClass, variantClasses[props.variant], props.className]
    .filter(Boolean)
    .join(" ");
});
</script>
