<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div class="text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Icon name="lucide:mail" class="h-8 w-8 text-yellow-600" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Vérifiez votre email
        </h2>
        <p class="mt-4 text-sm text-gray-600">
          Votre compte a été créé avec succès, mais vous devez vérifier votre adresse email avant d'accéder au tableau de bord.
        </p>
      </div>

      <div class="rounded-md border border-orange-200 bg-orange-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <Icon name="lucide:info" class="h-5 w-5 text-orange-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-orange-700">
              Un email de vérification a été envoyé à <strong>{{ userEmail }}</strong>. 
              Veuillez cliquer sur le lien dans l'email pour activer votre compte.
            </p>
          </div>
        </div>
      </div>

      <!-- success message -->
      <div
        v-if="successMessage"
        class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
      >
        {{ successMessage }}
      </div>

      <!-- error message -->
      <div
        v-if="errorMessage"
        class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {{ errorMessage }}
      </div>

      <div class="space-y-4">
        <button
          @click="resendVerification"
          :disabled="loading || countdown > 0"
          class="flex w-full justify-center rounded-md border border-orange-600 bg-white px-4 py-3 text-sm font-medium text-orange-600 shadow-sm transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="loading">Envoi en cours...</span>
          <span v-else-if="countdown > 0">Renvoyer dans {{ countdown }}s</span>
          <span v-else>Renvoyer l'email de vérification</span>
        </button>

        <button
          @click="logout"
          class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Se déconnecter
        </button>
      </div>

      <div class="text-center">
        <p class="text-xs text-gray-500">
          Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou cliquez sur "Renvoyer l'email de vérification".
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  middleware: "auth",
  layout: 'default',
});

const router = useRouter();
const authStore = useAuthStore();
const auth = useAuth();

const userEmail = ref(authStore.user?.email || "");
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const countdown = ref(0);
let countdownInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  // if user is already verified, redirect to dashboard
  if (authStore.user?.emailVerified) {
    const role = authStore.user.role;
    if (role === "CABINET_ADMIN") {
      router.push("/cabinet/dashboard");
    } else if (role === "STAFF") {
      router.push("/staff/dashboard");
    } else if (role === "PRACTITIONER") {
      router.push("/practitioner/dashboard");
    } else if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/patient/dashboard");
    }
  }
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

const startCountdown = () => {
  countdown.value = 60;
  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval);
    }
  }, 1000);
};

const resendVerification = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await auth.resendVerification({ email: userEmail.value });
    successMessage.value = "Email de vérification renvoyé avec succès !";
    startCountdown();
  } catch (error: unknown) {
    console.error("Resend verification error:", error);
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err?.data?.message ||
      err?.message ||
      "Une erreur est survenue. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  authStore.logout();
  router.push("/auth/login");
};
</script>
