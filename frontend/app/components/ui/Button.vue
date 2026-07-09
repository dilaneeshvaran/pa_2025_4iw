<template>
  <button
    :type="type"
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const buttonClass = computed(() => {
  const baseClass =
    "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00804A]/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variantClasses = {
    primary:
      "bg-[#00804A] text-white shadow-[0_1px_2px_rgba(0,128,74,0.25)] hover:bg-[#006B3D]",
    secondary:
      "bg-[#D96F00] text-white shadow-[0_1px_2px_rgba(217,111,0,0.25)] hover:bg-[#B85E00]",
    outline:
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-black/10 font-medium hover:bg-gray-200",
    ghost:
      "bg-transparent text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
    danger:
      "bg-red-600 text-white shadow-[0_1px_2px_rgba(220,38,38,0.25)] hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return [
    baseClass,
    variantClasses[props.variant],
    sizeClasses[props.size],
    props.className,
  ]
    .filter(Boolean)
    .join(" ");
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
</script>
