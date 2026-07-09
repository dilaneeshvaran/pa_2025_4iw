<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="handleClose"
  >
    <div
      ref="modalRef"
      class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-admin-title"
    >
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UserPlus class="h-5 w-5 text-[#D96F00] dark:text-orange-300" :stroke-width="1.75" />
          <h2 id="create-admin-title" class="text-lg font-bold text-gray-900 dark:text-gray-100">Créer un administrateur</h2>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
          aria-label="Fermer"
          @click="handleClose"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Créez un compte administrateur plateforme. L'adresse e-mail et le mot
        de passe fournis seront utilisés pour la connexion.
      </p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Email -->
        <div>
          <label
            for="admin-email"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Adresse e-mail <span class="text-red-500">*</span>
          </label>
          <input
            id="admin-email"
            ref="emailInputRef"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            :disabled="submitting"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="admin@medicalapp.ci"
          />
        </div>

        <!-- Password -->
        <div>
          <label
            for="admin-password"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Mot de passe <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              id="admin-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              :disabled="submitting"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 pr-10 text-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
          <p class="mt-1 text-xs text-gray-400">
            8 caractères min., avec majuscule, minuscule, chiffre et caractère
            spécial.
          </p>
        </div>

        <!-- Error message -->
        <div
          v-if="error"
          role="alert"
          aria-live="polite"
          class="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300"
        >
          {{ error }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-1">
          <button
            type="button"
            :disabled="submitting"
            class="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            @click="handleClose"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="flex items-center gap-2 rounded-lg bg-[#D96F00] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#BF6200] disabled:opacity-50"
          >
            <span
              v-if="submitting"
              class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
            {{ submitting ? 'Création...' : 'Créer le compte' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, UserPlus, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const form = ref({ email: '', password: '' })
const submitting = ref(false)
const error = ref('')
const showPassword = ref(false)
const emailInputRef = ref<HTMLInputElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)

function resetForm() {
  form.value = { email: '', password: '' }
  error.value = ''
  showPassword.value = false
}

watch(
  () => props.isOpen,
  async (val) => {
    if (val) {
      resetForm()
      await nextTick()
      emailInputRef.value?.focus()
    }
  },
)

function handleClose() {
  if (!submitting.value) {
    emit('close')
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    handleClose()
    return
  }

  if (e.key === 'Tab' && modalRef.value) {
    const focusableSelectors = 'button:not([disabled]), input:not([disabled])'
    const focusables = Array.from(modalRef.value.querySelectorAll(focusableSelectors)) as HTMLElement[]
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (e.shiftKey) {
      if (active === first) {
        last.focus()
        e.preventDefault()
      }
    } else {
      if (active === last) {
        first.focus()
        e.preventDefault()
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

async function handleSubmit() {
  submitting.value = true
  error.value = ''

  try {
    await useAuthenticatedFetch('/admin/users', {
      method: 'POST',
      body: { email: form.value.email, password: form.value.password },
    })
    emit('success')
    emit('close')
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      "Erreur lors de la création de l'administrateur"
  } finally {
    submitting.value = false
  }
}
</script>

