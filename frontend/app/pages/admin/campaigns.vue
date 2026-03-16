<template>
  <div class="space-y-6">
    <div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Messages groupés</h1>
      <p class="text-gray-600">
        Envoyez des messages à un groupe de destinataires
      </p>
    </div>

    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          :class="[
            'border-b-2 pb-3 text-sm font-medium transition-colors',
            activeTab === 'compose'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = 'compose'"
        >
          <Send class="mr-2 inline h-4 w-4" />
          Nouveau message
        </button>
        <button
          :class="[
            'border-b-2 pb-3 text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="
            activeTab = 'history';
            fetchHistory();
          "
        >
          <Clock class="mr-2 inline h-4 w-4" />
          Historique des envois
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'compose'" class="space-y-6">
      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <Users class="mr-2 inline h-5 w-5 text-blue-600" />
          Destinataires
        </h3>

        <div class="space-y-3">
          <label
            v-for="option in recipientOptions"
            :key="option.value"
            :class="[
              'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
              targetType === option.value
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:bg-gray-50',
            ]"
          >
            <input
              v-model="targetType"
              type="radio"
              :value="option.value"
              class="h-4 w-4 text-red-600 focus:ring-red-500"
            />
            <div class="flex-1">
              <span class="font-medium text-gray-900">{{ option.label }}</span>
              <span
                v-if="option.count !== null"
                class="ml-2 text-sm text-gray-500"
              >
                ({{ option.count }} destinataire{{
                  (option.count ?? 0) > 1 ? "s" : ""
                }})
              </span>
            </div>
            <component :is="option.icon" class="h-5 w-5 text-gray-400" />
          </label>
        </div>

        <div
          v-if="targetType === 'CUSTOM'"
          class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h4 class="mb-3 text-sm font-semibold text-gray-700">
            <Filter class="mr-1 inline h-4 w-4" />
            Filtres avancés
          </h4>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Type</label
              >
              <select
                v-model="customUserType"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Tous</option>
                <option value="PATIENT">Patients</option>
                <option value="PRACTITIONER">Professionnels</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Localisation</label
              >
              <select
                v-model="customLocation"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Toutes les villes</option>
                <option
                  v-for="city in availableCities"
                  :key="city"
                  :value="city"
                >
                  {{ city }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Inscrits entre</label
              >
              <div class="flex items-center gap-2">
                <input
                  v-model="customDateFrom"
                  type="date"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                />
                <span class="text-gray-400">-</span>
                <input
                  v-model="customDateTo"
                  type="date"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <UsersRound class="h-4 w-4" />
            <span v-if="customCountLoading">Calcul en cours…</span>
            <span v-else>
              {{ customRecipientCount }} destinataire{{
                customRecipientCount > 1 ? "s" : ""
              }}
              correspondant{{ customRecipientCount > 1 ? "s" : "" }}
            </span>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <Mail class="mr-2 inline h-5 w-5 text-blue-600" />
          Contenu du message
        </h3>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Objet</label
            >
            <input
              v-model="messageTitle"
              type="text"
              placeholder="Objet du message"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Type</label
            >
            <select
              v-model="messageType"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-red-500 focus:ring-red-500"
            >
              <option value="INFO">Information</option>
              <option value="WARNING">Avertissement</option>
              <option value="URGENT">Urgent</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >Contenu</label
            >
            <textarea
              v-model="messageContent"
              rows="6"
              placeholder="Rédigez votre message ici…"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <Settings class="mr-2 inline h-5 w-5 text-blue-600" />
          Options de diffusion
        </h3>

        <div class="grid gap-6 sm:grid-cols-2">
          <!-- canaux -->
          <div>
            <h4 class="mb-3 text-sm font-semibold text-gray-700">Canaux</h4>
            <div class="space-y-2">
              <label class="flex items-center gap-3">
                <input
                  v-model="channelEmail"
                  type="checkbox"
                  class="h-4 w-4 rounded text-red-600 focus:ring-red-500"
                />
                <Mail class="h-4 w-4 text-gray-500" />
                <span class="text-sm text-gray-700">Email</span>
              </label>
              <label
                class="flex cursor-not-allowed items-center gap-3 opacity-50"
              >
                <input
                  type="checkbox"
                  disabled
                  class="h-4 w-4 rounded text-gray-400"
                />
                <Smartphone class="h-4 w-4 text-gray-400" />
                <span class="text-sm text-gray-400"
                  >SMS
                  <span class="text-xs">(bientôt disponible)</span>
                </span>
              </label>
            </div>
          </div>

          <!-- envoi -->
          <div>
            <h4 class="mb-3 text-sm font-semibold text-gray-700">Envoi</h4>
            <div class="space-y-2">
              <label class="flex items-center gap-3">
                <input
                  v-model="sendMode"
                  type="radio"
                  value="immediate"
                  class="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <Zap class="h-4 w-4 text-gray-500" />
                <span class="text-sm text-gray-700">Envoi immédiat</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  v-model="sendMode"
                  type="radio"
                  value="scheduled"
                  class="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <CalendarClock class="h-4 w-4 text-gray-500" />
                <span class="text-sm text-gray-700">Envoi programmé</span>
              </label>
              <div v-if="sendMode === 'scheduled'" class="ml-7 mt-2">
                <input
                  v-model="scheduledAt"
                  type="datetime-local"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          <BarChart3 class="mr-2 inline h-5 w-5 text-blue-600" />
          Résumé
        </h3>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-lg bg-blue-50 p-4 text-center">
            <p class="text-2xl font-bold text-blue-700">
              {{ summaryRecipientCount }}
            </p>
            <p class="text-sm text-blue-600">Destinataires</p>
          </div>
          <div class="rounded-lg bg-green-50 p-4 text-center">
            <p class="text-2xl font-bold text-green-700">
              {{ summaryChannels }}
            </p>
            <p class="text-sm text-green-600">Canal</p>
          </div>
          <div class="rounded-lg bg-purple-50 p-4 text-center">
            <p class="text-2xl font-bold text-purple-700">
              {{ summarySendMode }}
            </p>
            <p class="text-sm text-purple-600">Envoi</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <UiButton
            :disabled="!canSend || sending"
            variant="primary"
            class-name="bg-red-600 hover:bg-red-700 focus:ring-red-500 px-6"
            @click="handleSend"
          >
            <Loader2 v-if="sending" class="mr-2 inline h-4 w-4 animate-spin" />
            <Send v-else class="mr-2 inline h-4 w-4" />
            {{ sending ? "Envoi en cours…" : "Envoyer" }}
          </UiButton>
        </div>
      </UiCard>
    </div>

    <!-- history tab -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <UiCard>
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="historySearch"
              type="text"
              placeholder="Rechercher par titre…"
              class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:ring-red-500"
              @input="debouncedFetchHistory"
            />
          </div>
          <select
            v-model="historyStatusFilter"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
            @change="fetchHistory()"
          >
            <option value="">Tous les statuts</option>
            <option value="COMPLETED">Envoyé</option>
            <option value="ACTIVE">Programmé</option>
            <option value="DRAFT">Brouillon</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          <select
            v-model="historyTypeFilter"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
            @change="fetchHistory()"
          >
            <option value="">Tous les types</option>
            <option value="INFO">Information</option>
            <option value="WARNING">Avertissement</option>
            <option value="URGENT">Urgent</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </UiCard>

      <div v-if="historyLoading" class="py-12 text-center text-gray-500">
        <Loader2 class="mx-auto mb-2 h-6 w-6 animate-spin" />
        Chargement…
      </div>

      <div
        v-else-if="historyCampaigns.length === 0"
        class="rounded-lg bg-gray-50 py-12 text-center text-gray-500"
      >
        Aucun envoi trouvé
      </div>

      <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-3">Titre</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Destinataires</th>
              <th class="px-4 py-3">Envoyés</th>
              <th class="px-4 py-3">Échecs</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="c in historyCampaigns"
              :key="c.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-medium text-gray-900">
                {{ c.title }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    typeVariants[c.messageType] || typeVariants.INFO,
                  ]"
                >
                  {{ typeLabels[c.messageType] || c.messageType }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ c.totalRecipients }}
              </td>
              <td class="px-4 py-3 text-green-600">
                {{ c.sentCount }}
              </td>
              <td class="px-4 py-3 text-red-600">
                {{ c.failedCount }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    statusVariants[c.status] || 'bg-gray-100 text-gray-800',
                  ]"
                >
                  {{ statusLabels[c.status] || c.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500">
                {{ formatDate(c.sentAt || c.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <button
                  class="text-sm text-red-600 hover:underline"
                  @click="viewCampaignDetail(c.id)"
                >
                  Détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- pagination -->
        <div
          v-if="historyTotalPages > 1"
          class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3"
        >
          <p class="text-sm text-gray-600">
            Page {{ historyPage }} / {{ historyTotalPages }} -
            {{ historyTotal }} résultat{{ historyTotal > 1 ? "s" : "" }}
          </p>
          <div class="flex gap-2">
            <button
              :disabled="historyPage <= 1"
              class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              @click="
                historyPage--;
                fetchHistory();
              "
            >
              Précédent
            </button>
            <button
              :disabled="historyPage >= historyTotalPages"
              class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              @click="
                historyPage++;
                fetchHistory();
              "
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- detail modal -->
    <div
      v-if="showDetailModal && selectedCampaign"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showDetailModal = false"
    >
      <div
        class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ selectedCampaign.title }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="showDetailModal = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg bg-blue-50 p-3 text-center">
              <p class="text-xl font-bold text-blue-700">
                {{ selectedCampaign.totalRecipients }}
              </p>
              <p class="text-xs text-blue-600">Total destinataires</p>
            </div>
            <div class="rounded-lg bg-green-50 p-3 text-center">
              <p class="text-xl font-bold text-green-700">
                {{ selectedCampaign.sentCount }}
              </p>
              <p class="text-xs text-green-600">Envoyés</p>
            </div>
            <div class="rounded-lg bg-red-50 p-3 text-center">
              <p class="text-xl font-bold text-red-700">
                {{ selectedCampaign.failedCount }}
              </p>
              <p class="text-xs text-red-600">Échecs</p>
            </div>
          </div>

          <div>
            <h4 class="mb-1 text-sm font-medium text-gray-500">Type</h4>
            <span
              :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                typeVariants[selectedCampaign.messageType] || typeVariants.INFO,
              ]"
            >
              {{
                typeLabels[selectedCampaign.messageType] ||
                selectedCampaign.messageType
              }}
            </span>
          </div>

          <div>
            <h4 class="mb-1 text-sm font-medium text-gray-500">Canaux</h4>
            <p class="text-sm text-gray-900">
              {{ (selectedCampaign.channels || []).join(", ") || "-" }}
            </p>
          </div>

          <div>
            <h4 class="mb-1 text-sm font-medium text-gray-500">Cible</h4>
            <p class="text-sm text-gray-900">
              {{
                targetTypeLabels[selectedCampaign.targetType] ||
                selectedCampaign.targetType
              }}
            </p>
          </div>

          <div>
            <h4 class="mb-1 text-sm font-medium text-gray-500">Message</h4>
            <div
              class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700"
            >
              {{ selectedCampaign.message }}
            </div>
          </div>

          <div
            v-if="
              selectedCampaign.recipients &&
              selectedCampaign.recipients.length > 0
            "
          >
            <h4 class="mb-2 text-sm font-medium text-gray-500">
              Destinataires ({{
                selectedCampaign._count?.recipients ||
                selectedCampaign.recipients.length
              }})
            </h4>
            <div
              class="max-h-48 overflow-y-auto rounded-lg border border-gray-200"
            >
              <table class="w-full text-left text-xs">
                <thead class="bg-gray-50 text-gray-500">
                  <tr>
                    <th class="px-3 py-2">Email</th>
                    <th class="px-3 py-2">Nom</th>
                    <th class="px-3 py-2">Envoyé</th>
                    <th class="px-3 py-2">Erreur</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="r in selectedCampaign.recipients"
                    :key="r.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-3 py-2 text-gray-700">{{ r.email }}</td>
                    <td class="px-3 py-2 text-gray-700">
                      {{ recipientName(r) }}
                    </td>
                    <td class="px-3 py-2">
                      <CheckCircle
                        v-if="r.sent"
                        class="h-4 w-4 text-green-500"
                      />
                      <XCircle v-else class="h-4 w-4 text-gray-300" />
                    </td>
                    <td class="px-3 py-2 text-red-500">
                      {{ r.error || "" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <UiButton variant="secondary" @click="showDetailModal = false">
            Fermer
          </UiButton>
        </div>
      </div>
    </div>

    <!-- toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg"
    >
      {{ toastMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="fixed bottom-6 right-6 z-50 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Send,
  Clock,
  Users,
  UsersRound,
  Stethoscope,
  Globe,
  Filter,
  Mail,
  Smartphone,
  Zap,
  CalendarClock,
  Settings,
  BarChart3,
  Search,
  Loader2,
  X,
  CheckCircle,
  XCircle,
} from "lucide-vue-next";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const activeTab = ref<"compose" | "history">("compose");

const targetType = ref("ALL_PATIENTS");
const recipientCounts = ref<{
  patients: number;
  practitioners: number;
  total: number;
}>({ patients: 0, practitioners: 0, total: 0 });

const customUserType = ref("");
const customLocation = ref("");
const customDateFrom = ref("");
const customDateTo = ref("");
const customRecipientCount = ref(0);
const customCountLoading = ref(false);
const availableCities = ref<string[]>([]);

const messageTitle = ref("");
const messageType = ref("INFO");
const messageContent = ref("");

const channelEmail = ref(true);
const sendMode = ref<"immediate" | "scheduled">("immediate");
const scheduledAt = ref("");

const sending = ref(false);
const toastMessage = ref("");
const errorMessage = ref("");

const historyCampaigns = ref<any[]>([]);
const historyLoading = ref(false);
const historySearch = ref("");
const historyStatusFilter = ref("");
const historyTypeFilter = ref("");
const historyPage = ref(1);
const historyTotal = ref(0);
const historyTotalPages = ref(1);

const showDetailModal = ref(false);
const selectedCampaign = ref<any>(null);

const typeLabels: Record<string, string> = {
  INFO: "Information",
  WARNING: "Avertissement",
  URGENT: "Urgent",
  MAINTENANCE: "Maintenance",
};

const typeVariants: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-yellow-100 text-yellow-800",
  URGENT: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Programmé",
  COMPLETED: "Envoyé",
  CANCELLED: "Annulé",
  PAUSED: "En pause",
};

const statusVariants: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
};

const targetTypeLabels: Record<string, string> = {
  ALL_PATIENTS: "Tous les patients",
  ALL_PRACTITIONERS: "Tous les professionnels",
  ALL_USERS: "Tous (patients + pros)",
  CUSTOM: "Groupe personnalisé",
};

const recipientOptions = computed(() => [
  {
    value: "ALL_PATIENTS",
    label: "Tous les patients",
    count: recipientCounts.value.patients,
    icon: Users,
  },
  {
    value: "ALL_PRACTITIONERS",
    label: "Tous les professionnels",
    count: recipientCounts.value.practitioners,
    icon: Stethoscope,
  },
  {
    value: "ALL_USERS",
    label: "Tous (patients + pros)",
    count: recipientCounts.value.total,
    icon: Globe,
  },
  {
    value: "CUSTOM",
    label: "Groupe personnalisé",
    count: null,
    icon: Filter,
  },
]);

const summaryRecipientCount = computed(() => {
  if (targetType.value === "ALL_PATIENTS")
    return recipientCounts.value.patients;
  if (targetType.value === "ALL_PRACTITIONERS")
    return recipientCounts.value.practitioners;
  if (targetType.value === "ALL_USERS") return recipientCounts.value.total;
  if (targetType.value === "CUSTOM") return customRecipientCount.value;
  return 0;
});

const summaryChannels = computed(() => {
  const channels: string[] = [];
  if (channelEmail.value) channels.push("Email");
  return channels.length > 0 ? channels.join(", ") : "Aucun";
});

const summarySendMode = computed(() => {
  return sendMode.value === "immediate" ? "Immédiat" : "Programmé";
});

const canSend = computed(() => {
  return (
    messageTitle.value.trim() !== "" &&
    messageContent.value.trim() !== "" &&
    summaryRecipientCount.value > 0 &&
    channelEmail.value &&
    (sendMode.value === "immediate" || scheduledAt.value !== "")
  );
});

async function fetchRecipientCounts() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { patients: number; practitioners: number; total: number };
    }>("/admin/campaigns/recipient-counts");
    if (response.success) {
      recipientCounts.value = response.data;
    }
  } catch {
    // silent
  }
}

async function fetchAvailableCities() {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: string[];
    }>("/admin/campaigns/cities");
    if (response.success) {
      availableCities.value = response.data;
    }
  } catch {
    // silent
  }
}

async function fetchCustomRecipientCount() {
  customCountLoading.value = true;
  try {
    const body: any = {
      targetType: "CUSTOM",
      targetUserTypes: customUserType.value ? [customUserType.value] : [],
      targetLocations: customLocation.value ? [customLocation.value] : [],
    };
    if (customDateFrom.value) body.targetRegisteredFrom = customDateFrom.value;
    if (customDateTo.value) body.targetRegisteredTo = customDateTo.value;

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { count: number };
    }>("/admin/campaigns/recipient-count", {
      method: "POST",
      body,
    });
    if (response.success) {
      customRecipientCount.value = response.data.count;
    }
  } catch {
    customRecipientCount.value = 0;
  } finally {
    customCountLoading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetchHistory() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    historyPage.value = 1;
    fetchHistory();
  }, 400);
}

async function fetchHistory() {
  historyLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("page", String(historyPage.value));
    params.set("limit", "20");
    if (historySearch.value) params.set("search", historySearch.value);
    if (historyStatusFilter.value)
      params.set("status", historyStatusFilter.value);
    if (historyTypeFilter.value)
      params.set("messageType", historyTypeFilter.value);

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: {
        campaigns: any[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>(`/admin/campaigns?${params.toString()}`);
    if (response.success) {
      historyCampaigns.value = response.data.campaigns;
      historyTotal.value = response.data.total;
      historyTotalPages.value = response.data.totalPages;
    }
  } catch {
    historyCampaigns.value = [];
  } finally {
    historyLoading.value = false;
  }
}

async function viewCampaignDetail(id: string) {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: any;
    }>(`/admin/campaigns/${id}`);
    if (response.success) {
      selectedCampaign.value = response.data;
      showDetailModal.value = true;
    }
  } catch {
    // silent
  }
}

async function handleSend() {
  if (!canSend.value) return;

  sending.value = true;
  errorMessage.value = "";

  try {
    const body: any = {
      title: messageTitle.value.trim(),
      message: messageContent.value.trim(),
      messageType: messageType.value,
      targetType: targetType.value,
      channels: [] as string[],
    };

    if (channelEmail.value) body.channels.push("EMAIL");

    if (targetType.value === "CUSTOM") {
      body.targetUserTypes = customUserType.value ? [customUserType.value] : [];
      body.targetLocations = customLocation.value ? [customLocation.value] : [];
      if (customDateFrom.value)
        body.targetRegisteredFrom = customDateFrom.value;
      if (customDateTo.value) body.targetRegisteredTo = customDateTo.value;
    }

    if (sendMode.value === "scheduled" && scheduledAt.value) {
      body.scheduledAt = new Date(scheduledAt.value).toISOString();
    }

    await useAuthenticatedFetch<{ success: boolean }>("/admin/campaigns", {
      method: "POST",
      body,
    });

    toastMessage.value =
      sendMode.value === "immediate"
        ? "Message envoyé avec succès !"
        : "Message programmé avec succès !";
    setTimeout(() => {
      toastMessage.value = "";
    }, 4000);

    // reset form
    messageTitle.value = "";
    messageContent.value = "";
    messageType.value = "INFO";
    targetType.value = "ALL_PATIENTS";
    sendMode.value = "immediate";
    scheduledAt.value = "";
    customUserType.value = "";
    customLocation.value = "";
    customDateFrom.value = "";
    customDateTo.value = "";

    await fetchRecipientCounts();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || "Erreur lors de l'envoi du message";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
  } finally {
    sending.value = false;
  }
}

function recipientName(r: any): string {
  if (r.patient) return `${r.patient.firstName} ${r.patient.lastName}`;
  if (r.practitioner)
    return `${r.practitioner.firstName} ${r.practitioner.lastName}`;
  return "-";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

watch(targetType, (val) => {
  if (val === "CUSTOM") {
    fetchCustomRecipientCount();
  }
});

watch([customUserType, customLocation, customDateFrom, customDateTo], () => {
  if (targetType.value === "CUSTOM") {
    fetchCustomRecipientCount();
  }
});

onMounted(() => {
  fetchRecipientCounts();
  fetchAvailableCities();
});
</script>
