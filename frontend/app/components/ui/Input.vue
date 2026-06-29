<template>
  <!-- used in home page only -->
  <div class="relative w-full">
    <div
      v-if="icon"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    >
      <slot name="icon">
        <component :is="icon" />
      </slot>
    </div>
    <input
      v-bind="$attrs"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClass"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";

defineOptions({
  inheritAttrs: false,
});

interface Props {
  type?: string;
  modelValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  icon?: Component;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  disabled: false,
  icon: undefined,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "blur" | "focus", event: FocusEvent): void;
}>();

const inputClass = computed(() => {
  return [
    "w-full rounded-md border border-black/[0.08] px-4 py-2.5 text-sm transition-all duration-150",
    "focus-visible:border-[#00804A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00804A]/20",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
    props.icon && "pl-10",
    props.className,
  ]
    .filter(Boolean)
    .join(" ");
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>
