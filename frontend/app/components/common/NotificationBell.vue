<template>
  <div ref="root" class="relative" @keydown.escape="isOpen = false">
    <button
      type="button"
      class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/[0.08] bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 shadow-[0_1px_2px_rgba(26,21,16,0.05)] transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00804A]/40 active:scale-[0.98]"
      :aria-label="bellLabel"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <Bell class="h-4.5 w-4.5" :stroke-width="1.75" />
      <span
        v-if="notificationsStore.unreadCount > 0"
        class="absolute -right-1 -top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#00804A] px-1 text-[9px] font-bold text-white ring-2 ring-white"
      >
        {{ badgeCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-black/[0.08] bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      role="menu"
      aria-label="Notifications"
    >
      <div class="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div>
          <p class="font-display text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ notificationsStore.unreadCount }} non lue{{
              notificationsStore.unreadCount > 1 ? "s" : ""
            }}
          </p>
        </div>
        <button
          v-if="notificationsStore.unreadCount > 0"
          type="button"
          class="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[#D96F00] dark:text-orange-300 transition-colors hover:bg-[#D96F00]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96F00]/20 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="markingAll"
          @click="markAllAsRead"
        >
          <Loader2 v-if="markingAll" class="h-3.5 w-3.5 animate-spin" />
          <CheckCheck v-else class="h-3.5 w-3.5" />
          Tout lire
        </button>
      </div>

      <div
        v-if="notificationsStore.error"
        class="flex gap-2 border-b border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs text-red-700 dark:text-red-300"
      >
        <AlertCircle class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>{{ notificationsStore.error }}</span>
      </div>

      <div
        v-if="notificationsStore.loading && !notificationsStore.loaded"
        class="flex items-center justify-center gap-2 px-4 py-8 text-xs text-gray-500 dark:text-gray-400"
      >
        <Loader2 class="h-3.5 w-3.5 animate-spin" />
        Chargement des notifications
      </div>

      <div
        v-else-if="notificationsStore.notifications.length === 0"
        class="px-4 py-8 text-center"
      >
        <Bell class="mx-auto mb-3 h-8 w-8 text-gray-300 opacity-60" :stroke-width="1.25" />
        <p class="font-display text-sm font-semibold text-gray-700 dark:text-gray-300">Aucune notification</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Les alertes importantes apparaîtront ici.
        </p>
      </div>

      <div v-else class="max-h-96 overflow-y-auto py-1">
        <button
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          type="button"
          class="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 focus:outline-none"
          :class="notification.read ? 'bg-white dark:bg-gray-900' : 'bg-[#00804A]/5'"
          role="menuitem"
          @click="openNotification(notification)"
        >
          <span
            class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
            :class="notification.read ? 'bg-gray-200' : 'bg-[#00804A]'"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ notification.title }}
            </span>
            <span class="mt-0.5 line-clamp-2 block text-xs text-gray-600 dark:text-gray-400">
              {{ notification.message }}
            </span>
            <span class="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
              <Clock class="h-3.5 w-3.5" :stroke-width="1.75" />
              <span class="tabular-nums">{{ formatNotificationDate(notification.createdAt) }}</span>
            </span>
          </span>
        </button>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Clock,
  Loader2,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { useMessagingStore } from "~/stores/messaging";
import {
  useNotificationsStore,
  type AppNotification,
} from "~/stores/notifications";
import { getNotificationTarget } from "~/utils/notificationTargets";

const router = useRouter();
const route = useRoute();
const root = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const markingAll = ref(false);
const statusMessage = ref("");
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();
const messagingStore = useMessagingStore();

let pollInterval: ReturnType<typeof setInterval> | null = null;

const handleNewNotification = (notification: any) => {
  const isMessagePage = route.path.includes("/messages");
  const activeConvId = route.query.conversationId;
  const isViewingThisConversation =
    isMessagePage &&
    activeConvId &&
    notification.metadata?.conversationId &&
    String(activeConvId) === String(notification.metadata.conversationId);

  if (notification.type === "MESSAGE_RECEIVED" && isViewingThisConversation) {
    // Already viewing this conversation, do not show or track this message notification
    return;
  }

  // Check if notification already exists in the list to avoid duplicates
  if (notificationsStore.notifications.some((n) => n.id === notification.id)) {
    return;
  }

  notificationsStore.notifications.unshift(notification);
  if (!notification.read) {
    notificationsStore.unreadCount++;
  }
};


const badgeCount = computed(() =>
  notificationsStore.unreadCount > 99
    ? "99+"
    : notificationsStore.unreadCount.toString(),
);

const bellLabel = computed(() =>
  notificationsStore.unreadCount > 0
    ? `Ouvrir les notifications, ${notificationsStore.unreadCount} non lues`
    : "Ouvrir les notifications",
);

const toggle = async () => {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    await notificationsStore.fetchNotifications();
  }
};

const markAllAsRead = async () => {
  markingAll.value = true;
  statusMessage.value = "";

  try {
    await notificationsStore.markAllAsRead();
    statusMessage.value = "Toutes les notifications ont été marquées comme lues.";
  } catch {
    statusMessage.value =
      "Impossible de marquer les notifications comme lues pour le moment.";
  } finally {
    markingAll.value = false;
  }
};

const openNotification = async (notification: AppNotification) => {
  const role = authStore.currentRole ?? "PATIENT";
  const target = getNotificationTarget(notification, role);
  isOpen.value = false;

  try {
    await notificationsStore.markAsRead(notification.id);
  } catch {
    statusMessage.value =
      "La notification n'a pas pu être marquée comme lue automatiquement.";
  }

  await router.push(target);
};

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target;

  if (target instanceof Node && root.value && !root.value.contains(target)) {
    isOpen.value = false;
  }
};

const formatNotificationDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

onMounted(() => {
  notificationsStore.refresh();
  if (authStore.isAuthenticated) {
    messagingStore.connect();
    messagingStore.on("new_notification", handleNewNotification);
  }
  pollInterval = setInterval(() => {
    if (authStore.isAuthenticated) {
      notificationsStore.fetchUnreadCount();
    }
  }, 60000);
  document.addEventListener("click", handleDocumentClick);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  messagingStore.off("new_notification", handleNewNotification);
  document.removeEventListener("click", handleDocumentClick);
});
</script>
