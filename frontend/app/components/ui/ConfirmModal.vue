<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        aria-modal="true"
        role="dialog"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @keydown.esc="onCancel"
        @mousedown.self="onCancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <!-- Panel -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="modelValue"
            ref="panelRef"
            class="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
            tabindex="-1"
          >
            <!-- Icon + Header -->
            <div class="flex flex-col items-center px-6 pt-6 pb-4 text-center">
              <div :class="['mb-4 flex h-12 w-12 items-center justify-center rounded-full', iconBgClass]">
                <component :is="iconComponent" :class="['h-6 w-6', iconColorClass]" />
              </div>
              <h2 :id="titleId" class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="descriptionId"
                class="mt-1.5 text-sm text-gray-500 leading-relaxed"
              >
                {{ description }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 px-6 pb-6 pt-2">
              <UiButton variant="outline" class="flex-1" @click="onCancel">
                {{ cancelLabel }}
              </UiButton>
              <UiButton :variant="confirmVariant" class="flex-1" :disabled="loading" @click="onConfirm">
                <span v-if="loading" class="flex items-center gap-1.5">
                  <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Patientez...
                </span>
                <span v-else>{{ confirmLabel }}</span>
              </UiButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { AlertTriangle, CheckCircle, LogOut, Info } from 'lucide-vue-next'

export type ConfirmModalVariant = 'danger' | 'warning' | 'success' | 'info'

interface Props {
  modelValue: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmModalVariant
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const panelRef = ref<HTMLElement | null>(null)

const uid = Math.random().toString(36).slice(2)
const titleId = `confirm-modal-title-${uid}`
const descriptionId = `confirm-modal-desc-${uid}`

const confirmVariant = computed(() => {
  const map: Record<ConfirmModalVariant, 'primary' | 'danger' | 'secondary'> = {
    danger: 'danger',
    warning: 'secondary',
    success: 'primary',
    info: 'primary',
  }
  return map[props.variant]
})

const iconComponent = computed(() => {
  const map: Record<ConfirmModalVariant, unknown> = {
    danger: LogOut,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  }
  return map[props.variant]
})

const iconBgClass = computed(() => ({
  danger: 'bg-red-100',
  warning: 'bg-yellow-100',
  success: 'bg-green-100',
  info: 'bg-blue-100',
})[props.variant])

const iconColorClass = computed(() => ({
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  success: 'text-green-600',
  info: 'text-blue-600',
})[props.variant])

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick()
      panelRef.value?.focus()
    }
  },
)

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>
