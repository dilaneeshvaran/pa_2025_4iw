<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth ?? 1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'stethoscope'">
      <path
        d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"
      />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </template>

    <template v-else-if="name === 'baby'">
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path
        d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5S14.5 8 13 8c-1 0-1-.5-1-1"
      />
    </template>

    <template v-else-if="name === 'venus'">
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M12 14v7" />
      <path d="M8.5 18h7" />
    </template>

    <template v-else-if="name === 'heart-pulse'">
      <path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      />
      <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </template>

    <!-- dent : dentisterie -->
    <template v-else-if="name === 'tooth'">
      <path
        d="M12 5.5C10.6 4.2 9.2 3.5 7.5 3.5 5.2 3.5 3.5 5.4 3.5 8c0 1.6.4 2.9.9 4.4.5 1.6.8 3.3 1 5 .2 1.5.6 3.1 1.9 3.1 1.2 0 1.6-1.3 1.9-2.7l.7-3.1c.2-.9.9-1.3 2.1-1.3s1.9.4 2.1 1.3l.7 3.1c.3 1.4.7 2.7 1.9 2.7 1.3 0 1.7-1.6 1.9-3.1.2-1.7.5-3.4 1-5 .5-1.5.9-2.8.9-4.4 0-2.6-1.7-4.5-4-4.5-1.7 0-3.1.7-4.5 2Z"
      />
    </template>

    <template v-else-if="name === 'dermatoscope'">
      <circle cx="10.5" cy="10.5" r="7" />
      <circle cx="9.4" cy="9.6" r="2.4" />
      <path d="M13.4 13.6h.01" />
      <path d="m21 21-5.55-5.55" />
    </template>
  </svg>
</template>

<script lang="ts">
export type SpecialtyIconName =
  "stethoscope" | "baby" | "venus" | "heart-pulse" | "tooth" | "dermatoscope";
</script>

<script setup lang="ts">
interface Props {
  name: SpecialtyIconName;
  strokeWidth?: number;
}

defineProps<Props>();
</script>
