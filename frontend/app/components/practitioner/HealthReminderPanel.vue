<template>
  <section class="border-b border-gray-200 p-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
        Rappels santé
      </h3>
      <UiButton
        variant="outline"
        size="sm"
        :disabled="!props.patientId"
        @click="showForm = !showForm"
      >
        <Plus class="mr-1.5 h-4 w-4" />
        {{ showForm ? "Fermer" : "Nouveau rappel" }}
      </UiButton>
    </div>

    <p class="sr-only" aria-live="polite">{{ statusMessage }}</p>

    <div v-if="loading" class="space-y-2">
      <div
        v-for="i in 2"
        :key="i"
        class="h-16 animate-pulse rounded-lg bg-gray-100"
      />
    </div>

    <div v-else-if="reminders.length === 0" class="rounded-lg bg-gray-50 p-4">
      <div class="flex items-center gap-3 text-sm text-gray-500">
        <Bell class="h-5 w-5 text-gray-400" />
        <span>Aucun rappel santé programmé</span>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="reminder in reminders"
        :key="reminder.id"
        class="rounded-lg border border-gray-200 bg-gray-50 p-3"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <p class="text-sm font-medium text-gray-900">
            {{ reminder.message }}
          </p>
          <UiBadge :variant="getHealthReminderStatusVariant(reminder.status)">
            {{ getHealthReminderStatusLabel(reminder.status) }}
          </UiBadge>
        </div>
        <p class="text-xs text-gray-600">{{ reminder.scheduleLabel }}</p>
        <p class="mt-1 text-xs text-gray-500">
          Du {{ formatDate(reminder.startDate) }} au
          {{ formatDate(reminder.endDate) }}
        </p>
        <div
          v-if="reminder.status === 'ACTIVE'"
          class="mt-3 flex items-center justify-between gap-3"
        >
          <p class="text-xs text-green-700">
            Prochain envoi :
            {{
              reminder.nextOccurrence
                ? formatDateTime(reminder.nextOccurrence)
                : "à venir"
            }}
          </p>
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            :disabled="cancellingId === reminder.id"
            @click="cancelReminder(reminder.id)"
          >
            <XCircle class="h-4 w-4" />
            Arrêter
          </button>
        </div>
      </div>
    </div>

    <form
      v-if="showForm"
      class="mt-4 space-y-4 rounded-lg border border-orange-100 bg-orange-50/40 p-4"
      @submit.prevent="submitReminder"
    >
      <div>
        <label
          :for="`${fieldPrefix}-message`"
          class="mb-1 block text-sm font-medium text-gray-700"
        >
          Message personnalisé
        </label>
        <textarea
          :id="`${fieldPrefix}-message`"
          v-model="form.message"
          rows="3"
          required
          maxlength="500"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            :for="`${fieldPrefix}-start-date`"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Date de début
          </label>
          <input
            :id="`${fieldPrefix}-start-date`"
            v-model="form.startDate"
            type="date"
            :min="today"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Durée
          </label>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2">
            <input
              v-model.number="form.durationValue"
              type="number"
              min="1"
              max="365"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              aria-label="Valeur de la durée"
            />
            <select
              v-model="form.durationUnit"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              aria-label="Unité de durée"
            >
              <option value="DAY">jour(s)</option>
              <option value="WEEK">semaine(s)</option>
              <option value="MONTH">mois</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">Horaires</span>
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            :disabled="form.times.length >= 6"
            @click="addTime"
          >
            <Plus class="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div class="grid gap-2 sm:grid-cols-3">
          <div v-for="(_, index) in form.times" :key="index" class="flex gap-2">
            <input
              v-model="form.times[index]"
              type="time"
              required
              class="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              :aria-label="`Horaire ${index + 1}`"
            />
            <button
              v-if="form.times.length > 1"
              type="button"
              class="inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              :aria-label="`Supprimer l'horaire ${index + 1}`"
              @click="removeTime(index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label
          :for="`${fieldPrefix}-recurrence`"
          class="mb-1 block text-sm font-medium text-gray-700"
        >
          Périodicité
        </label>
        <select
          :id="`${fieldPrefix}-recurrence`"
          v-model="form.recurrenceType"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="INTERVAL">Tous les X jours / semaines</option>
          <option value="WEEKDAYS">Certains jours de la semaine</option>
        </select>
      </div>

      <div
        v-if="form.recurrenceType === 'INTERVAL'"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div>
          <label
            :for="`${fieldPrefix}-interval-value`"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Toutes les
          </label>
          <input
            :id="`${fieldPrefix}-interval-value`"
            v-model.number="form.intervalValue"
            type="number"
            min="1"
            max="30"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label
            :for="`${fieldPrefix}-interval-unit`"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Unité
          </label>
          <select
            :id="`${fieldPrefix}-interval-unit`"
            v-model="form.intervalUnit"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="DAY">jour(s)</option>
            <option value="WEEK">semaine(s)</option>
          </select>
        </div>
      </div>

      <fieldset v-else>
        <legend class="mb-2 text-sm font-medium text-gray-700">
          Jours de la semaine
        </legend>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label
            v-for="day in daysOfWeek"
            :key="day.value"
            class="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <input
              v-model="form.daysOfWeek"
              type="checkbox"
              :value="day.value"
              class="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            {{ day.label }}
          </label>
        </div>
      </fieldset>

      <p v-if="formError" class="text-sm text-red-600">
        {{ formError }}
      </p>

      <div class="flex justify-end gap-3">
        <UiButton
          type="button"
          variant="ghost"
          size="sm"
          :disabled="submitting"
          @click="showForm = false"
        >
          Annuler
        </UiButton>
        <UiButton type="submit" size="sm" :disabled="submitting">
          <BellPlus class="mr-1.5 h-4 w-4" />
          {{ submitting ? "Création..." : "Créer le rappel" }}
        </UiButton>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import {
  Bell,
  BellPlus,
  Plus,
  Trash2,
  XCircle,
} from "lucide-vue-next";
import type {
  CreateHealthReminderRequest,
  HealthReminderDayOfWeek,
  HealthReminderDurationUnit,
  HealthReminderIntervalUnit,
  HealthReminderResponse,
} from "@medicote/shared";
import {
  getHealthReminderStatusLabel,
  getHealthReminderStatusVariant,
} from "~/utils/healthReminders";

const props = defineProps<{
  patientId: string | null;
}>();

const reminders = ref<HealthReminderResponse[]>([]);
const loading = ref(false);
const showForm = ref(false);
const submitting = ref(false);
const cancellingId = ref<string | null>(null);
const formError = ref("");
const statusMessage = ref("");

const today = new Date().toISOString().slice(0, 10);
const fieldPrefix = computed(() => `health-reminder-${props.patientId || "new"}`);

const daysOfWeek: { value: HealthReminderDayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" },
];

const form = reactive({
  message: "",
  times: ["08:00"],
  startDate: today,
  durationValue: 2,
  durationUnit: "WEEK" as HealthReminderDurationUnit,
  recurrenceType: "INTERVAL" as "INTERVAL" | "WEEKDAYS",
  intervalValue: 1,
  intervalUnit: "DAY" as HealthReminderIntervalUnit,
  daysOfWeek: ["MONDAY", "FRIDAY"] as HealthReminderDayOfWeek[],
});

watch(
  () => props.patientId,
  async (patientId) => {
    reminders.value = [];
    showForm.value = false;
    resetForm();
    if (patientId) {
      await fetchReminders();
    }
  },
  { immediate: true },
);

const fetchReminders = async () => {
  if (!props.patientId) return;
  loading.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: HealthReminderResponse[];
    }>(`/health-reminders/practitioner/patients/${props.patientId}`);

    if (response.success) {
      reminders.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching health reminders:", error);
  } finally {
    loading.value = false;
  }
};

const submitReminder = async () => {
  if (!props.patientId) return;
  formError.value = "";

  const times = form.times.filter(Boolean).sort();
  if (new Set(times).size !== times.length) {
    formError.value = "Un horaire ne peut être ajouté qu'une seule fois.";
    return;
  }

  if (form.recurrenceType === "WEEKDAYS" && form.daysOfWeek.length === 0) {
    formError.value = "Sélectionnez au moins un jour de la semaine.";
    return;
  }

  const body: CreateHealthReminderRequest = {
    message: form.message.trim(),
    times,
    startDate: form.startDate,
    durationValue: Number(form.durationValue),
    durationUnit: form.durationUnit,
    recurrence:
      form.recurrenceType === "INTERVAL"
        ? {
            type: "INTERVAL",
            intervalValue: Number(form.intervalValue),
            intervalUnit: form.intervalUnit,
          }
        : {
            type: "WEEKDAYS",
            daysOfWeek: form.daysOfWeek,
          },
  };

  submitting.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: HealthReminderResponse;
      message?: string;
    }>(`/health-reminders/practitioner/patients/${props.patientId}`, {
      method: "POST",
      body,
    });

    if (response.success) {
      reminders.value = [response.data, ...reminders.value];
      resetForm();
      showForm.value = false;
      statusMessage.value = "Rappel santé créé.";
    }
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } };
    formError.value =
      fetchError.data?.message || "Impossible de créer le rappel santé.";
  } finally {
    submitting.value = false;
  }
};

const cancelReminder = async (reminderId: string) => {
  cancellingId.value = reminderId;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: HealthReminderResponse;
    }>(`/health-reminders/practitioner/${reminderId}/cancel`, {
      method: "PATCH",
    });

    if (response.success) {
      reminders.value = reminders.value.map((reminder) =>
        reminder.id === reminderId ? response.data : reminder,
      );
      statusMessage.value = "Rappel santé arrêté.";
    }
  } catch (error) {
    console.error("Error cancelling health reminder:", error);
    statusMessage.value = "Impossible d'arrêter le rappel santé.";
  } finally {
    cancellingId.value = null;
  }
};

const addTime = () => {
  if (form.times.length < 6) {
    form.times.push("08:00");
  }
};

const removeTime = (index: number) => {
  form.times.splice(index, 1);
};

const resetForm = () => {
  form.message = "";
  form.times = ["08:00"];
  form.startDate = today;
  form.durationValue = 2;
  form.durationUnit = "WEEK";
  form.recurrenceType = "INTERVAL";
  form.intervalValue = 1;
  form.intervalUnit = "DAY";
  form.daysOfWeek = ["MONDAY", "FRIDAY"];
  formError.value = "";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

</script>
