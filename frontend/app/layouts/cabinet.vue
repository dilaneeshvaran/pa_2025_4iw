<template>
  <div class="flex min-h-screen bg-gray-50">
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
            to="/cabinet/dashboard"
            class="flex flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
            aria-label="Aller au tableau de bord cabinet"
          >
            <span class="font-display text-lg font-bold tracking-tight"><span class="text-orange-500">Medi</span><span class="text-green-600">côte</span></span>
            <span class="rounded-full bg-[#D96F00]/10 px-2 py-0.5 text-[10px] font-medium text-[#D96F00]">Cabinet</span>
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
        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <p class="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Gestion cabinet</p>
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
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- user -->
        <div class="border-t border-gray-100 p-4">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600"
            >
              <Building2 class="h-4 w-4" :stroke-width="1.75" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <span class="inline-flex items-center rounded-full bg-[#D96F00]/10 px-2 py-0.5 text-[10px] font-medium text-[#D96F00]">Cabinet Admin</span>
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
      <main class="p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const route = useRoute();

// mobile drawer state — closed by default, opens above lg via CSS
const sidebarOpen = ref(false);
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") sidebarOpen.value = false;
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
// close the drawer whenever navigation happens (mobile)
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false;
  },
);

const menuItems = [
  {
    path: "/cabinet/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    path: "/cabinet/practitioners",
    label: "Praticiens",
    icon: Users,
  },
  {
    path: "/cabinet/staff",
    label: "Personnel",
    icon: UserPlus,
  },
  {
    path: "/cabinet/settings",
    label: "Informations du cabinet",
    icon: Settings,
  },
];

const isActive = (path: string) => {
  return route.path === path;
};

const handleLogout = async () => {
  authStore.logout();
  await router.push("/auth/login");
};
</script>
