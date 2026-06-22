<template>
  <div ref="root" class="relative" @keydown.escape="isOpen = false">
    <button
      type="button"
      class="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      :aria-label="bellLabel"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <Bell class="h-5 w-5" />
      <span
        v-if="notificationsStore.unreadCount > 0"
        class="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-[11px] font-semibold text-white ring-2 ring-white"
      >
        {{ badgeCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
      role="menu"
      aria-label="Notifications"
    >
      <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p class="text-sm font-semibold text-gray-900">Notifications</p>
          <p class="text-xs text-gray-500">
            {{ notificationsStore.unreadCount }} non lue{{
              notificationsStore.unreadCount > 1 ? "s" : ""
            }}
          </p>
        </div>
        <button
          v-if="notificationsStore.unreadCount > 0"
          type="button"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-orange-700 transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
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
        class="flex gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{{ notificationsStore.error }}</span>
      </div>

      <div
        v-if="notificationsStore.loading && !notificationsStore.loaded"
        class="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500"
      >
        <Loader2 class="h-4 w-4 animate-spin" />
        Chargement des notifications
      </div>

      <div
        v-else-if="notificationsStore.notifications.length === 0"
        class="px-4 py-8 text-center"
      >
        <Bell class="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p class="text-sm font-medium text-gray-700">Aucune notification</p>
        <p class="mt-1 text-xs text-gray-500">
          Les alertes importantes apparaîtront ici.
        </p>
      </div>

      <div v-else class="max-h-96 overflow-y-auto py-1">
        <button
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          type="button"
          class="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
          :class="notification.read ? 'bg-white' : 'bg-green-50/60'"
          role="menuitem"
          @click="openNotification(notification)"
        >
          <span
            class="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
            :class="notification.read ? 'bg-gray-200' : 'bg-green-600'"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900">
              {{ notification.title }}
            </span>
            <span class="mt-0.5 line-clamp-2 block text-sm text-gray-600">
              {{ notification.message }}
            </span>
            <span class="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
              <Clock class="h-3.5 w-3.5" />
              {{ formatNotificationDate(notification.createdAt) }}
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
import {
  useNotificationsStore,
  type AppNotification,
} from "~/stores/notifications";
import { getNotificationTarget } from "~/utils/notificationTargets";

const router = useRouter();
const root = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const markingAll = ref(false);
const statusMessage = ref("");
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

let pollInterval: ReturnType<typeof setInterval> | null = null;

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
  const role = authStore.user?.role ?? "PATIENT";
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
  pollInterval = setInterval(() => {
    notificationsStore.fetchUnreadCount();
  }, 60000);
  document.addEventListener("click", handleDocumentClick);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  document.removeEventListener("click", handleDocumentClick);
});
</script>
