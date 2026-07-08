import { defineStore } from "pinia";
import { ref } from "vue";

export type AppNotificationMetadata = Record<string, unknown> | null;

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: AppNotificationMetadata;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export const toMetadataRecord = (metadata: unknown): AppNotificationMetadata => {
  if (
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata)
  ) {
    return metadata as Record<string, unknown>;
  }

  return null;
};

export const normalizeNotification = (
  notification: ApiNotification,
): AppNotification => ({
  ...notification,
  metadata: toMetadataRecord(notification.metadata),
});

export const useNotificationsStore = defineStore("notifications", () => {
  const notifications = ref<AppNotification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loaded = ref(false);

  async function fetchNotifications(limit = 20) {
    loading.value = true;
    error.value = null;

    try {
      const response = await useAuthenticatedFetch<
        ApiEnvelope<ApiNotification[]>
      >(`/notifications?limit=${limit}`);

      if (response.success) {
        notifications.value = response.data.map(normalizeNotification);
        loaded.value = true;
      }
    } catch {
      error.value = "Impossible de charger les notifications.";
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await useAuthenticatedFetch<
        ApiEnvelope<{ count: number }>
      >("/notifications/unread-count");

      if (response.success) {
        unreadCount.value = response.data.count;
      }
    } catch {
      // Le badge de notifications ne doit pas bloquer la navigation.
    }
  }

  async function refresh() {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }

  async function markAsRead(notificationId: string) {
    const notification = notifications.value.find(
      (item) => item.id === notificationId,
    );

    if (!notification || notification.read) return;

    await useAuthenticatedFetch(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });

    notification.read = true;
    notification.readAt = new Date().toISOString();
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }

  async function markAllAsRead() {
    const response = await useAuthenticatedFetch<ApiEnvelope<{ count: number }>>(
      "/notifications/read-all",
      { method: "PUT" },
    );

    if (response.success) {
      const readAt = new Date().toISOString();
      notifications.value = notifications.value.map((notification) => ({
        ...notification,
        read: true,
        readAt: notification.readAt ?? readAt,
      }));
      unreadCount.value = 0;
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loaded,
    fetchNotifications,
    fetchUnreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
  };
});
