<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Créer un compte patient
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Inscrivez-vous pour prendre rendez-vous avec nos praticiens
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <!-- error message -->
        <div
          v-if="errorMessage"
          class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {{ errorMessage }}
        </div>

        <!-- success message -->
        <div
          v-if="successMessage"
          class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {{ successMessage }}
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              for="firstName"
              class="block text-sm font-medium text-gray-700"
            >
              Prénom <span class="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              required
              autocomplete="given-name"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jean"
            />
          </div>

          <div>
            <label
              for="lastName"
              class="block text-sm font-medium text-gray-700"
            >
              Nom <span class="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              required
              autocomplete="family-name"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dupont"
            />
          </div>

          <div class="md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
            />
          </div>

          <div class="md:col-span-2">
            <label for="phone" class="block text-sm font-medium text-gray-700">
              Téléphone <span class="text-red-500">*</span>
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              required
              autocomplete="tel"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+225 01 02 03 04 05"
            />
          </div>

          <div>
            <label
              for="dateOfBirth"
              class="block text-sm font-medium text-gray-700"
            >
              Date de naissance <span class="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              v-model="formData.dateOfBirth"
              type="date"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="gender" class="block text-sm font-medium text-gray-700">
              Genre <span class="text-red-500">*</span>
            </label>
            <select
              id="gender"
              v-model="formData.gender"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Sélectionnez</option>
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
              <option value="PREFER_NOT_TO_SAY">Préfère ne pas dire</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              Mot de passe <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p class="mt-1 text-xs text-gray-500">
              Le mot de passe doit contenir au moins 8 caractères, une
              majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          <div class="md:col-span-2">
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700"
            >
              Confirmer le mot de passe <span class="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading">Inscription en cours...</span>
            <span v-else>S'inscrire</span>
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Vous avez déjà un compte ?
            <NuxtLink
              to="/auth/login"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Se connecter
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";

import type { Gender } from "~/types/auth";

definePageMeta({
  middleware: "guest",
});

const router = useRouter();
const auth = useAuth();

const formData = ref<{
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | "";
}>({
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  // validate password confirmation
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = "Les mots de passe ne correspondent pas.";
    loading.value = false;
    return;
  }

  try {
    // prepare data for API
    const { confirmPassword, ...registerData } = formData.value;

    if (registerData.gender === "") {
      errorMessage.value = "Veuillez sélectionner un genre.";
      return;
    }

    await auth.signup({
      ...registerData,
      gender: registerData.gender,
    });

    successMessage.value =
      "Inscription réussie ! Un email de vérification a été envoyé à votre adresse email.";

    // redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
};
</script>
