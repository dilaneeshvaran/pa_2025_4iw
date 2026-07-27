<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm overflow-hidden">
    <div class="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60">
      <Lock class="h-4 w-4 text-green-600" />
      <p class="font-display font-bold text-sm text-gray-900 dark:text-gray-100">{{ title }}</p>
      <span class="ml-auto inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-300">
        <ShieldCheck class="h-3 w-3" /> Sécurisé
      </span>
    </div>

    <div v-if="done" class="p-4 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
      <CheckCircle2 class="h-4 w-4" /> {{ doneMessage }}
    </div>

    <form v-else class="p-4 space-y-2.5" @submit.prevent="submit">
      <!-- 2FA challenge -->
      <template v-if="stage === '2fa'">
        <p class="text-xs text-gray-600 dark:text-gray-300">Entrez le code de votre application d'authentification.</p>
        <input
          v-model="mfaCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="Code à 6 chiffres"
          class="w-full text-center tracking-[0.3em] font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </template>

      <template v-else>
        <!-- signup extra fields -->
        <template v-if="mode === 'signup'">
          <div class="grid grid-cols-2 gap-2">
            <input v-model="firstName" placeholder="Prénom" :class="inputClass" />
            <input v-model="lastName" placeholder="Nom" :class="inputClass" />
          </div>
          <input v-model="phone" type="tel" placeholder="Téléphone" :class="inputClass" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="dateOfBirth" type="date" :class="inputClass" aria-label="Date de naissance" />
            <select v-model="gender" :class="inputClass">
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
              <option value="PREFER_NOT_TO_SAY">Non précisé</option>
            </select>
          </div>
        </template>

        <input v-model="email" type="email" autocomplete="email" placeholder="Email" :class="inputClass" />

        <input
          v-if="mode !== 'reset'"
          v-model="password"
          type="password"
          :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
          placeholder="Mot de passe"
          :class="inputClass"
        />
      </template>

      <p v-if="errorMessage" class="text-[11px] text-red-600 dark:text-red-400">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        {{ submitLabel }}
      </button>

      <!-- mode switches -->
      <div class="flex items-center justify-between text-[11px] pt-0.5">
        <button v-if="mode === 'login'" type="button" class="text-gray-500 hover:text-green-600" @click="switchMode('reset')">Mot de passe oublié ?</button>
        <button
          type="button"
          class="text-gray-500 hover:text-green-600 ml-auto"
          @click="switchMode(mode === 'signup' ? 'login' : 'signup')"
        >
          {{ mode === "signup" ? "J'ai déjà un compte" : "Créer un compte patient" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Lock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useAuthStore } from "~/stores/auth";
import { useMedibotStore } from "~/stores/medibot";
import type { Gender } from "~/types/auth";

const props = defineProps<{ mode: "login" | "signup" | "reset" }>();

const auth = useAuth();
const authStore = useAuthStore();
const medibot = useMedibotStore();

const mode = ref<"login" | "signup" | "reset">(props.mode);
const stage = ref<"form" | "2fa">("form");

const email = ref("");
const password = ref("");
const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const dateOfBirth = ref("");
const gender = ref<Gender>("PREFER_NOT_TO_SAY");
const mfaCode = ref("");
const mfaToken = ref("");

const loading = ref(false);
const errorMessage = ref("");
const done = ref(false);
const doneMessage = ref("");

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40";

const title = computed(() =>
  stage.value === "2fa"
    ? "Vérification en deux étapes"
    : mode.value === "signup"
      ? "Créer un compte patient"
      : mode.value === "reset"
        ? "Réinitialiser le mot de passe"
        : "Se connecter",
);
const submitLabel = computed(() =>
  stage.value === "2fa"
    ? "Vérifier"
    : mode.value === "signup"
      ? "Créer mon compte"
      : mode.value === "reset"
        ? "Envoyer le lien"
        : "Se connecter et continuer",
);

function switchMode(m: "login" | "signup" | "reset") {
  mode.value = m;
  stage.value = "form";
  errorMessage.value = "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalizeSession(data: any) {
  const user = data.user;
  authStore.setAuth(user, data.tokens);
  if (user.role !== "PATIENT") {
    authStore.logout();
    errorMessage.value = "Medibot est réservé aux comptes patients.";
    return;
  }
  done.value = true;
  doneMessage.value = "Connecté ✓";
  medibot.onAuthenticated();
  if (!user.emailVerified) {
    medibot.pushSystemNote(
      "Vous êtes connecté, mais votre email n'est pas encore vérifié. Vérifiez votre boîte mail pour pouvoir réserver. 🌿",
    );
  } else {
    medibot.pushSystemNote("Parfait, vous êtes connecté 🌿 Reprenons où nous en étions.");
  }
}

async function submit() {
  loading.value = true;
  errorMessage.value = "";
  try {
    if (stage.value === "2fa") {
      const res = await auth.verify2fa({ mfaToken: mfaToken.value, code: mfaCode.value });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalizeSession((res as any).data);
      return;
    }

    if (mode.value === "reset") {
      await auth.requestPasswordReset({ email: email.value });
      done.value = true;
      doneMessage.value = "Si un compte existe, un email de réinitialisation a été envoyé.";
      return;
    }

    if (mode.value === "signup") {
      await auth.signup({
        email: email.value,
        password: password.value,
        firstName: firstName.value,
        lastName: lastName.value,
        phone: phone.value,
        dateOfBirth: dateOfBirth.value,
        gender: gender.value,
      });
      done.value = true;
      doneMessage.value = "Compte créé ! Vérifiez votre email, puis connectez-vous ici.";
      medibot.pushSystemNote(
        "Votre compte est créé 🌿 Un email de vérification vous a été envoyé. Une fois vérifié, dites-moi et nous reprendrons votre rendez-vous.",
      );
      return;
    }

    // login
    const res = await auth.login({ email: email.value, password: password.value });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (res as any).data;
    if (data?.requires2FA) {
      mfaToken.value = data.mfaToken || "";
      stage.value = "2fa";
      return;
    }
    finalizeSession(data);
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } };
    errorMessage.value = e.data?.message || "Une erreur est survenue. Vérifiez vos informations.";
  } finally {
    loading.value = false;
  }
}
</script>
