<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Praticiens</h1>
        <p class="text-gray-600">Gérez les praticiens de votre cabinet</p>
      </div>
      <button
        @click="showInviteModal = true"
        class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <Mail class="h-4 w-4" />
        Inviter un praticien
      </button>
    </div>

    <!-- practitioners list -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div v-if="loading" class="animate-pulse space-y-3 p-6">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-gray-100"></div>
      </div>

      <div v-else-if="!practitioners.length" class="py-12 text-center">
        <Users class="mx-auto mb-3 h-16 w-16 text-gray-300" />
        <p class="text-lg text-gray-500">Aucun praticien dans votre cabinet</p>
        <p class="mt-1 text-sm text-gray-400">
          Invitez des praticiens vérifiés pour les ajouter
        </p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="prac in practitioners"
          :key="prac.id"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100"
            >
              <span class="text-sm font-bold text-indigo-600">
                {{ prac.firstName[0] }}{{ prac.lastName[0] }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900">
                {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
              </p>
              <p class="text-sm text-gray-500">
                {{ prac.email }} · {{ prac.phone }}
              </p>
              <div class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="spec in prac.specialties"
                  :key="spec"
                  class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  {{ spec }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                prac.licenseVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700',
              ]"
            >
              {{ prac.licenseVerified ? "Vérifié" : "Non vérifié" }}
            </span>
            <button
              @click="removePractitioner(prac.id)"
              class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Retirer du cabinet"
            >
              <UserMinus class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- invite modal -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showInviteModal = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Inviter un praticien</h2>
          <button
            @click="showInviteModal = false"
            class="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="handleInvite" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Email du praticien vérifié
            </label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="praticien@email.com"
            />
          </div>

          <p class="text-xs text-gray-500">
            Le praticien doit avoir un compte vérifié sur MediCôte pour être
            invité.
          </p>

          <div
            v-if="inviteError"
            class="rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {{ inviteError }}
          </div>

          <div
            v-if="inviteSuccess"
            class="rounded-lg bg-green-50 p-3 text-sm text-green-600"
          >
            Invitation envoyée avec succès !
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="showInviteModal = false"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="inviting"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ inviting ? "Envoi..." : "Envoyer l'invitation" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, Mail, UserMinus, X } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "cabinet",
  middleware: "cabinet-admin-only",
});

const authStore = useAuthStore();

const practitioners = ref<any[]>([]);
const loading = ref(true);
const showInviteModal = ref(false);
const inviteEmail = ref("");
const inviting = ref(false);
const inviteError = ref("");
const inviteSuccess = ref(false);

const fetchPractitioners = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any[];
    }>("/cabinet/practitioners");
    if (response.success) {
      practitioners.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching practitioners:", error);
  } finally {
    loading.value = false;
  }
};

const handleInvite = async () => {
  inviting.value = true;
  inviteError.value = "";
  inviteSuccess.value = false;

  try {
    const response = await useAuthenticatedFetch<{ success: boolean }>(
      "/cabinet/invite-practitioner",
      {
        method: "POST",
        body: { email: inviteEmail.value },
      },
    );
    if (response.success) {
      inviteSuccess.value = true;
      inviteEmail.value = "";
      setTimeout(() => {
        showInviteModal.value = false;
        inviteSuccess.value = false;
      }, 1500);
    }
  } catch (err: any) {
    inviteError.value =
      err?.data?.message || "Erreur lors de l'envoi de l'invitation";
  } finally {
    inviting.value = false;
  }
};

const removePractitioner = async (id: string) => {
  if (!confirm("Êtes-vous sûr de vouloir retirer ce praticien du cabinet ?")) {
    return;
  }

  try {
    await useAuthenticatedFetch(`/cabinet/practitioners/${id}`, {
      method: "DELETE",
    });
    practitioners.value = practitioners.value.filter((p) => p.id !== id);
  } catch (error) {
    console.error("Error removing practitioner:", error);
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchPractitioners();
  } else {
    loading.value = false;
  }
});
</script>
