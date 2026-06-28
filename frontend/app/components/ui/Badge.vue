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
    default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    primary:
      "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200",
    success:
      "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
    warning:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
    danger: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
  };

  return [baseClass, variantClasses[props.variant], props.className]
    .filter(Boolean)
    .join(" ");
});
</script>
