<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- sidebar -->
    <aside
      class="fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <div
          class="flex items-center gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600"
          >
            <ClipboardList class="h-6 w-6 text-white" />
          </div>
          <div>
            <span class="text-xl font-bold text-gray-900 dark:text-gray-100"
              >MediCote</span
            >
            <p class="text-xs text-green-600 dark:text-green-400">
              Espace Personnel
            </p>
          </div>
          <UiThemeToggle class="ml-auto" />
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
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                ]"
              >
                <component :is="item.icon" class="h-5 w-5" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- user -->
        <div class="border-t border-gray-100 p-4 dark:border-gray-800">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40"
            >
              <ClipboardList
                class="h-5 w-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Personnel</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/40"
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
  ClipboardList,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const menuItems = [
  {
    path: "/staff/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    path: "/staff/agenda",
    label: "Agendas des praticiens",
    icon: Calendar,
  },
  {
    path: "/staff/billing",
    label: "Facturation",
    icon: CreditCard,
  },
  {
    path: "/staff/settings",
    label: "Paramètres",
    icon: Settings,
  },
];

const route = useRoute();
const isActive = (itemPath: string) => {
  if (itemPath === "/staff/dashboard") {
    return route.path === itemPath;
  }
  return route.path.startsWith(itemPath);
};

const handleLogout = async () => {
  authStore.logout();
  await router.push("/auth/login");
};
</script>
