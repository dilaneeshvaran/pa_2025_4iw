<template>
  <!-- practitioner photo -->
  <img
    v-if="!hasError"
    :src="src"
    :alt="alt"
    :class="className"
    @error="handleError"
  />
  <div
    v-else
    :class="cn('flex items-center justify-center bg-gray-200', className)"
  >
    <User class="h-1/2 w-1/2 text-gray-400" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { User } from "lucide-vue-next";
import { cn } from "~/utils/cn";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

defineProps<Props>();

const hasError = ref(false);

const handleError = () => {
  hasError.value = true;
};
</script>
