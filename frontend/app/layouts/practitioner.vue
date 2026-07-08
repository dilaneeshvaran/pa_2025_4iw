<template>
  <div class="flex min-h-screen bg-gray-50">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <!-- mobile backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <!-- sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 z-50 h-full w-64 border-r border-black/[0.08] bg-white transition-transform duration-200 ease-out lg:z-40 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <div class="flex items-center border-b border-gray-100">
          <NuxtLink
            to="/practitioner/dashboard"
            class="flex flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
            aria-label="Aller au tableau de bord praticien"
          >
            <span class="font-display text-lg font-bold tracking-tight"><span class="text-orange-500">Medi</span><span class="text-green-600">côte</span></span>
          </NuxtLink>
          <button
            type="button"
            class="mr-2 flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            aria-label="Fermer le menu"
            @click="sidebarOpen = false"
          >
            <X class="h-5 w-5" :stroke-width="1.75" />
          </button>
        </div>

        <!-- navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
          <p class="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">Espace praticien</p>
          <ul class="space-y-0.5">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink
                :to="item.path"
                :aria-current="isActive(item.path) ? 'page' : undefined"
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
                    item.path === '/practitioner/messages' &&
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
              <Stethoscope class="h-4 w-4" :stroke-width="1.75" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <span class="inline-flex items-center rounded-full bg-[#00804A]/10 px-2 py-0.5 text-[10px] font-medium text-[#00804A]">Praticien</span>
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
    <div class="min-w-0 flex-1 overflow-x-hidden lg:ml-64">
      <header
        class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/[0.08] bg-gray-50/95 px-4 py-3 backdrop-blur sm:px-6"
      >
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          aria-label="Ouvrir le menu"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <Menu class="h-5 w-5" :stroke-width="1.75" />
        </button>
        <CommonNotificationBell class="ml-auto" />
      </header>
      <main id="main-content" tabindex="-1" class="p-4 sm:p-6 focus:outline-none">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Video,
  CreditCard,
  BarChart3,
  Globe,
  Settings,
  Heart,
  Stethoscope,
  Building,
  LogOut,
  UserPlus,
  Menu,
  X,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";
import { useMessagingStore } from "~/stores/messaging";

const router = useRouter();
const authStore = useAuthStore();
const messagingStore = useMessagingStore();

// mobile drawer state — closed by default, opens above lg via CSS
const sidebarOpen = ref(false);

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") sidebarOpen.value = false;
};

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
  window.addEventListener("keydown", onKeydown);
  if (authStore.isAuthenticated) {
    messagingStore.connect();
    messagingStore.fetchUnreadCount();
    messagingStore.on("new_message", onNewMessage);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  messagingStore.off("new_message", onNewMessage);
  messagingStore.disconnect();
});

const menuItems = [
  {
    path: "/practitioner/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  { path: "/practitioner/agenda", label: "Agenda", icon: Calendar },
  {
    path: "/practitioner/cabinet-appointments",
    label: "Consultations au cabinet",
    icon: Stethoscope,
  },
  {
    path: "/practitioner/teleconsultations",
    label: "Téléconsultations",
    icon: Video,
  },
  { path: "/practitioner/patients", label: "Patients", icon: Users },
  { path: "/practitioner/cabinets", label: "Mes Cabinets", icon: Building },
  { path: "/practitioner/staff", label: "Mon personnel", icon: UserPlus },
  { path: "/practitioner/messages", label: "Messages", icon: MessageSquare },
  { path: "/practitioner/billing", label: "Facturation", icon: CreditCard },
  { path: "/practitioner/statistics", label: "Statistiques", icon: BarChart3 },
  { path: "/practitioner/public-profile", label: "Profil public", icon: Globe },
  { path: "/practitioner/settings", label: "Paramètres", icon: Settings },
];

const route = useRoute();

// close the drawer whenever navigation happens (mobile)
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false;
  },
);

const isActive = (path: string) => {
  if (path === "/practitioner/dashboard") {
    return route.path === path;
  }
  return route.path.startsWith(path);
};

const handleLogout = async () => {
  authStore.logout();
  await router.push("/auth/login");
};
</script>
