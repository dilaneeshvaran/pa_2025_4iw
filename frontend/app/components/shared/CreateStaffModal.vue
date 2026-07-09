<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Créer un compte personnel
        </h2>
        <button
          @click="$emit('close')"
          class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              for="staff-firstName"
            >
              Prénom *
            </label>
            <input
              id="staff-firstName"
              v-model="form.firstName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Prénom"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              for="staff-lastName"
            >
              Nom *
            </label>
            <input
              id="staff-lastName"
              v-model="form.lastName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Nom"
            />
          </div>
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            for="staff-email"
          >
            Email *
          </label>
          <input
            id="staff-email"
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="email@exemple.com"
          />
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            for="staff-phone"
          >
            Téléphone *
          </label>
          <input
            id="staff-phone"
            v-model="form.phone"
            type="tel"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="+225 XX XX XX XX"
          />
        </div>

        <div>
          <label
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            for="staff-position"
          >
            Poste / Fonction *
          </label>
          <input
            id="staff-position"
            v-model="form.position"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Ex: Secrétaire médicale, Assistant(e)..."
          />
        </div>

        <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>

        <div
          v-if="success"
          class="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-600 dark:text-green-400"
        >
          Compte créé avec succès ! Un email avec le mot de passe a été envoyé.
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {{ submitting ? "Création..." : "Créer le compte" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";

const props = defineProps<{
  isOpen: boolean;
  apiEndpoint: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [data: any];
}>();

const form = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
});

const submitting = ref(false);
const error = ref("");
const success = ref(false);

const resetForm = () => {
  form.value = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
  };
  error.value = "";
  success.value = false;
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) resetForm();
  },
);

const handleSubmit = async () => {
  submitting.value = true;
  error.value = "";
  success.value = false;

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>(props.apiEndpoint, {
      method: "POST",
      body: form.value,
    });

    if (response.success) {
      success.value = true;
      emit("success", response.data);
      setTimeout(() => {
        emit("close");
      }, 1500);
    }
  } catch (err: any) {
    error.value =
      err?.data?.message || err?.message || "Erreur lors de la création";
  } finally {
    submitting.value = false;
  }
};
</script>
