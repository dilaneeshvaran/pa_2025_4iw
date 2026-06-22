<template>
  <div class="flex min-h-screen bg-gray-50">
    <aside
      class="fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 bg-white shadow-sm"
    >
      <div class="flex h-full flex-col">
        <NuxtLink
          to="/admin/dashboard"
          class="flex items-center gap-3 border-b border-gray-100 px-6 py-5 transition-colors hover:bg-orange-50"
          aria-label="Aller au tableau de bord administrateur"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500"
          >
            <ShieldCheck class="h-6 w-6 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900">MediCôte Admin</span>
        </NuxtLink>

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
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- user -->
        <div class="border-t border-gray-100 p-4">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"
            >
              <ShieldCheck class="h-5 w-5 text-orange-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500">Administrateur</p>
            </div>
          </div>
          <button
            class="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-orange-600 transition-colors hover:bg-orange-50"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>

    <div class="ml-64 flex-1">
      <header
        class="sticky top-0 z-30 flex justify-end border-b border-gray-200 bg-gray-50/95 px-6 py-3 backdrop-blur"
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
  Users,
  BadgeCheck,
  CreditCard,
  AlertTriangle,
  Send,
  BarChart3,
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const menuItems = [
  { path: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/admin/users", label: "Gestion utilisateurs", icon: Users },
  {
    path: "/admin/validations",
    label: "Validation professionnels",
    icon: BadgeCheck,
  },
  {
    path: "/admin/subscriptions",
    label: "Gestion abonnements",
    icon: CreditCard,
  },
  {
    path: "/admin/no-shows",
    label: "No-Shows & Sanctions",
    icon: AlertTriangle,
  },
  { path: "/admin/campaigns", label: "Messages groupés", icon: Send },
  {
    path: "/admin/statistics",
    label: "Statistiques globales",
    icon: BarChart3,
  },
  { path: "/admin/audit-logs", label: "Logs d'audit", icon: ScrollText },
  { path: "/admin/settings", label: "Paramètres", icon: Settings },
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
