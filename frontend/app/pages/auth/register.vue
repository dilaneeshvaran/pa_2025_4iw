<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl space-y-8 rounded-lg bg-white dark:bg-gray-900 p-8 shadow-lg">
      <div>
        <h1 class="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
          Créer un compte patient
        </h1>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Inscrivez-vous pour prendre rendez-vous avec nos praticiens
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <!-- error message -->
        <div
          v-if="errorMessage" role="alert"
          class="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <!-- success message -->
        <div
          v-if="successMessage" role="status"
          class="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-200"
        >
          {{ successMessage }}
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              for="firstName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Prénom <span class="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              required
              autocomplete="given-name"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.firstName
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="Jean"
              :aria-invalid="!!fieldErrors.firstName"
              aria-describedby="firstName-error"
            />
            <p
              v-if="fieldErrors.firstName"
              id="firstName-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.firstName }}
            </p>
          </div>

          <div>
            <label
              for="lastName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nom <span class="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              required
              autocomplete="family-name"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.lastName
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="Dupont"
              :aria-invalid="!!fieldErrors.lastName"
              aria-describedby="lastName-error"
            />
            <p
              v-if="fieldErrors.lastName"
              id="lastName-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.lastName }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.email
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="votre@email.com"
              :aria-invalid="!!fieldErrors.email"
              aria-describedby="email-error"
            />
            <p
              v-if="fieldErrors.email"
              id="email-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.email }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Téléphone <span class="text-red-500">*</span>
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              required
              autocomplete="tel"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.phone
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="+225 01 02 03 04 05"
              :aria-invalid="!!fieldErrors.phone"
              aria-describedby="phone-error"
            />
            <p
              v-if="fieldErrors.phone"
              id="phone-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.phone }}
            </p>
          </div>

          <div>
            <label
              for="dateOfBirth"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Date de naissance <span class="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              v-model="formData.dateOfBirth"
              type="date"
              required
              :min="minDate"
              :max="maxDate"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.dateOfBirth
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              :aria-invalid="!!fieldErrors.dateOfBirth"
              aria-describedby="dateOfBirth-error"
            />
            <p
              v-if="fieldErrors.dateOfBirth"
              id="dateOfBirth-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.dateOfBirth }}
            </p>
          </div>

          <div>
            <label for="gender" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Genre <span class="text-red-500">*</span>
            </label>
            <select
              id="gender"
              v-model="formData.gender"
              required
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.gender
                  ? 'border-red-300 text-red-900 dark:text-red-200 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              :aria-invalid="!!fieldErrors.gender"
              aria-describedby="gender-error"
            >
              <option value="" disabled>Sélectionnez</option>
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
              <option value="PREFER_NOT_TO_SAY">Préfère ne pas dire</option>
            </select>
            <p
              v-if="fieldErrors.gender"
              id="gender-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.gender }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mot de passe <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              autocomplete="new-password"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.password
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="••••••••"
              :aria-invalid="!!fieldErrors.password"
              aria-describedby="password-error"
            />
            <p
              v-if="fieldErrors.password"
              id="password-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400 font-medium"
            >
              {{ fieldErrors.password }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Le mot de passe doit contenir au moins 8 caractères, une
              majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          <div class="md:col-span-2">
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmer le mot de passe <span class="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              :class="[
                'mt-1 block w-full rounded-md border px-3 py-2 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
                fieldErrors.confirmPassword
                  ? 'border-red-300 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500'
              ]"
              placeholder="••••••••"
              :aria-invalid="!!fieldErrors.confirmPassword"
              aria-describedby="confirmPassword-error"
            />
            <p
              v-if="fieldErrors.confirmPassword"
              id="confirmPassword-error"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.confirmPassword }}
            </p>
          </div>

          <div class="md:col-span-2 flex items-start mt-2">
            <div class="flex h-5 items-center">
              <input
                id="agreeTerms"
                v-model="agreeTerms"
                type="checkbox"
                required
                class="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-orange-600 dark:text-orange-400 focus:ring-orange-500"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="agreeTerms" class="font-medium text-gray-700 dark:text-gray-300">
                J'accepte les
                <NuxtLink
                  to="/legal/terms"
                  target="_blank"
                  class="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 hover:underline"
                >
                  conditions générales d'utilisation
                </NuxtLink>
                et la
                <NuxtLink
                  to="/legal/privacy"
                  target="_blank"
                  class="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 hover:underline"
                >
                  politique de confidentialité
                </NuxtLink>
                <span class="text-red-500">*</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-md border border-transparent bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading">Inscription en cours...</span>
            <span v-else>S'inscrire</span>
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Vous avez déjà un compte ?
            <NuxtLink
              :to="`/auth/login${route.query.redirect ? '?redirect=' + encodeURIComponent(route.query.redirect as string) : ''}`"
              class="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500"
            >
              Se connecter
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>

    <!-- redirection idicator -->
    <UiRedirectingOverlay
      :show="showRedirecting"
      title="Inscription réussie !"
      message="Nous vous redirigeons vers la page de connexion..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import { isValidPhone, isValidBirthDate } from "~/utils/validation";

import type { Gender } from "~/types/auth";

definePageMeta({
  middleware: "guest",
  layout: "default",
});

const router = useRouter();
const route = useRoute();
const auth = useAuth();

const maxDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().split("T")[0];
});

const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0];
});

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
const agreeTerms = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showRedirecting = ref(false);
const fieldErrors = ref<Record<string, string>>({});

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  fieldErrors.value = {};

  let hasErrors = false;

  // validate password confirmation
  if (formData.value.password !== formData.value.confirmPassword) {
    fieldErrors.value.confirmPassword = "Les mots de passe ne correspondent pas.";
    hasErrors = true;
  }

  if (!formData.value.dateOfBirth) {
    fieldErrors.value.dateOfBirth = "La date de naissance est requise.";
    hasErrors = true;
  } else if (!isValidBirthDate(formData.value.dateOfBirth)) {
    fieldErrors.value.dateOfBirth = "La date de naissance doit être dans le passé.";
    hasErrors = true;
  }

  if (!formData.value.phone) {
    fieldErrors.value.phone = "Le numéro de téléphone est requis.";
    hasErrors = true;
  } else if (!isValidPhone(formData.value.phone)) {
    fieldErrors.value.phone = "Le numéro de téléphone contient des caractères non autorisés ou sa longueur est incorrecte (8-15 chiffres requis).";
    hasErrors = true;
  }

  if (formData.value.gender === "") {
    fieldErrors.value.gender = "Veuillez sélectionner un genre.";
    hasErrors = true;
  }

  if (!agreeTerms.value) {
    errorMessage.value = "Veuillez accepter les conditions générales d'utilisation et la politique de confidentialité.";
    hasErrors = true;
  }

  if (hasErrors) {
    if (!errorMessage.value) {
      errorMessage.value = "Veuillez corriger les erreurs de validation ci-dessous.";
    }
    loading.value = false;
    return;
  }

  try {
    // prepare data for API
    const { confirmPassword, ...registerData } = formData.value;

    await auth.signup({
      ...registerData,
      gender: registerData.gender as Gender,
    });

    successMessage.value =
      "Inscription réussie ! Un email de vérification a été envoyé à votre adresse email.";

    // Show redirection popup
    showRedirecting.value = true;

    // redirect to login with original redirect url after 3 seconds
    const redirectParam = route.query.redirect
      ? `?redirect=${encodeURIComponent(route.query.redirect as string)}`
      : "";
    setTimeout(() => {
      router.push(`/auth/login${redirectParam}`);
    }, 3000);
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const err = error as {
      data?: {
        message?: string;
        errors?: Array<{
          instancePath?: string;
          message?: string;
          keyword?: string;
          params?: any;
        }>;
      };
      message?: string;
    };

    if (err?.data?.errors && Array.isArray(err.data.errors)) {
      err.data.errors.forEach((validationError) => {
        // instancePath is like "/email" -> strip the slash to get "email"
        const path = validationError.instancePath?.replace(/^\//, "") || "";
        if (path) {
          fieldErrors.value[path] = validationError.message || "Valeur invalide";
        }
      });
      errorMessage.value = "Veuillez corriger les erreurs de validation ci-dessous.";
    } else {
      const msg = err?.data?.message || err?.message || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
      errorMessage.value = msg;
      if (msg.includes("email existe déjà")) {
        fieldErrors.value.email = "Un utilisateur avec cet email existe déjà.";
      }
    }
  } finally {
    loading.value = false;
  }
};
</script>
