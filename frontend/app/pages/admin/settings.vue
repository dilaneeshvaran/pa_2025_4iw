<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold text-gray-900">Paramètres</h1>
    <p class="mb-6 text-gray-600">
      Configuration générale de la plateforme.
    </p>

    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else-if="fetchError" class="rounded-lg bg-red-50 p-4 text-red-800">
      {{ fetchError }}
    </div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <section
        v-for="group in groups"
        :key="group.name"
        class="rounded-xl border border-gray-200 bg-white p-5"
      >
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          {{ group.name }}
        </h2>
        <div class="space-y-5">
          <div
            v-for="s in group.items"
            :key="s.key"
            class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
          >
            <div class="md:max-w-md">
              <p class="text-sm font-medium text-gray-800">{{ s.label }}</p>
              <p v-if="s.description" class="text-xs text-gray-500">
                {{ s.description }}
              </p>
            </div>

            <!-- number -->
            <input
              v-if="s.type === 'number'"
              v-model.number="form[s.key]"
              type="number"
              :min="s.min"
              :max="s.max"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 md:w-40"
            />

            <!-- boolean -->
            <button
              v-else-if="s.type === 'boolean'"
              type="button"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="form[s.key] ? 'bg-orange-500' : 'bg-gray-300'"
              @click="form[s.key] = !form[s.key]"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="form[s.key] ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>

            <!-- stringList -->
            <input
              v-else-if="s.type === 'stringList'"
              v-model="listText[s.key]"
              type="text"
              placeholder="Séparés par des virgules"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 md:w-80"
            />
          </div>
        </div>
      </section>

      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          :disabled="saving"
          @click="loadSettings"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {{ saving ? "Enregistrement..." : "Enregistrer" }}
        </button>
      </div>
    </form>

    <!-- toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 rounded-lg px-6 py-3 text-white shadow-lg"
      :class="toastType === 'error' ? 'bg-red-600' : 'bg-green-600'"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
});

type SettingType = "number" | "boolean" | "stringList";

interface SettingDto {
  key: string;
  label: string;
  description?: string;
  group: string;
  type: SettingType;
  value: number | boolean | string[];
  min?: number;
  max?: number;
}

const settings = ref<SettingDto[]>([]);
const form = reactive<Record<string, number | boolean | string[]>>({});
const listText = reactive<Record<string, string>>({});

const loading = ref(true);
const saving = ref(false);
const fetchError = ref("");

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const groups = computed(() => {
  const map = new Map<string, SettingDto[]>();
  for (const s of settings.value) {
    if (!map.has(s.group)) map.set(s.group, []);
    map.get(s.group)!.push(s);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
});

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function loadSettings() {
  loading.value = true;
  fetchError.value = "";
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: SettingDto[];
    }>("/admin/settings");
    settings.value = response.data;
    for (const s of response.data) {
      if (s.type === "stringList") {
        listText[s.key] = (s.value as string[]).join(", ");
      } else {
        form[s.key] = s.value;
      }
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    fetchError.value =
      err?.data?.message || "Erreur lors du chargement des paramètres";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const payload = settings.value.map((s) => {
      if (s.type === "stringList") {
        const list = (listText[s.key] || "")
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        return { key: s.key, value: list };
      }
      return { key: s.key, value: form[s.key] };
    });

    await useAuthenticatedFetch("/admin/settings", {
      method: "PUT",
      body: { settings: payload },
    });
    showToast("Paramètres enregistrés");
    await loadSettings();
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    showToast(
      err?.data?.message || "Erreur lors de l'enregistrement",
      "error",
    );
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>
