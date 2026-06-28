<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Paramètres
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gérez vos informations personnelles
      </p>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-64 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- profile -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          <UserIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          Informations personnelles
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Prénom</label
            >
            <input
              v-model="profile.firstName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nom</label
            >
            <input
              v-model="profile.lastName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Téléphone</label
            >
            <input
              v-model="profile.phone"
              type="tel"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
        </div>

        <UiButton
          size="sm"
          class="mt-4"
          @click="updateProfile"
          :disabled="savingProfile"
        >
          {{ savingProfile ? "Enregistrement..." : "Mettre à jour le profil" }}
        </UiButton>

        <p
          v-if="profileMessage"
          class="mt-2 text-sm"
          :class="profileMessageClass"
        >
          {{ profileMessage }}
        </p>
      </div>

      <!-- email -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          <Mail class="h-5 w-5 text-green-600 dark:text-green-400" />
          Adresse email
        </h3>

        <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Email actuel : <strong>{{ profile.email }}</strong>
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouvel email</label
            >
            <input
              v-model="emailForm.newEmail"
              type="email"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Mot de passe actuel</label
            >
            <input
              v-model="emailForm.password"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
        </div>

        <UiButton
          size="sm"
          class="mt-4"
          @click="updateEmail"
          :disabled="savingEmail || !emailForm.newEmail || !emailForm.password"
        >
          {{ savingEmail ? "Mise à jour..." : "Changer l'email" }}
        </UiButton>

        <p v-if="emailMessage" class="mt-2 text-sm" :class="emailMessageClass">
          {{ emailMessage }}
        </p>
      </div>

      <!--password -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          <Shield class="h-5 w-5 text-green-600 dark:text-green-400" />
          Mot de passe
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Mot de passe actuel</label
            >
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Nouveau mot de passe</label
            >
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
        </div>

        <UiButton
          size="sm"
          class="mt-4"
          @click="updatePassword"
          :disabled="
            savingPassword ||
            !passwordForm.currentPassword ||
            !passwordForm.newPassword
          "
        >
          {{
            savingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"
          }}
        </UiButton>

        <p
          v-if="passwordMessage"
          class="mt-2 text-sm"
          :class="passwordMessageClass"
        >
          {{ passwordMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User as UserIcon, Mail, Shield } from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "staff",
  middleware: "staff-only",
});

const authStore = useAuthStore();
const loading = ref(true);

const profile = ref({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
});

const emailForm = ref({ newEmail: "", password: "" });
const passwordForm = ref({ currentPassword: "", newPassword: "" });

const savingProfile = ref(false);
const savingEmail = ref(false);
const savingPassword = ref(false);

const profileMessage = ref("");
const profileMessageClass = ref("");
const emailMessage = ref("");
const emailMessageClass = ref("");
const passwordMessage = ref("");
const passwordMessageClass = ref("");

function clearMessages() {
  profileMessage.value = "";
  emailMessage.value = "";
  passwordMessage.value = "";
}

async function fetchProfile() {
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/profile");
    if (res.success) {
      profile.value = res.data;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  } finally {
    loading.value = false;
  }
}

async function updateProfile() {
  savingProfile.value = true;
  profileMessage.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/profile", {
      method: "PATCH",
      body: {
        firstName: profile.value.firstName,
        lastName: profile.value.lastName,
        phone: profile.value.phone,
      },
    });
    if (res.success) {
      profile.value = res.data;
      profileMessage.value = "Profil mis à jour avec succès";
      profileMessageClass.value = "text-green-600 dark:text-green-400";
    }
  } catch (error: any) {
    profileMessage.value =
      error?.data?.message || "Erreur lors de la mise à jour";
    profileMessageClass.value = "text-red-600 dark:text-red-400";
  } finally {
    savingProfile.value = false;
  }
}

async function updateEmail() {
  savingEmail.value = true;
  emailMessage.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/email", {
      method: "PATCH",
      body: emailForm.value,
    });
    if (res.success) {
      profile.value.email = emailForm.value.newEmail;
      emailForm.value = { newEmail: "", password: "" };
      emailMessage.value = res.data.message || "Email mis à jour avec succès";
      emailMessageClass.value = "text-green-600 dark:text-green-400";
    }
  } catch (error: any) {
    emailMessage.value =
      error?.data?.message || "Erreur lors de la mise à jour de l'email";
    emailMessageClass.value = "text-red-600 dark:text-red-400";
  } finally {
    savingEmail.value = false;
  }
}

async function updatePassword() {
  savingPassword.value = true;
  passwordMessage.value = "";
  try {
    const res = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>("/staff/password", {
      method: "PATCH",
      body: passwordForm.value,
    });
    if (res.success) {
      passwordForm.value = { currentPassword: "", newPassword: "" };
      passwordMessage.value =
        res.data.message || "Mot de passe mis à jour avec succès";
      passwordMessageClass.value = "text-green-600 dark:text-green-400";
    }
  } catch (error: any) {
    passwordMessage.value =
      error?.data?.message || "Erreur lors de la mise à jour du mot de passe";
    passwordMessageClass.value = "text-red-600 dark:text-red-400";
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    fetchProfile();
  } else {
    loading.value = false;
  }
});
</script>
