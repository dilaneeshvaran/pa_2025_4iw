import { ref, onUnmounted } from "vue";
import { useAuthStore } from "~/stores/auth";

export interface WsMessage {
  type: string;
  data: unknown;
}

export function useMessagingSocket() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const listeners = new Map<string, Set<Function>>();

  const connect = () => {
    if (socket.value?.readyState === WebSocket.OPEN) return;

    const token = authStore.accessToken;
    if (!token) return;

    // Build ws url from api basse
    const apiBase = config.public.apiBase as string;
    const wsBase = apiBase.replace(/^http/, "ws").replace(/\/api$/, "");
    const wsUrl = `${wsBase}/api/ws/messages?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        const handlers = listeners.get(msg.type);
        if (handlers) {
          handlers.forEach((handler) => handler(msg.data));
        }
      } catch {
        // ignore mal formed messages
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      // reconnect after 3s
      setTimeout(() => {
        if (authStore.isAuthenticated) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    socket.value = ws;
  };

  const disconnect = () => {
    socket.value?.close();
    socket.value = null;
    isConnected.value = false;
  };

  const send = (data: object) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(data));
    }
  };

  const on = <T = unknown>(type: string, handler: (data: T) => void) => {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(handler);
  };

  const off = <T = unknown>(type: string, handler: (data: T) => void) => {
    listeners.get(type)?.delete(handler);
  };

  onUnmounted(() => {
    disconnect();
  });

  // keep alive ping every 30s
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  const startPing = () => {
    pingInterval = setInterval(() => {
      send({ type: "ping" });
    }, 30000);
  };

  const stopPing = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  };

  on("connected", () => {
    startPing();
  });

  onUnmounted(() => {
    stopPing();
  });

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    send,
    on,
    off,
  };
}
