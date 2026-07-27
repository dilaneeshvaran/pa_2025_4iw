import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useMedibotSession } from "~/composables/useMedibotSession";
import type {
  MedibotMessage,
  MedibotAction,
  MedibotSendResponse,
} from "~/types/medibot";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useMedibotStore = defineStore("medibot", () => {
  const isOpen = ref(false);
  const isConfigured = ref(true);
  const isLoading = ref(false);
  const conversationId = ref<string | null>(null);
  const messages = ref<MedibotMessage[]>([]);
  const historyLoaded = ref(false);

  const authStore = useAuthStore();
  const { getSessionId } = useMedibotSession();

  const hasMessages = computed(() => messages.value.length > 0);

  // Whether Medibot is available to the current user. Anonymous visitors and
  // patients may use it; other authenticated roles may not.
  const isAvailable = computed(() => {
    const role = authStore.currentRole;
    return !role || role === "PATIENT";
  });

  function apiBase(): string {
    return useRuntimeConfig().public.apiBase as string;
  }

  async function authedHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "x-timezone-offset": new Date().getTimezoneOffset().toString(),
    };
    if (authStore.isAuthenticated && authStore.accessToken) {
      if (authStore.isTokenExpired && authStore.refreshToken) {
        try {
          await authStore.refresh();
        } catch {
          /* fall through as anonymous */
        }
      }
      if (authStore.accessToken) {
        headers.Authorization = `Bearer ${authStore.accessToken}`;
      }
    }
    return headers;
  }

  function open() {
    isOpen.value = true;
    if (!historyLoaded.value) loadHistory();
  }
  function close() {
    isOpen.value = false;
  }
  function toggle() {
    isOpen.value ? close() : open();
  }

  async function checkStatus() {
    try {
      const res = await $fetch<{ success: boolean; data: { configured: boolean } }>(
        "/medibot/status",
        { baseURL: apiBase() },
      );
      isConfigured.value = res.data.configured;
    } catch {
      isConfigured.value = false;
    }
  }

  async function loadHistory() {
    historyLoaded.value = true;
    try {
      const headers = await authedHeaders();
      const query = authStore.isAuthenticated
        ? ""
        : `?sessionId=${encodeURIComponent(getSessionId())}`;
      const res = await $fetch<{
        success: boolean;
        data: { conversationId: string | null; messages: MedibotMessage[] };
      }>(`/medibot/conversation${query}`, { baseURL: apiBase(), headers });
      if (res.data.conversationId) {
        conversationId.value = res.data.conversationId;
        messages.value = res.data.messages.map((m) => ({
          ...m,
          actions: m.actions ?? [],
        }));
      }
    } catch {
      /* silent — start fresh */
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading.value) return;

    messages.value.push({
      id: newId(),
      role: "user",
      content: trimmed,
      actions: [],
    });

    const pendingId = newId();
    messages.value.push({
      id: pendingId,
      role: "assistant",
      content: "",
      actions: [],
      pending: true,
    });
    isLoading.value = true;

    try {
      const headers = await authedHeaders();
      const res = await $fetch<MedibotSendResponse>("/medibot/message", {
        baseURL: apiBase(),
        method: "POST",
        headers,
        body: {
          message: trimmed,
          sessionId: authStore.isAuthenticated ? undefined : getSessionId(),
          conversationId: conversationId.value ?? undefined,
        },
      });
      conversationId.value = res.data.conversationId;
      const idx = messages.value.findIndex((m) => m.id === pendingId);
      if (idx !== -1) {
        messages.value[idx] = {
          id: pendingId,
          role: "assistant",
          content: res.data.message,
          actions: res.data.actions ?? [],
        };
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; statusCode?: number };
      const idx = messages.value.findIndex((m) => m.id === pendingId);
      if (idx !== -1) {
        messages.value[idx] = {
          id: pendingId,
          role: "assistant",
          content:
            e.data?.message ||
            "Désolé, je rencontre un petit souci. Pouvez-vous réessayer ?",
          actions: [],
          error: true,
        };
      }
    } finally {
      isLoading.value = false;
    }
  }

  // Called by the UI after a successful login/signup inside the chat: link the
  // anonymous thread to the patient and reload the (now unified) history.
  async function onAuthenticated() {
    try {
      const headers = await authedHeaders();
      await $fetch("/medibot/link", {
        baseURL: apiBase(),
        method: "POST",
        headers,
        body: { sessionId: getSessionId() },
      });
    } catch {
      /* non-fatal */
    }
    historyLoaded.value = false;
    await loadHistory();
  }

  // Push a locally-authored assistant note (e.g. after an inline action) without
  // a round-trip. Used for confirmations like "Rendez-vous confirmé ✓".
  function pushSystemNote(content: string, actions: MedibotAction[] = []) {
    messages.value.push({
      id: newId(),
      role: "assistant",
      content,
      actions,
    });
  }

  // Push a locally-authored user note (e.g. the "[Document envoyé]" echo).
  function pushUserNote(content: string) {
    messages.value.push({ id: newId(), role: "user", content, actions: [] });
  }

  function resetLocal() {
    messages.value = [];
    conversationId.value = null;
    historyLoaded.value = false;
  }

  return {
    isOpen,
    isConfigured,
    isLoading,
    conversationId,
    messages,
    hasMessages,
    isAvailable,
    open,
    close,
    toggle,
    checkStatus,
    loadHistory,
    sendMessage,
    onAuthenticated,
    pushSystemNote,
    pushUserNote,
    resetLocal,
  };
});
