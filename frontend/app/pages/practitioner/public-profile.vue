<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Profil public</h1>
        <p class="text-gray-600">
          Gérez les informations visibles par vos patients
        </p>
      </div>
      <UiButton
        v-if="profile?.id"
        variant="outline"
        @click="navigateTo(`/practitioner/${profile.id}`)"
        title="Aperçu du profil tel qu'il sera vu par les patients"
      >
        <Eye class="mr-2 h-4 w-4" />
        Aperçu
      </UiButton>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-64 rounded bg-gray-200"></div>
    </div>
    <div v-else-if="profile" class="space-y-6">
      <UiCard class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Photo et informations de base
        </h3>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="col-span-1 flex items-center gap-4 md:col-span-2">
            <div
              class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100"
            >
              <img
                v-if="profile.photoUrl"
                :src="profile.photoUrl"
                class="h-full w-full object-cover"
              />
              <User v-else class="h-10 w-10 text-gray-400" />
            </div>
            <div>
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/jpeg, image/png, image/heic"
                @change="handleFileUpload"
              />
              <UiButton
                variant="outline"
                size="sm"
                class="mb-2"
                @click="triggerFileInput"
                >Modifier la photo</UiButton
              >
              <p class="text-xs text-gray-500">
                Formats acceptés: JPG, PNG, HEIC. Max 5MB.
              </p>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Titre</label
            >
            <input
              v-model="profile.title"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div></div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Prénom</label
            >
            <input
              v-model="profile.firstName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Nom</label
            >
            <input
              v-model="profile.lastName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Téléphone</label
            >
            <input
              v-model="profile.phone"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Biographie</h3>
        <textarea
          v-model="profile.bio"
          rows="4"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Présentez-vous à vos patients..."
        ></textarea>
      </UiCard>

      <UiCard class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Localisation</h3>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Adresse</label
            >
            <input
              v-model="profile.address"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Ville</label
            >
            <input
              v-model="profile.city"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Code postal</label
            >
            <input
              v-model="profile.postalCode"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Pays</label
            >
            <input
              v-model="profile.country"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Langues parlées
        </h3>
        <input
          v-model="languagesInput"
          type="text"
          placeholder="Ex: Français, Anglais, Espagnol"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <p class="mt-2 text-xs text-gray-500">
          Séparez les langues par des virgules.
        </p>
      </UiCard>

      <UiCard class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Formation et diplômes
        </h3>
        <div class="space-y-4">
          <div
            v-for="(qual, index) in profile.qualifications"
            :key="index"
            class="flex items-end gap-4"
          >
            <div class="flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-700"
                >Titre du diplôme</label
              >
              <input
                v-model="qual.title"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-700"
                >Établissement</label
              >
              <input
                v-model="qual.institution"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div class="w-24">
              <label class="mb-1 block text-xs font-medium text-gray-700"
                >Année</label
              >
              <input
                v-model="qual.yearObtained"
                type="number"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <UiButton
              variant="outline"
              class="mb-[2px] text-red-500 hover:bg-red-50"
              @click="removeQualification(Number(index))"
            >
              <Trash2 class="h-4 w-4" />
            </UiButton>
          </div>
          <UiButton variant="secondary" size="sm" @click="addQualification">
            <Plus class="mr-2 h-4 w-4" /> Ajouter un diplôme
          </UiButton>
        </div>
      </UiCard>

      <div class="flex justify-end pt-4">
        <UiButton variant="primary" :disabled="saving" @click="saveProfile">
          {{ saving ? "Enregistrement..." : "Enregistrer les modifications" }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { User, Plus, Trash2, Eye } from "lucide-vue-next";
import { useToast } from "vue-toastification";
import { isValidPhone } from "~/utils/validation";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const toast = useToast();

const profile = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const languagesInput = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const fetchProfile = async () => {
  loading.value = true;
  try {
    const res = await useAuthenticatedFetch<{ success: boolean; data: any }>(
      "/practitioner/dashboard/profile",
    );
    if (res.success) {
      profile.value = res.data;
      if (profile.value.languages) {
        languagesInput.value = profile.value.languages.join(", ");
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  if (!profile.value) return;
  saving.value = true;

  if (profile.value.phone && !isValidPhone(profile.value.phone)) {
    toast.error("Le numéro de téléphone contient des caractères non autorisés ou sa longueur est incorrecte (8-15 chiffres requis).");
    saving.value = false;
    return;
  }

  try {
    const langs = languagesInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const body = {
      firstName: profile.value.firstName,
      lastName: profile.value.lastName,
      title: profile.value.title,
      phone: profile.value.phone,
      bio: profile.value.bio,
      photoUrl: profile.value.photoUrl,
      address: profile.value.address,
      city: profile.value.city,
      postalCode: profile.value.postalCode,
      country: profile.value.country,
      languages: langs,
      qualifications: profile.value.qualifications.map((q: any) => ({
        title: q.title,
        institution: q.institution,
        yearObtained: Number(q.yearObtained),
      })),
    };
    await useAuthenticatedFetch("/practitioner/dashboard/profile", {
      method: "PATCH",
      body,
    });
    toast.success("Profil mis à jour avec succès");
  } catch (error) {
    console.error(error);
    toast.error("Erreur lors de la mise à jour");
  } finally {
    saving.value = false;
  }
};

const addQualification = () => {
  if (!profile.value.qualifications) profile.value.qualifications = [];
  profile.value.qualifications.push({
    title: "",
    institution: "",
    yearObtained: new Date().getFullYear(),
  });
};

const removeQualification = (index: number) => {
  profile.value.qualifications.splice(index, 1);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Le fichier dépasse la taille maximale (5 MB)");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    profile.value.photoUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

onMounted(() => {
  fetchProfile();
});
</script>
