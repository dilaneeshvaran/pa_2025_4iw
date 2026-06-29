<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- sidebar -->
    <aside
      class="fixed left-0 top-0 z-40 h-full w-64 border-r border-black/[0.08] bg-white"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <NuxtLink
          to="/patient/dashboard"
          class="flex items-center gap-3 border-b border-gray-100 px-5 py-4 transition-colors hover:bg-gray-50"
          aria-label="Aller au tableau de bord patient"
        >
          <span class="font-display text-lg font-bold tracking-tight"><span class="text-orange-500">Medi</span><span class="text-green-600">côte</span></span>
        </NuxtLink>

        <!-- navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <p class="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Navigation</p>
          <ul class="space-y-0.5">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink
                :to="item.path"
                :class="[
                  'flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-all duration-150',
                  isActive(item.path)
                    ? 'border-l-2 border-[#00804A] bg-[#00804A]/10 pl-[calc(0.75rem-2px)] font-semibold text-[#00804A]'
                    : 'font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                ]"
              >
                <component :is="item.icon" class="h-4 w-4" :stroke-width="1.75" />
                {{ item.label }}
                <span
                  v-if="
                    item.path === '/patient/messages' &&
                    messagingStore.unreadCount > 0
                  "
                  class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00804A] px-1.5 text-[11px] font-semibold text-white"
                >
                  {{
                    messagingStore.unreadCount > 99
                      ? "99+"
                      : messagingStore.unreadCount
                  }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- user  -->
        <div class="border-t border-gray-100 p-4">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600"
            >
              <User class="h-4 w-4" :stroke-width="1.75" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <span class="inline-flex items-center rounded-full bg-[#00804A]/10 px-2 py-0.5 text-[10px] font-medium text-[#00804A]">Patient</span>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut class="h-4 w-4" :stroke-width="1.75" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>

    <!-- main content -->
    <div class="ml-64 flex-1">
      <header
        class="sticky top-0 z-30 flex justify-end border-b border-black/[0.08] bg-gray-50/95 px-6 py-3 backdrop-blur"
      >
        <CommonNotificationBell />
      </header>
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  FileText,
  ClipboardList,
  MessageSquare,
  Settings,
  Heart,
  User,
  LogOut,
  Search,
  Video,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { useMessagingStore } from "~/stores/messaging";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const messagingStore = useMessagingStore();

// ws connection + unread badge
const onNewMessage = (message: any) => {
  const isMessagePage = route.path.includes("/messages");
  const activeConvId = route.query.conversationId;
  const isViewingThisConversation =
    isMessagePage &&
    activeConvId &&
    message &&
    String(activeConvId) === String(message.conversationId);

  if (!isViewingThisConversation) {
    messagingStore.unreadCount++;
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    messagingStore.connect();
    messagingStore.fetchUnreadCount();
    messagingStore.on("new_message", onNewMessage);
  }
});

onUnmounted(() => {
  messagingStore.off("new_message", onNewMessage);
  messagingStore.disconnect();
});

const menuItems = [
  {
    path: "/patient/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  { path: "/search", label: "Rechercher un praticien", icon: Search },
  { path: "/patient/appointments", label: "Mes rendez-vous", icon: Calendar },
  {
    path: "/patient/teleconsultations",
    label: "Téléconsultations",
    icon: Video,
  },
  {
    path: "/patient/medical-record",
    label: "Mon dossier médical",
    icon: ClipboardList,
  },
  { path: "/patient/documents", label: "Mes documents", icon: FileText },
  { path: "/patient/messages", label: "Messagerie", icon: MessageSquare },
  { path: "/patient/billing", label: "Factures & Paiements", icon: CreditCard },
  { path: "/patient/settings", label: "Paramètres", icon: Settings },
];

const isActive = (path: string) => {
  const route = useRoute();
  return route.path === path;
};

const handleLogout = async () => {
  authStore.logout();
  await router.push("/auth/login");
};
</script>
