import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed, watch, onMounted, onUnmounted, nextTick, reactive } from "vue";
import MessagesPage from "../messages.vue";

vi.stubGlobal("ref", ref);
vi.stubGlobal("computed", computed);
vi.stubGlobal("watch", watch);
vi.stubGlobal("onMounted", onMounted);
vi.stubGlobal("onUnmounted", onUnmounted);
vi.stubGlobal("nextTick", nextTick);
vi.stubGlobal("reactive", reactive);

vi.stubGlobal("definePageMeta", vi.fn());

const mockRoute = { query: { conversationId: "" } };
const mockRouter = { replace: vi.fn() };

vi.stubGlobal("useRoute", () => mockRoute);
vi.stubGlobal("useRouter", () => mockRouter);

const mockNotificationsStore = {
  fetchUnreadCount: vi.fn(),
};
vi.stubGlobal("useNotificationsStore", () => mockNotificationsStore);

vi.stubGlobal("useRuntimeConfig", () => ({
  public: {
    apiBase: "http://localhost:3000/api",
  },
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    accessToken: "mock-token",
    user: { id: "patient-1" },
    initAuth: vi.fn(),
  }),
}));

vi.mock("~/stores/messaging", () => ({
  useMessagingStore: () => ({
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    fetchUnreadCount: vi.fn(),
  }),
}));

vi.mock("~/stores/notifications", () => ({
  useNotificationsStore: () => mockNotificationsStore,
}));

vi.mock("vue-toastification", () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("useAuthenticatedFetch", mockFetch);

vi.mock("~/utils/date", () => ({
  formatRelativeTime: () => "il y a 2h",
  formatMessageTime: () => "10:00",
  formatDateLabel: () => "2 juillet 2026",
}));

describe("messages.vue - Patient view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query.conversationId = "";
  });

  const mockConversationsList = {
    success: true,
    data: [
      {
        id: "conv-1",
        practitionerId: "prac-1",
        practitionerFirstName: "Jean",
        practitionerLastName: "Dupont",
        practitionerTitle: "Dr",
        practitionerSpecialty: "Médecine générale",
        lastMessagePreview: "Bonjour",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      },
    ],
  };

  const mockConversationDetailEnabled = {
    success: true,
    data: {
      id: "conv-1",
      patientId: "pat-1",
      practitionerId: "prac-1",
      practitioner: {
        id: "prac-1",
        userId: "user-prac-1",
        firstName: "Jean",
        lastName: "Dupont",
        title: "Dr",
        specialty: "Médecine générale",
        messagingEnabled: true,
      },
      patient: {
        id: "pat-1",
        userId: "patient-1",
        firstName: "Aya",
        lastName: "Kouassi",
      },
      messages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          senderUserId: "user-prac-1",
          content: "Bonjour, comment allez-vous?",
          attachments: null,
          status: "READ",
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };

  const mockConversationDetailDisabled = {
    success: true,
    data: {
      id: "conv-1",
      patientId: "pat-1",
      practitionerId: "prac-1",
      practitioner: {
        id: "prac-1",
        userId: "user-prac-1",
        firstName: "Jean",
        lastName: "Dupont",
        title: "Dr",
        specialty: "Médecine générale",
        messagingEnabled: false,
      },
      patient: {
        id: "pat-1",
        userId: "patient-1",
        firstName: "Aya",
        lastName: "Kouassi",
      },
      messages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          senderUserId: "user-prac-1",
          content: "Bonjour, comment allez-vous?",
          attachments: null,
          status: "READ",
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };

  it("should show message input when messaging is enabled for practitioner", async () => {
    mockFetch.mockResolvedValueOnce(mockConversationsList);
    mockFetch.mockResolvedValueOnce(mockConversationDetailEnabled);

    mockRoute.query.conversationId = "conv-1";

    const wrapper = mount(MessagesPage, {
      global: {
        stubs: {
          Lock: true,
          PenSquare: true,
          Search: true,
          MessageSquare: true,
          ArrowLeft: true,
          AlertTriangle: true,
          Paperclip: true,
          X: true,
          Send: true,
        },
      },
    });

    await vi.dynamicImportSettled();
    await nextTick();

    expect(wrapper.find("form").exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);

    expect(wrapper.text()).not.toContain("Messagerie non activée");
    expect(wrapper.text()).not.toContain("Vous ne pouvez pas envoyer de message car ce praticien n'a pas activé la réception de messages");
  });

  it("should show warning banner and hide input when messaging is disabled for practitioner", async () => {
    mockFetch.mockResolvedValueOnce(mockConversationsList);
    mockFetch.mockResolvedValueOnce(mockConversationDetailDisabled);

    mockRoute.query.conversationId = "conv-1";

    const wrapper = mount(MessagesPage, {
      global: {
        stubs: {
          Lock: true,
          PenSquare: true,
          Search: true,
          MessageSquare: true,
          ArrowLeft: true,
          AlertTriangle: true,
          Paperclip: true,
          X: true,
          Send: true,
        },
      },
    });

    await vi.dynamicImportSettled();
    await nextTick();

    expect(wrapper.text()).toContain("Messagerie non activée");
    expect(wrapper.text()).toContain("Vous ne pouvez pas envoyer de message car ce praticien n'a pas activé la réception de messages, mais vous pouvez uniquement recevoir ses messages.");

    expect(wrapper.find("form").exists()).toBe(false);
    expect(wrapper.find("textarea").exists()).toBe(false);
  });
});
