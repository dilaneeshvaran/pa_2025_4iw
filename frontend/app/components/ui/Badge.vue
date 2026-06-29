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
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border";

  const variantClasses = {
    default: "bg-gray-100 text-gray-500 border-gray-200",
    primary: "bg-[#D96F00]/10 text-[#D96F00] border-[#D96F00]/20",
    success: "bg-[#00804A]/10 text-[#00804A] border-[#00804A]/20",
    warning: "bg-[#D96F00]/10 text-[#D96F00] border-[#D96F00]/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return [baseClass, variantClasses[props.variant], props.className]
    .filter(Boolean)
    .join(" ");
});
</script>
