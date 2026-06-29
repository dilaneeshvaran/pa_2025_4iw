<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- sidebar -->
    <aside
      class="fixed left-0 top-0 z-40 h-full w-64 border-r border-black/[0.08] bg-white"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <NuxtLink
          to="/admin/dashboard"
          class="flex items-center gap-3 border-b border-gray-100 px-5 py-4 transition-colors hover:bg-gray-50"
          aria-label="Aller au tableau de bord administrateur"
        >
          <span class="font-display text-lg font-bold tracking-tight"><span class="text-orange-500">Medi</span><span class="text-green-600">côte</span></span>
          <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700">Admin</span>
        </NuxtLink>

        <!-- navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <p class="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Administration</p>
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
              <ShieldCheck class="h-4 w-4" :stroke-width="1.75" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ authStore.user?.email }}
              </p>
              <span class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700">Administrateur</span>
            </div>
          </div>
          <button
            class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900"
            @click="handleLogout"
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
