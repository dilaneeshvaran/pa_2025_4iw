<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-1 text-2xl font-bold text-gray-900">
        Agendas des praticiens
      </h1>
      <p class="text-gray-600">
        Sélectionnez un praticien pour gérer son agenda
      </p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-gray-100"></div>
    </div>

    <div v-else-if="!practitioners.length" class="py-12 text-center">
      <Users class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <p class="text-gray-500">Aucun praticien assigné</p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="prac in practitioners"
        :key="prac.id"
        :to="`/staff/agenda/${prac.id}`"
        class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:bg-green-50"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
          >
            <span class="text-sm font-bold text-green-600">
              {{ prac.firstName[0] }}{{ prac.lastName[0] }}
            </span>
          </div>
          <div>
            <p class="font-semibold text-gray-900">
              {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
            </p>
            <p class="text-sm text-gray-500">
              {{ prac.specialties?.join(", ") || "-" }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm font-medium text-green-600">
          <Calendar class="h-4 w-4" />
          Voir l'agenda
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, Calendar } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "staff",
  middleware: "staff-only",
});

const authStore = useAuthStore();
const practitioners = ref<any[]>([]);
const loading = ref(true);

const fetchPractitioners = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any[];
    }>("/staff/practitioners");
    if (response.success) {
      practitioners.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching practitioners:", error);
  } finally {
    loading.value = false;
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
