<template>
  <div class="flex h-[calc(100vh-3rem)] flex-col">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Messagerie</h1>
      <p class="inline-flex items-center gap-1 text-sm text-gray-500">
        <Lock class="h-3.5 w-3.5 flex-shrink-0" />
        Messages chiffrés de bout en bout · Communication sécurisée
      </p>
    </div>

    <div
      class="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm"
    >
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
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            @click="showNewConversation = true"
          >
            <PenSquare class="h-4 w-4" />
            Nouveau message
          </button>
        </div>

        <div class="flex border-b text-xs font-medium">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            :class="[
              'flex-1 px-2 py-2.5 text-center transition-colors',
              activeFilter === tab.key
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-500 hover:text-gray-700',
            ]"
            @click="activeFilter = tab.key"
          >
            {{ tab.label }}
            <span
              v-if="tab.key === 'unread' && totalUnreadCount > 0"
              class="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] text-white"
            >
              {{ totalUnreadCount }}
            </span>
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
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

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

          <!-- empty page -->
          <div
            v-else-if="filteredConversations.length === 0"
            class="flex flex-col items-center justify-center px-4 py-12 text-center"
          >
            <MessageSquare class="mb-3 h-12 w-12 text-gray-300" />
            <p class="mb-1 text-sm font-medium text-gray-900">
              {{
                searchQuery
                  ? "Aucun résultat"
                  : activeFilter === "unread"
                    ? "Aucun message non lu"
                    : "Aucune conversation"
              }}
            </p>
            <p class="text-xs text-gray-500">
              {{
                searchQuery
                  ? "Essayez un autre terme de recherche"
                  : "Envoyez un message pour démarrer une conversation"
              }}
            </p>
          </div>

          <div v-else>
            <div
              v-for="conv in filteredConversations"
              :key="conv.id"
              class="group relative"
            >
              <button
                :class="[
                  'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors',
                  activeConversationId === conv.id
                    ? 'bg-orange-50'
                    : 'hover:bg-gray-50',
                ]"
                @click="openConversation(conv.id)"
              >
                <!-- avatar -->
                <div
                  :class="[
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    conv.type === 'PRACTITIONER_PRACTITIONER'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-green-100 text-green-600',
                  ]"
                >
                  {{ getConversationInitials(conv) }}
                </div>

                <!-- Content -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <p class="truncate text-sm font-semibold text-gray-900">
                      {{ getConversationName(conv) }}
                    </p>
                    <span class="ml-2 flex-shrink-0 text-xs text-gray-400">
                      {{ formatRelativeTime(conv.lastMessageAt) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-gray-500">
                      <span
                        v-if="conv.type === 'PRACTITIONER_PRACTITIONER'"
                        class="inline-flex items-center gap-1"
                      >
                        <Stethoscope class="h-3 w-3" />
                        {{ conv.otherPractitionerSpecialty || "Praticien" }}
                      </span>
                      <span v-else>Patient</span>
                    </p>
                    <span
                      v-if="conv.unreadCount > 0"
                      class="ml-2 flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-medium text-white"
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

              <!-- 3 dot  -->
              <div class="absolute right-2 top-2" data-menu>
                <button
                  class="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                  :class="{ 'opacity-100': openMenuId === conv.id }"
                  @click.stop="toggleMenu(conv.id)"
                >
                  <MoreVertical class="h-4 w-4" />
                </button>

                <!-- dropdown  -->
                <div
                  v-if="openMenuId === conv.id"
                  class="absolute right-0 top-8 z-10 w-56 rounded-lg border bg-white py-1 shadow-lg"
                >
                  <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    @click.stop="toggleEmailMute(conv.id)"
                  >
                    <BellOff v-if="conv.emailMuted" class="h-4 w-4" />
                    <Bell v-else class="h-4 w-4" />
                    {{
                      conv.emailMuted
                        ? "Activer les notifications email"
                        : "Désactiver les notifications email"
                    }}
                  </button>
                  <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    @click.stop="confirmDeleteConversation(conv.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                    Supprimer la conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- chat area -->
      <div
        :class="[
          'flex flex-1 flex-col',
          activeConversationId ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <!-- no selected conversation  -->
        <div
          v-if="!activeConversationId"
          class="flex flex-1 flex-col items-center justify-center text-center"
        >
          <div class="mb-4 rounded-full bg-orange-50 p-6">
            <MessageSquare class="h-12 w-12 text-orange-500" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900">Vos messages</h3>
          <p class="max-w-sm text-sm text-gray-500">
            Sélectionnez une conversation ou envoyez un nouveau message à un
            patient ou confrère.
          </p>
          <div class="mt-6 rounded-lg bg-orange-50 p-4 text-left">
            <div class="flex gap-2">
              <Shield class="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
              <div>
                <p class="text-xs font-medium text-orange-700">
                  Chiffrement de bout en bout
                </p>
                <p class="mt-1 text-xs text-orange-700">
                  Tous les messages sont chiffrés avec AES-256-GCM. Seuls vous
                  et votre correspondant pouvez lire les messages.
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
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                activeConversation?.type === 'PRACTITIONER_PRACTITIONER'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-green-100 text-green-600',
              ]"
            >
              {{ activeConversationHeaderInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900">
                {{ activeConversationHeaderName }}
              </p>
              <p class="text-xs text-gray-500">
                {{ activeConversationHeaderSubtitle }}
                <span v-if="isTyping" class="ml-1 italic text-orange-500">
                  est en train d'écrire...
                </span>
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
                class="h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"
              />
            </div>

            <div v-else class="space-y-3">
              <div
                class="mx-auto mb-4 max-w-md rounded-lg bg-gray-50 p-3 text-center"
              >
                <p class="text-xs text-gray-500">
                  <Lock class="mr-1 inline h-3 w-3" />
                  Les messages sont chiffrés de bout en bout (AES-256-GCM).
                </p>
              </div>

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
                        ? 'rounded-br-md bg-orange-500 text-white'
                        : 'rounded-bl-md bg-gray-100 text-gray-900',
                    ]"
                  >
                    <!-- attachment -->
                    <div
                      v-if="msg.attachments && msg.attachments.length > 0"
                      class="mb-2"
                    >
                      <div
                        v-for="(att, i) in msg.attachments"
                        :key="i"
                        class="mb-1"
                      >
                        <!-- image preview -->
                        <img
                          v-if="isImageFile(att.mimeType)"
                          :src="getAttachmentUrl(att.url, true)"
                          :alt="att.originalName"
                          class="max-h-48 cursor-pointer rounded-lg object-cover"
                          @click="openAttachment(att.url)"
                        />
                        <!-- file download -->
                        <a
                          v-else
                          :href="getAttachmentUrl(att.url, true)"
                          target="_blank"
                          :class="[
                            'flex items-center gap-2 rounded-lg p-2 text-xs',
                            msg.senderUserId === currentUserId
                              ? 'bg-orange-500/30 text-orange-200 hover:bg-orange-500/50'
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
                          ? 'text-orange-300'
                          : 'text-gray-400',
                      ]"
                    >
                      <span class="text-[10px]">
                        {{ formatMessageTime(msg.createdAt) }}
                      </span>
                      <template v-if="msg.senderUserId === currentUserId">
                        <CheckCheck
                          v-if="msg.status === 'READ'"
                          class="h-3.5 w-3.5 text-orange-300"
                        />
                        <Check v-else class="h-3.5 w-3.5" />
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div class="border-t px-4 py-3">
            <!-- attachment preview -->
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
              <!-- attachment button -->
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
                  class="max-h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  @input="handleTyping"
                />
              </div>
              <button
                type="submit"
                :disabled="
                  (!newMessage.trim() && !pendingAttachment) || sendingMessage
                "
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
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

          <!-- new conversation -->
          <div class="mb-4 flex rounded-lg border bg-gray-50 p-0.5">
            <button
              :class="[
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                newConvTab === 'patients'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
              @click="newConvTab = 'patients'"
            >
              <Users class="mr-1 inline h-4 w-4" />
              Mes patients
            </button>
            <button
              :class="[
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                newConvTab === 'practitioners'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
              @click="newConvTab = 'practitioners'"
            >
              <Stethoscope class="mr-1 inline h-4 w-4" />
              Confrères
            </button>
          </div>

          <!-- loading -->
          <div v-if="loadingContacts" class="space-y-3 py-4">
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

          <!-- empty state -->
          <div
            v-else-if="currentContactList.length === 0"
            class="py-8 text-center"
          >
            <UserX class="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p class="mb-2 text-sm font-medium text-gray-900">
              {{
                newConvTab === "patients"
                  ? "Aucun patient"
                  : "Aucun praticien disponible"
              }}
            </p>
            <p class="text-xs text-gray-500">
              {{
                newConvTab === "patients"
                  ? "Vous pourrez envoyer des messages aux patients ayant eu un rendez-vous."
                  : "Seuls les praticiens ayant activé la messagerie apparaissent ici."
              }}
            </p>
          </div>

          <!-- contact list -->
          <div v-else class="max-h-80 space-y-2 overflow-y-auto">
            <p class="mb-3 text-xs text-gray-500">
              {{
                newConvTab === "patients"
                  ? "Sélectionnez un patient :"
                  : "Sélectionnez un praticien :"
              }}
            </p>
            <button
              v-for="contact in currentContactList"
              :key="contact.id"
              class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
              @click="selectContact(contact)"
            >
              <div
                :class="[
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  newConvTab === 'patients'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-purple-100 text-purple-600',
                ]"
              >
                {{ contact.firstName?.[0] || ""
                }}{{ contact.lastName?.[0] || "" }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  <template
                    v-if="newConvTab === 'practitioners' && contact.title"
                  >
                    {{ contact.title }}
                  </template>
                  {{ contact.firstName }} {{ contact.lastName }}
                </p>
                <p v-if="contact.specialty" class="text-xs text-gray-500">
                  {{ contact.specialty }}
                </p>
              </div>
              <MessageSquare class="ml-auto h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showFirstMessageModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="cancelFirstMessage"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-3">
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                selectedContact?.type === 'practitioner'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-green-100 text-green-600',
              ]"
            >
              {{ selectedContact?.firstName?.[0] || ""
              }}{{ selectedContact?.lastName?.[0] || "" }}
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">
                <template v-if="selectedContact?.title">
                  {{ selectedContact.title }}
                </template>
                {{ selectedContact?.firstName }}
                {{ selectedContact?.lastName }}
              </p>
              <p
                v-if="selectedContact?.specialty"
                class="text-xs text-gray-500"
              >
                {{ selectedContact.specialty }}
              </p>
            </div>
          </div>

          <div class="mb-3 rounded-lg bg-orange-50 p-3">
            <p class="text-xs text-orange-700">
              <Lock class="mr-1 inline h-3 w-3" />
              Ce message sera chiffré de bout en bout.
            </p>
          </div>

          <textarea
            v-model="firstMessage"
            rows="4"
            placeholder="Votre message..."
            class="mb-4 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="sendFirstMessage"
            >
              <Send class="h-4 w-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- delete confirmation -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 text-center">
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
            >
              <Trash2 class="h-6 w-6 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              Supprimer la conversation ?
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              La conversation sera supprimée de votre liste. L'autre participant
              pourra toujours la voir.
            </p>
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="showDeleteConfirm = false"
            >
              Annuler
            </button>
            <button
              class="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              :disabled="deletingConversation"
              @click="executeDeleteConversation"
            >
              Supprimer
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
  Check,
  CheckCheck,
  UserX,
  Paperclip,
  Users,
  Stethoscope,
  MoreVertical,
  Bell,
  BellOff,
  Trash2,
  Shield,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { useMessagingStore } from "~/stores/messaging";

definePageMeta({
  layout: "practitioner",
  middleware: "practitioner-only",
});

const authStore = useAuthStore();
const route = useRoute();
const currentUserId = computed(() => authStore.user?.id || "");

interface ConversationSummary {
  id: string;
  type: string;
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  otherPractitionerId?: string;
  otherPractitionerFirstName?: string;
  otherPractitionerLastName?: string;
  otherPractitionerTitle?: string;
  otherPractitionerSpecialty?: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  emailMuted: boolean;
}

interface MessageAttachment {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  attachments: MessageAttachment[] | null;
  status: string;
  readAt: string | null;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  type: string;
  patientId: string | null;
  practitionerId: string;
  practitioner2Id: string | null;
  practitioner: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    title: string;
    specialty: string | null;
    messagingEnabled: boolean;
  };
  practitioner2?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    title: string;
    specialty: string | null;
  } | null;
  patient?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  } | null;
  messages: ConversationMessage[];
  emailMuted: boolean;
}

interface ContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  specialty?: string | null;
  phone?: string;
  type: "patient" | "practitioner";
}

const conversations = ref<ConversationSummary[]>([]);
const loadingConversations = ref(true);
const searchQuery = ref("");
const activeFilter = ref<"all" | "patients" | "pros" | "unread">("all");
const activeConversationId = ref<string | null>(null);
const activeConversation = ref<ConversationDetail | null>(null);
const loadingMessages = ref(false);
const newMessage = ref("");
const sendingMessage = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const openMenuId = ref<string | null>(null);

const showNewConversation = ref(false);
const newConvTab = ref<"patients" | "practitioners">("patients");
const loadingContacts = ref(false);
const messagablePatients = ref<ContactInfo[]>([]);
const messagablePractitioners = ref<ContactInfo[]>([]);
const selectedContact = ref<ContactInfo | null>(null);
const showFirstMessageModal = ref(false);
const firstMessage = ref("");
const firstMessageError = ref("");
const sendingFirst = ref(false);

const showDeleteConfirm = ref(false);
const deleteTargetId = ref<string | null>(null);
const deletingConversation = ref(false);

const pendingAttachment = ref<File | null>(null);

const isTyping = ref(false);
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

// ws
const messagingStore = useMessagingStore();
const wsSend = messagingStore.send;
const wsOn = messagingStore.on;
const wsOff = messagingStore.off;

const getRequestedConversationId = () => {
  const value = route.query.conversationId;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
};

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

const filterTabs = [
  { key: "all" as const, label: "Tous" },
  { key: "patients" as const, label: "Patients" },
  { key: "pros" as const, label: "Pros" },
  { key: "unread" as const, label: "Non lus" },
];

const totalUnreadCount = computed(() =>
  conversations.value.reduce((sum, c) => sum + c.unreadCount, 0),
);

const filteredConversations = computed(() => {
  let list = conversations.value;

  switch (activeFilter.value) {
    case "patients":
      list = list.filter((c) => c.type === "PATIENT_PRACTITIONER");
      break;
    case "pros":
      list = list.filter((c) => c.type === "PRACTITIONER_PRACTITIONER");
      break;
    case "unread":
      list = list.filter((c) => c.unreadCount > 0);
      break;
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter((c) => getConversationName(c).toLowerCase().includes(q));
  }

  return list;
});

const currentContactList = computed(() =>
  newConvTab.value === "patients"
    ? messagablePatients.value
    : messagablePractitioners.value,
);

const groupedMessages = computed(() => {
  if (!activeConversation.value) return {};
  const groups: Record<string, ConversationMessage[]> = {};
  for (const msg of activeConversation.value.messages) {
    const key = formatDateLabel(new Date(msg.createdAt));
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  }
  return groups;
});

const activeConversationHeaderName = computed(() => {
  const conv = activeConversation.value;
  if (!conv) return "";
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    const isP1 = conv.practitioner.userId === currentUserId.value;
    const other = isP1 ? conv.practitioner2 : conv.practitioner;
    return other ? `${other.title} ${other.firstName} ${other.lastName}` : "";
  }
  return conv.patient
    ? `${conv.patient.firstName} ${conv.patient.lastName}`
    : "";
});

const activeConversationHeaderSubtitle = computed(() => {
  const conv = activeConversation.value;
  if (!conv) return "";
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    const isP1 = conv.practitioner.userId === currentUserId.value;
    const other = isP1 ? conv.practitioner2 : conv.practitioner;
    return other?.specialty || "Praticien";
  }
  return "Patient";
});

const activeConversationHeaderInitials = computed(() => {
  const conv = activeConversation.value;
  if (!conv) return "";
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    const isP1 = conv.practitioner.userId === currentUserId.value;
    const other = isP1 ? conv.practitioner2 : conv.practitioner;
    return other ? `${other.firstName[0]}${other.lastName[0]}` : "";
  }
  return conv.patient
    ? `${conv.patient.firstName[0]}${conv.patient.lastName[0]}`
    : "";
});

function getConversationName(conv: ConversationSummary): string {
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    const parts = [
      conv.otherPractitionerTitle,
      conv.otherPractitionerFirstName,
      conv.otherPractitionerLastName,
    ].filter(Boolean);
    return parts.join(" ");
  }
  return [conv.patientFirstName, conv.patientLastName]
    .filter(Boolean)
    .join(" ");
}

function getConversationInitials(conv: ConversationSummary): string {
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    return `${conv.otherPractitionerFirstName?.[0] || ""}${conv.otherPractitionerLastName?.[0] || ""}`;
  }
  return `${conv.patientFirstName?.[0] || ""}${conv.patientLastName?.[0] || ""}`;
}

function getRecipientUserId(): string | null {
  const conv = activeConversation.value;
  if (!conv) return null;
  if (conv.type === "PRACTITIONER_PRACTITIONER") {
    const isP1 = conv.practitioner.userId === currentUserId.value;
    return isP1
      ? (conv.practitioner2?.userId ?? null)
      : conv.practitioner.userId;
  }
  return conv.patient?.userId ?? null;
}

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

function formatRelativeTime(dateStr: string | null): string {
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
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(date: Date): string {
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
}

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
  openMenuId.value = null;
  let conversationLoaded = false;

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ConversationDetail;
    }>(`/messages/conversations/${conversationId}`);
    if (response.success) {
      activeConversation.value = response.data;
      const conv = conversations.value.find((c) => c.id === conversationId);
      if (conv) {
        conv.unreadCount = 0;
        //  global count (layout badge)
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

const openRequestedConversation = async () => {
  const requestedConversationId = getRequestedConversationId();

  if (
    requestedConversationId &&
    requestedConversationId !== activeConversationId.value
  ) {
    await openConversation(requestedConversationId);
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

  const recipientId = getRecipientUserId();
  if (recipientId) {
    wsSend({
      type: "stop_typing",
      conversationId: activeConversationId.value,
      recipientUserId: recipientId,
    });
  }

  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ConversationMessage;
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
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: ConversationMessage;
    }>(`/messages/conversations/${activeConversationId.value}/messages/attachment`, {
      method: "POST",
      body: formData,
    });

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
      content.length > 100 ? content.substring(0, 100) + "\u2026" : content;
    conv.lastMessageAt = createdAt;
  }
}

const handleTyping = () => {
  if (!activeConversationId.value) return;
  const recipientId = getRecipientUserId();
  if (!recipientId) return;

  wsSend({
    type: "typing",
    conversationId: activeConversationId.value,
    recipientUserId: recipientId,
  });

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    wsSend({
      type: "stop_typing",
      conversationId: activeConversationId.value!,
      recipientUserId: recipientId,
    });
  }, 2000);
};

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

// 3 dot menu
function toggleMenu(convId: string) {
  openMenuId.value = openMenuId.value === convId ? null : convId;
}

async function toggleEmailMute(convId: string) {
  openMenuId.value = null;
  try {
    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { emailMuted: boolean };
    }>(`/messages/conversations/${convId}/email-mute`, { method: "PATCH" });
    if (response.success) {
      const conv = conversations.value.find((c) => c.id === convId);
      if (conv) conv.emailMuted = response.data.emailMuted;
      if (activeConversation.value?.id === convId) {
        activeConversation.value.emailMuted = response.data.emailMuted;
      }
    }
  } catch (error) {
    console.error("Error toggling email mute:", error);
  }
}

function confirmDeleteConversation(convId: string) {
  openMenuId.value = null;
  deleteTargetId.value = convId;
  showDeleteConfirm.value = true;
}

async function executeDeleteConversation() {
  if (!deleteTargetId.value) return;
  deletingConversation.value = true;
  try {
    await useAuthenticatedFetch(
      `/messages/conversations/${deleteTargetId.value}`,
      { method: "DELETE" },
    );
    conversations.value = conversations.value.filter(
      (c) => c.id !== deleteTargetId.value,
    );
    if (activeConversationId.value === deleteTargetId.value) {
      activeConversationId.value = null;
      activeConversation.value = null;
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
  } finally {
    deletingConversation.value = false;
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
  }
}

// new conv
const fetchContacts = async () => {
  loadingContacts.value = true;
  try {
    const [patientsRes, practitionersRes] = await Promise.all([
      useAuthenticatedFetch<{
        success: boolean;
        data: Array<{
          id: string;
          firstName: string;
          lastName: string;
          phone: string;
        }>;
      }>("/messages/patients"),
      useAuthenticatedFetch<{
        success: boolean;
        data: Array<{
          id: string;
          firstName: string;
          lastName: string;
          title: string;
          specialty: string | null;
        }>;
      }>("/messages/practitioners-for-practitioner"),
    ]);

    if (patientsRes.success) {
      messagablePatients.value = patientsRes.data.map((p) => ({
        ...p,
        type: "patient" as const,
      }));
    }
    if (practitionersRes.success) {
      messagablePractitioners.value = practitionersRes.data.map((p) => ({
        ...p,
        type: "practitioner" as const,
      }));
    }
  } catch (error) {
    console.error("Error fetching contacts:", error);
  } finally {
    loadingContacts.value = false;
  }
};

function selectContact(contact: ContactInfo) {
  const existingConv = conversations.value.find((c) => {
    if (contact.type === "patient" && c.type === "PATIENT_PRACTITIONER") {
      return c.patientId === contact.id;
    }
    if (
      contact.type === "practitioner" &&
      c.type === "PRACTITIONER_PRACTITIONER"
    ) {
      return c.otherPractitionerId === contact.id;
    }
    return false;
  });

  if (existingConv) {
    showNewConversation.value = false;
    openConversation(existingConv.id);
    return;
  }

  selectedContact.value = contact;
  showNewConversation.value = false;
  showFirstMessageModal.value = true;
  firstMessage.value = "";
  firstMessageError.value = "";
}

function cancelFirstMessage() {
  showFirstMessageModal.value = false;
  selectedContact.value = null;
  firstMessage.value = "";
  firstMessageError.value = "";
}

async function sendFirstMessage() {
  if (
    !firstMessage.value.trim() ||
    !selectedContact.value ||
    sendingFirst.value
  )
    return;

  sendingFirst.value = true;
  firstMessageError.value = "";

  try {
    const endpoint =
      selectedContact.value.type === "patient"
        ? "/messages/conversations/with-patient"
        : "/messages/conversations/with-practitioner";

    const body =
      selectedContact.value.type === "patient"
        ? {
            patientId: selectedContact.value.id,
            content: firstMessage.value.trim(),
          }
        : {
            practitioner2Id: selectedContact.value.id,
            content: firstMessage.value.trim(),
          };

    const response = await useAuthenticatedFetch<{
      success: boolean;
      data: { conversationId: string; message: ConversationMessage };
    }>(endpoint, { method: "POST", body });

    if (response.success) {
      showFirstMessageModal.value = false;
      selectedContact.value = null;
      firstMessage.value = "";
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
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// close
function handleClickOutside(event: MouseEvent) {
  if (openMenuId.value) {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-menu]")) {
      openMenuId.value = null;
    }
  }
}

watch(showNewConversation, (value) => {
  if (value) fetchContacts();
});

watch(
  () => route.query.conversationId,
  () => {
    openRequestedConversation();
  },
);

const handleNewMessage = (data: ConversationMessage) => {
  if (
    activeConversation.value &&
    data.conversationId === activeConversationId.value
  ) {
    activeConversation.value.messages.push(data);
    nextTick(() => scrollToBottom());

    useAuthenticatedFetch(
      `/messages/conversations/${data.conversationId}/read`,
      { method: "PATCH" },
    ).catch(() => {});

    //  minus global unread since we read it
    if (messagingStore.unreadCount > 0) {
      messagingStore.unreadCount--;
    }
  }

  const conv = conversations.value.find((c) => c.id === data.conversationId);
  if (conv) {
    conv.lastMessagePreview =
      data.content.length > 100
        ? data.content.substring(0, 100) + "\u2026"
        : data.content;
    conv.lastMessageAt = data.createdAt;
    if (data.conversationId !== activeConversationId.value) {
      conv.unreadCount++;
    }
  } else {
    fetchConversations();
  }
};

const handleMessagesRead = (data: { conversationId: string }) => {
  if (
    activeConversation.value &&
    data.conversationId === activeConversationId.value
  ) {
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

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }
  if (authStore.accessToken) {
    // Ensure WebSocket is connected
    messagingStore.connect();

    try {
      await fetchConversations();
      await openRequestedConversation();
    } catch (error) {
      console.error("Error loading messaging data on mount:", error);
    }

    // ws  connected in layout, register page  handlers
    wsOn("new_message", handleNewMessage);
    wsOn("messages_read", handleMessagesRead);
    wsOn("typing", handleTypingStart);
    wsOn("stop_typing", handleTypingStop);
  }
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  // unregister handlers, layout still have ws if need
  wsOff("new_message", handleNewMessage);
  wsOff("messages_read", handleMessagesRead);
  wsOff("typing", handleTypingStart);
  wsOff("stop_typing", handleTypingStop);
  document.removeEventListener("click", handleClickOutside);
});
</script>
