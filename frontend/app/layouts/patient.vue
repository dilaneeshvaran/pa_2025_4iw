<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- sidebar -->
    <aside
      class="fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 bg-white shadow-sm"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <div class="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500"
          >
            <Heart class="h-6 w-6 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900">MediCôte</span>
        </div>

        <!-- navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink
                :to="item.path"
                :class="[
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                <component :is="item.icon" class="h-5 w-5" />
                {{ item.label }}
                <span
                  v-if="
                    item.path === '/patient/messages' &&
                    messagingStore.unreadCount > 0
                  "
                  class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-semibold text-white"
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
              class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
            >
              <User class="h-5 w-5 text-green-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500">Patient</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-orange-600 transition-colors hover:bg-orange-50"
          >
            <LogOut class="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>

    <!-- main content -->
    <div class="ml-64 flex-1">
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
const authStore = useAuthStore();
const messagingStore = useMessagingStore();

// ws connection + unread badge
const onNewMessage = () => {
  messagingStore.unreadCount++;
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
