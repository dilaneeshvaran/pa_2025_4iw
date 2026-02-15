<template>
  <div class="flex h-[calc(100vh-3rem)] flex-col">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Messagerie</h1>
      <p class="inline-flex items-center gap-1 text-sm text-gray-500">
        <Lock class="h-3.5 w-3.5 flex-shrink-0" />
        Messages chiffrés · Uniquement pour la communication de routine
      </p>
    </div>

    <div
      class="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm"
    >
      <!-- conversation list (left bar) -->
      <div
        :class="[
          'flex flex-col border-r',
          activeConversationId
            ? 'hidden w-80 lg:flex'
            : 'w-full lg:flex lg:w-80',
        ]"
      >
        <div class="border-b p-3">
          <button
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            @click="showNewConversation = true"
          >
            <PenSquare class="h-4 w-4" />
            Nouveau message
          </button>
        </div>

        <div class="border-b px-3 py-2">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une conversation..."
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- conversations list -->
        <div class="flex-1 overflow-y-auto">
          <!-- loading -->
          <div v-if="loadingConversations" class="space-y-2 p-3">
            <div
              v-for="i in 4"
              :key="i"
              class="animate-pulse rounded-lg bg-gray-50 p-3"
            >
              <div class="flex gap-3">
                <div class="h-10 w-10 rounded-full bg-gray-200" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 rounded bg-gray-200" />
                  <div class="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

          <!-- empty state -->
          <div
            v-else-if="filteredConversations.length === 0"
            class="flex flex-col items-center justify-center px-4 py-12 text-center"
          >
            <MessageSquare class="mb-3 h-12 w-12 text-gray-300" />
            <p class="mb-1 text-sm font-medium text-gray-900">
              {{ searchQuery ? "Aucun résultat" : "Aucune conversation" }}
            </p>
            <p class="text-xs text-gray-500">
              {{
                searchQuery
                  ? "Essayez un autre terme de recherche"
                  : "Envoyez un message à votre praticien pour commencer"
              }}
            </p>
          </div>

          <!-- conversation items -->
          <div v-else>
            <button
              v-for="conv in filteredConversations"
              :key="conv.id"
              :class="[
                'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors',
                activeConversationId === conv.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50',
              ]"
              @click="openConversation(conv.id)"
            >
              <!-- avatar -->
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600"
              >
                {{ conv.practitionerFirstName[0]
                }}{{ conv.practitionerLastName[0] }}
              </div>

              <!-- content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <p class="truncate text-sm font-semibold text-gray-900">
                    {{ conv.practitionerTitle }}
                    {{ conv.practitionerFirstName }}
                    {{ conv.practitionerLastName }}
                  </p>
                  <span class="ml-2 flex-shrink-0 text-xs text-gray-400">
                    {{ formatRelativeTime(conv.lastMessageAt) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <p class="truncate text-xs text-gray-500">
                    {{
                      conv.practitionerSpecialty
                        ? conv.practitionerSpecialty
                        : ""
                    }}
                  </p>
                  <span
                    v-if="conv.unreadCount > 0"
                    class="ml-2 flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white"
                  >
                    {{ conv.unreadCount }}
                  </span>
                </div>
                <p
                  v-if="conv.lastMessagePreview"
                  class="mt-0.5 truncate text-xs text-gray-400"
                >
                  {{ conv.lastMessagePreview }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- chat area (right side main panel) -->
      <div
        :class="[
          'flex flex-1 flex-col',
          activeConversationId ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <!-- no conversation selected -->
        <div
          v-if="!activeConversationId"
          class="flex flex-1 flex-col items-center justify-center text-center"
        >
          <div class="mb-4 rounded-full bg-blue-50 p-6">
            <MessageSquare class="h-12 w-12 text-blue-400" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">Vos messages</h3>
          <p class="max-w-sm text-sm text-gray-500">
            Sélectionnez une conversation ou envoyez un nouveau message à votre
            praticien.
          </p>
          <div class="mt-6 rounded-lg bg-amber-50 p-4 text-left">
            <div class="flex gap-2">
              <AlertTriangle
                class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
              />
              <div>
                <p class="text-xs font-medium text-amber-800">Important</p>
                <p class="mt-1 text-xs text-amber-700">
                  La messagerie n'est pas destinée aux urgences, aux
                  consultations formelles ou à l'obtention de rapports médicaux.
                  Elle est principalement utilisée pour la communication de
                  routine (questions de suivi, questions administratives, etc.).
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- active conversation -->
        <template v-else>
          <div class="flex items-center gap-3 border-b px-4 py-3">
            <button
              class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
              @click="activeConversationId = null"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600"
            >
              {{
                activeConversation?.practitioner?.firstName?.[0] +
                (activeConversation?.practitioner?.lastName?.[0] ?? "")
              }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900">
                {{ activeConversation?.practitioner?.title }}
                {{ activeConversation?.practitioner?.firstName }}
                {{ activeConversation?.practitioner?.lastName }}
              </p>
              <p class="text-xs text-gray-500">
                {{ activeConversation?.practitioner?.specialty || "" }}
                <span v-if="isTyping" class="ml-1 italic text-blue-500"
                  >est en train d'écrire...</span
                >
              </p>
            </div>
            <div class="flex items-center gap-1">
              <Lock class="h-3.5 w-3.5 text-green-500" />
              <span class="text-xs text-green-600">Chiffré</span>
            </div>
          </div>

          <!-- messages area -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4">
            <!-- loading messages -->
            <div
              v-if="loadingMessages"
              class="flex items-center justify-center py-12"
            >
              <div
                class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
              />
            </div>

            <!-- messages list -->
            <div v-else class="space-y-3">
              <!-- info banner -->
              <div
                class="mx-auto mb-4 max-w-md rounded-lg bg-gray-50 p-3 text-center"
              >
                <p class="text-xs text-gray-500">
                  <Lock class="mr-1 inline h-3 w-3" />
                  Les messages sont chiffrés de bout en bout. N'utilisez pas
                  cette messagerie pour les urgences.
                </p>
              </div>

              <!-- date separator + messages -->
              <template
                v-for="(group, dateKey) in groupedMessages"
                :key="dateKey"
              >
                <div class="my-4 flex items-center gap-3">
                  <div class="h-px flex-1 bg-gray-200" />
                  <span class="text-xs font-medium text-gray-400">{{
                    dateKey
                  }}</span>
                  <div class="h-px flex-1 bg-gray-200" />
                </div>

                <div
                  v-for="msg in group"
                  :key="msg.id"
                  :class="[
                    'flex',
                    msg.senderUserId === currentUserId
                      ? 'justify-end'
                      : 'justify-start',
                  ]"
                >
                  <div
                    :class="[
                      'max-w-[75%] rounded-2xl px-4 py-2.5',
                      msg.senderUserId === currentUserId
                        ? 'rounded-br-md bg-blue-600 text-white'
                        : 'rounded-bl-md bg-gray-100 text-gray-900',
                    ]"
                  >
                    <div
                      v-if="msg.attachments && msg.attachments.length > 0"
                      class="mb-2"
                    >
                      <div
                        v-for="(att, i) in msg.attachments"
                        :key="i"
                        class="mb-1"
                      >
                        <img
                          v-if="isImageFile(att.mimeType)"
                          :src="getAttachmentUrl(att.url, true)"
                          :alt="att.originalName"
                          class="max-h-48 cursor-pointer rounded-lg object-cover"
                          @click="openAttachment(att.url)"
                        />
                        <a
                          v-else
                          :href="getAttachmentUrl(att.url, true)"
                          target="_blank"
                          :class="[
                            'flex items-center gap-2 rounded-lg p-2 text-xs',
                            msg.senderUserId === currentUserId
                              ? 'bg-blue-500/30 text-blue-100 hover:bg-blue-500/50'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                          ]"
                        >
                          <Paperclip class="h-3.5 w-3.5 flex-shrink-0" />
                          <span class="truncate">{{ att.originalName }}</span>
                          <span class="flex-shrink-0 text-[10px] opacity-75">
                            {{ formatFileSize(att.fileSize) }}
                          </span>
                        </a>
                      </div>
                    </div>
                    <p
                      v-if="
                        msg.content &&
                        msg.content !== '\uD83D\uDCCE Fichier joint'
                      "
                      class="whitespace-pre-wrap text-sm"
                    >
                      {{ msg.content }}
                    </p>
                    <div
                      :class="[
                        'mt-1 flex items-center justify-end gap-1',
                        msg.senderUserId === currentUserId
                          ? 'text-blue-200'
                          : 'text-gray-400',
                      ]"
                    >
                      <span class="text-[10px]">
                        {{ formatMessageTime(msg.createdAt) }}
                      </span>
                      <template v-if="msg.senderUserId === currentUserId">
                        <CheckCheck
                          v-if="msg.status === 'READ'"
                          class="h-3.5 w-3.5 text-blue-200"
                        />
                        <Check v-else class="h-3.5 w-3.5" />
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- message input -->
          <div class="border-t px-4 py-3">
            <div
              v-if="pendingAttachment"
              class="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
            >
              <Paperclip class="h-4 w-4 text-gray-500" />
              <span class="flex-1 truncate text-sm text-gray-700">
                {{ pendingAttachment.name }}
              </span>
              <span class="text-xs text-gray-400">
                {{ formatFileSize(pendingAttachment.size) }}
              </span>
              <button
                class="rounded p-0.5 text-gray-400 hover:text-red-500"
                @click="pendingAttachment = null"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <form
              class="flex items-end gap-2"
              @submit.prevent="handleSendMessage"
            >
              <div class="relative">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100"
                  :title="`Joindre un fichier (${fileConstraintsInfo.allowedFormatsLabel}, max ${fileConstraintsInfo.maxSizeLabel})`"
                  @click="triggerFileUpload"
                >
                  <Paperclip class="h-5 w-5" />
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  :accept="fileAcceptString"
                  @change="handleFileSelect"
                />
              </div>

              <div class="relative flex-1">
                <textarea
                  ref="messageInput"
                  v-model="newMessage"
                  placeholder="Votre message..."
                  rows="1"
                  class="max-h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  @input="handleTyping"
                />
              </div>
              <button
                type="submit"
                :disabled="
                  (!newMessage.trim() && !pendingAttachment) || sendingMessage
                "
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send class="h-4 w-4" />
              </button>
            </form>
            <p class="mt-1 text-[10px] text-gray-400">
              Formats : {{ fileConstraintsInfo.allowedFormatsLabel }} · Max
              {{ fileConstraintsInfo.maxSizeLabel }} par fichier
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- new conversation modal -->
    <Teleport to="body">
      <div
        v-if="showNewConversation"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showNewConversation = false"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Nouveau message</h3>
            <button
              class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
              @click="showNewConversation = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- loading practitioners -->
          <div v-if="loadingPractitioners" class="space-y-3 py-4">
            <div
              v-for="i in 3"
              :key="i"
              class="flex animate-pulse items-center gap-3 rounded-lg bg-gray-50 p-3"
            >
              <div class="h-10 w-10 rounded-full bg-gray-200" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-2/3 rounded bg-gray-200" />
                <div class="h-3 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          <!-- no practitioners -->
          <div
            v-else-if="messagablePractitioners.length === 0"
            class="py-8 text-center"
          >
            <UserX class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p class="mb-2 text-sm font-medium text-gray-900">
              Aucun praticien disponible
            </p>
            <p class="text-xs text-gray-500">
              Vous pouvez uniquement envoyer des messages aux praticiens qui ont
              activé la messagerie et chez qui vous avez eu un rendez-vous
              confirmé.
            </p>
          </div>

          <!-- practitioners list -->
          <div v-else class="max-h-80 space-y-2 overflow-y-auto">
            <p class="mb-3 text-xs text-gray-500">
              Sélectionnez un praticien pour envoyer un message :
            </p>
            <button
              v-for="prac in messagablePractitioners"
              :key="prac.id"
              class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
              @click="startNewConversation(prac)"
            >
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600"
              >
                {{ prac.firstName[0] }}{{ prac.lastName[0] }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ prac.title }} {{ prac.firstName }} {{ prac.lastName }}
                </p>
                <p v-if="prac.specialty" class="text-xs text-gray-500">
                  {{ prac.specialty }}
                </p>
              </div>
              <MessageSquare class="ml-auto h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- first message modal (after selecting a practitioner) -->
    <Teleport to="body">
      <div
        v-if="showFirstMessageModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="cancelFirstMessage"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600"
            >
              {{ selectedPractitioner?.firstName[0]
              }}{{ selectedPractitioner?.lastName[0] }}
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">
                {{ selectedPractitioner?.title }}
                {{ selectedPractitioner?.firstName }}
                {{ selectedPractitioner?.lastName }}
              </p>
              <p
                v-if="selectedPractitioner?.specialty"
                class="text-xs text-gray-500"
              >
                {{ selectedPractitioner?.specialty }}
              </p>
            </div>
          </div>

          <div class="mb-3 rounded-lg bg-amber-50 p-3">
            <p class="text-xs text-amber-700">
              <AlertTriangle class="mr-1 inline h-3 w-3" />
              La messagerie est réservée à la communication de routine
              (questions de suivi, questions administratives). Pour les
              urgences, appelez le 185 (SAMU).
            </p>
          </div>

          <textarea
            v-model="firstMessage"
            rows="4"
            placeholder="Votre message..."
            class="mb-4 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div v-if="firstMessageError" class="mb-3 rounded-lg bg-red-50 p-3">
            <p class="text-xs text-red-600">{{ firstMessageError }}</p>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="cancelFirstMessage"
            >
              Annuler
            </button>
            <button
              type="button"
              :disabled="!firstMessage.trim() || sendingFirst"
              class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="sendFirstMessage"
            >
              <Send class="h-4 w-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  MessageSquare,
  Send,
  Search,
  PenSquare,
  Lock,
  X,
  ArrowLeft,
  AlertTriangle,
  Check,
  CheckCheck,
  UserX,
  Paperclip,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { useMessagingStore } from "~/stores/messaging";

definePageMeta({
  layout: "patient",
  middleware: "auth",
});

// state
const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id || "");

interface ConversationSummary {
  id: string;
  practitionerId: string;
  practitionerFirstName: string;
  practitionerLastName: string;
  practitionerTitle: string;
  practitionerSpecialty: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  attachments: MessageAttachment[] | null;
  status: string;
  readAt: string | null;
  createdAt: string;
}

interface MessageAttachment {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

interface ConversationDetail {
  id: string;
  patientId: string;
  practitionerId: string;
  practitioner: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    title: string;
    specialty: string | null;
    messagingEnabled: boolean;
  };
  patient: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  messages: Message[];
}

interface MessagablePractitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string | null;
}

const conversations = ref<ConversationSummary[]>([]);
const loadingConversations = ref(true);
const searchQuery = ref("");
const activeConversationId = ref<string | null>(null);
const activeConversation = ref<ConversationDetail | null>(null);
const loadingMessages = ref(false);
const newMessage = ref("");
const sendingMessage = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const pendingAttachment = ref<File | null>(null);

const showNewConversation = ref(false);
const messagablePractitioners = ref<MessagablePractitioner[]>([]);
const loadingPractitioners = ref(false);
const selectedPractitioner = ref<MessagablePractitioner | null>(null);
const showFirstMessageModal = ref(false);
const firstMessage = ref("");
const firstMessageError = ref("");
const sendingFirst = ref(false);

// typing indicator
const isTyping = ref(false);
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

// websocket (shared global store)
const messagingStore = useMessagingStore();
const wsSend = messagingStore.send;
const wsOn = messagingStore.on;
const wsOff = messagingStore.off;

const fileConstraintsInfo = reactive({
  maxSize: 10 * 1024 * 1024,
  maxSizeLabel: "10 Mo",
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".heic",
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
  ],
  allowedFormatsLabel: "JPG, PNG, HEIC, PDF, DOC, DOCX, TXT",
});

const fileAcceptString = computed(() =>
  fileConstraintsInfo.allowedExtensions
    .map((e) => (e === ".jpg" ? ".jpg,.jpeg" : e))
    .join(","),
);

// computed
const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) return conversations.value;
  const q = searchQuery.value.toLowerCase();
  return conversations.value.filter(
    (c) =>
      c.practitionerFirstName.toLowerCase().includes(q) ||
      c.practitionerLastName.toLowerCase().includes(q) ||
      (c.practitionerSpecialty &&
        c.practitionerSpecialty.toLowerCase().includes(q)),
  );
});

const groupedMessages = computed(() => {
  if (!activeConversation.value) return {};
  const groups: Record<string, Message[]> = {};
  for (const msg of activeConversation.value.messages) {
    const date = new Date(msg.createdAt);
    const key = formatDateLabel(date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  }
  return groups;
});

const fetchConversations = async () => {
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ConversationSummary[];
    }>("/messages/conversations");
    if (response.success) {
      conversations.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
  } finally {
    loadingConversations.value = false;
  }
};

const openConversation = async (conversationId: string) => {
  activeConversationId.value = conversationId;
  loadingMessages.value = true;
  isTyping.value = false;
  let conversationLoaded = false;

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ConversationDetail;
    }>(`/messages/conversations/${conversationId}`);
    if (response.success) {
      activeConversation.value = response.data;
      // update unread count in the list
      const conv = conversations.value.find((c) => c.id === conversationId);
      if (conv) {
        conv.unreadCount = 0;
        // refresh count (badge)
        messagingStore.fetchUnreadCount();
      }
      conversationLoaded = true;
    }
  } catch (error) {
    console.error("Error loading conversation:", error);
  } finally {
    loadingMessages.value = false;
  }

  if (conversationLoaded) {
    await nextTick();
    scrollToBottom();
  }
};

const handleSendMessage = async () => {
  if (
    (!newMessage.value.trim() && !pendingAttachment.value) ||
    sendingMessage.value ||
    !activeConversationId.value
  )
    return;

  if (pendingAttachment.value) {
    await sendAttachmentMessage();
    return;
  }

  const content = newMessage.value.trim();
  newMessage.value = "";
  sendingMessage.value = true;

  // stop typing indicator
  if (activeConversation.value) {
    const practitionerUserId = getPractitionerUserId();
    if (practitionerUserId) {
      wsSend({
        type: "stop_typing",
        conversationId: activeConversationId.value,
        recipientUserId: practitionerUserId,
      });
    }
  }

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: Message;
    }>(`/messages/conversations/${activeConversationId.value}/messages`, {
      method: "POST",
      body: { content },
    });

    if (response.success && activeConversation.value) {
      activeConversation.value.messages.push(response.data);
      updateConversationPreview(content, response.data.createdAt);
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    // put the message back
    newMessage.value = content;
  } finally {
    sendingMessage.value = false;
  }
};

const sendAttachmentMessage = async () => {
  if (!pendingAttachment.value || !activeConversationId.value) return;

  sendingMessage.value = true;
  const formData = new FormData();
  formData.append("file", pendingAttachment.value);
  if (newMessage.value.trim()) {
    formData.append("content", newMessage.value.trim());
  }

  const file = pendingAttachment.value;
  const content = newMessage.value.trim();
  pendingAttachment.value = null;
  newMessage.value = "";

  try {
    const config = useRuntimeConfig();
    const response = await $fetch<{
      success: boolean;
      data: Message;
    }>(
      `${config.public.apiBase}/messages/conversations/${activeConversationId.value}/messages/attachment`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
        body: formData,
      },
    );

    if (response.success && activeConversation.value) {
      activeConversation.value.messages.push(response.data);
      updateConversationPreview(
        content || "\uD83D\uDCCE Fichier joint",
        response.data.createdAt,
      );
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error sending attachment:", error);
    pendingAttachment.value = file;
    newMessage.value = content;
  } finally {
    sendingMessage.value = false;
  }
};

function updateConversationPreview(content: string, createdAt: string) {
  const conv = conversations.value.find(
    (c) => c.id === activeConversationId.value,
  );
  if (conv) {
    conv.lastMessagePreview =
      content.length > 100 ? content.substring(0, 100) + "…" : content;
    conv.lastMessageAt = createdAt;
  }
}

const handleTyping = () => {
  if (!activeConversationId.value) return;
  const practitionerUserId = getPractitionerUserId();
  if (!practitionerUserId) return;

  wsSend({
    type: "typing",
    conversationId: activeConversationId.value,
    recipientUserId: practitionerUserId,
  });

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    wsSend({
      type: "stop_typing",
      conversationId: activeConversationId.value,
      recipientUserId: practitionerUserId,
    });
  }, 2000);
};

const getPractitionerUserId = (): string | null => {
  return activeConversation.value?.practitioner?.userId ?? null;
};

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getAttachmentUrl(url: string, includeToken = false): string {
  const config = useRuntimeConfig();
  const apiBase = (config.public.apiBase as string).replace(/\/api\/?$/, "");
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  const attachmentUrl = `${apiBase}${normalizedUrl}`;

  if (!includeToken || !authStore.accessToken) {
    return attachmentUrl;
  }

  const separator = attachmentUrl.includes("?") ? "&" : "?";
  return `${attachmentUrl}${separator}token=${encodeURIComponent(authStore.accessToken)}`;
}

function openAttachment(url: string) {
  window.open(getAttachmentUrl(url, true), "_blank");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function triggerFileUpload() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > fileConstraintsInfo.maxSize) {
    alert(
      `Le fichier est trop volumineux. Taille maximale : ${fileConstraintsInfo.maxSizeLabel}`,
    );
    input.value = "";
    return;
  }

  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  if (!fileConstraintsInfo.allowedExtensions.includes(ext)) {
    alert(
      `Format non autorisé. Formats acceptés : ${fileConstraintsInfo.allowedFormatsLabel}`,
    );
    input.value = "";
    return;
  }

  pendingAttachment.value = file;
  input.value = "";
}

const fetchMessagablePractitioners = async () => {
  loadingPractitioners.value = true;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: MessagablePractitioner[];
    }>("/messages/practitioners");
    if (response.success) {
      messagablePractitioners.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching practitioners:", error);
  } finally {
    loadingPractitioners.value = false;
  }
};

const startNewConversation = (prac: MessagablePractitioner) => {
  // check if a conversation with this practitioner already exists
  const existingConv = conversations.value.find(
    (c) => c.practitionerId === prac.id,
  );
  if (existingConv) {
    showNewConversation.value = false;
    openConversation(existingConv.id);
    return;
  }

  selectedPractitioner.value = prac;
  showNewConversation.value = false;
  showFirstMessageModal.value = true;
  firstMessage.value = "";
  firstMessageError.value = "";
};

const cancelFirstMessage = () => {
  showFirstMessageModal.value = false;
  selectedPractitioner.value = null;
  firstMessage.value = "";
  firstMessageError.value = "";
};

const sendFirstMessage = async () => {
  if (
    !firstMessage.value.trim() ||
    !selectedPractitioner.value ||
    sendingFirst.value
  )
    return;

  sendingFirst.value = true;
  firstMessageError.value = "";

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { conversationId: string; message: Message };
    }>("/messages/conversations", {
      method: "POST",
      body: {
        practitionerId: selectedPractitioner.value.id,
        content: firstMessage.value.trim(),
      },
    });

    if (response.success) {
      showFirstMessageModal.value = false;
      selectedPractitioner.value = null;
      firstMessage.value = "";

      // refresh conversations and open the new one
      await fetchConversations();
      openConversation(response.data.conversationId);
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    firstMessageError.value =
      err?.data?.message || "Erreur lors de l'envoi du message";
  } finally {
    sendingFirst.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "maintenant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateLabel = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// watch new conv modal
watch(showNewConversation, (value) => {
  if (value) {
    fetchMessagablePractitioners();
  }
});

// ws event
const handleNewMessage = (data: Message) => {
  // if were in the same conversation, add the message
  if (
    activeConversation.value &&
    data.conversationId === activeConversationId.value
  ) {
    activeConversation.value.messages.push(data);
    nextTick(() => scrollToBottom());

    // mark as read
    useAuthenticatedFetch(
      `/messages/conversations/${data.conversationId}/read`,
      { method: "PATCH" },
    ).catch(() => {});

    // minus global unread since we read msg
    if (messagingStore.unreadCount > 0) {
      messagingStore.unreadCount--;
    }
  }

  // update conversation list
  const conv = conversations.value.find((c) => c.id === data.conversationId);
  if (conv) {
    conv.lastMessagePreview =
      data.content.length > 100
        ? data.content.substring(0, 100) + "…"
        : data.content;
    conv.lastMessageAt = data.createdAt;
    if (data.conversationId !== activeConversationId.value) {
      conv.unreadCount++;
    }
  } else {
    // new conversation from a practitioner, refresh the list
    fetchConversations();
  }
};

const handleMessagesRead = (data: { conversationId: string }) => {
  if (
    activeConversation.value &&
    data.conversationId === activeConversationId.value
  ) {
    // mark all our sent messages as read
    activeConversation.value.messages.forEach((msg) => {
      if (msg.senderUserId === currentUserId.value) {
        msg.status = "READ";
      }
    });
  }
};

const handleTypingStart = (data: { conversationId: string }) => {
  if (data.conversationId === activeConversationId.value) {
    isTyping.value = true;
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping.value = false;
    }, 3000);
  }
};

const handleTypingStop = (data: { conversationId: string }) => {
  if (data.conversationId === activeConversationId.value) {
    isTyping.value = false;
  }
};

//init
onMounted(() => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (authStore.accessToken) {
    fetchConversations();
    // ws is connected at layout,  register handlers
    wsOn("new_message", handleNewMessage);
    wsOn("messages_read", handleMessagesRead);
    wsOn("typing", handleTypingStart);
    wsOn("stop_typing", handleTypingStop);
  }
});

onUnmounted(() => {
  // unregister handlers, ws is alive in layout
  wsOff("new_message", handleNewMessage);
  wsOff("messages_read", handleMessagesRead);
  wsOff("typing", handleTypingStart);
  wsOff("stop_typing", handleTypingStop);
});
</script>
