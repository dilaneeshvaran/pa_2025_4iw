import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useAuthStore } from "~/stores/auth";

// ws connection for everyone
// many layout ( unread badge and messages pages).
export const useMessagingStore = defineStore("messaging", () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const unreadCount = ref(0);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const listeners = new Map<string, Set<Function>>();

  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let intentionalClose = false;

  async function connect() {
    if (socket.value?.readyState === WebSocket.OPEN) return;
    if (socket.value?.readyState === WebSocket.CONNECTING) return;

    if (authStore.isTokenExpired && authStore.refreshToken) {
      try {
        await authStore.refresh();
      } catch (err) {
        console.error("Failed to refresh token before WS connection:", err);
        return;
      }
    }

    const token = authStore.accessToken;
    if (!token) return;

    intentionalClose = false;

    const apiBase = config.public.apiBase as string;
    let wsUrl = "";
    if (apiBase.startsWith("/")) {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsBase = apiBase.replace(/\/api\/?$/, "");
      wsUrl = `${proto}//${host}${wsBase}/api/ws/messages?token=${encodeURIComponent(token)}`;
    } else {
      const wsBase = apiBase.replace(/^http/, "ws").replace(/\/api\/?$/, "");
      wsUrl = `${wsBase}/api/ws/messages?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
      startPing();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as {
          type: string;
          data: unknown;
        };
        const handlers = listeners.get(msg.type);
        if (handlers) {
          handlers.forEach((handler) => handler(msg.data));
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      stopPing();

      if (!intentionalClose && authStore.isAuthenticated) {
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    socket.value = ws;
  }

  function disconnect() {
    intentionalClose = true;
    stopPing();
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    socket.value?.close();
    socket.value = null;
    isConnected.value = false;
  }

  function send(data: object) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(data));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function on(type: string, handler: Function) {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function off(type: string, handler: Function) {
    listeners.get(type)?.delete(handler);
  }

  //keep alive ping pong
  function startPing() {
    stopPing();
    pingInterval = setInterval(() => {
      send({ type: "ping" });
    }, 30000);
  }

  function stopPing() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await $fetch<{
        success: boolean;
        data: { count: number };
      }>("/messages/unread-count", {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
      });
      if (response.success) {
        unreadCount.value = response.data.count;
      }
    } catch {
      // silent fail
    }
  }

  // reconnect/disconnect automatically when access token changes (e.g. refreshed or logged out)
  watch(
    () => authStore.accessToken,
    (newToken) => {
      if (!newToken) {
        disconnect();
      } else {
        disconnect();
        connect();
      }
    }
  );

  return {
    socket,
    isConnected,
    unreadCount,
    connect,
    disconnect,
    send,
    on,
    off,
    fetchUnreadCount,
  };
});
