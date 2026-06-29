<template>
  <div class="flex min-h-screen bg-[#FBFBF9]">
    <!-- sidebar -->
    <aside
      class="fixed left-4 top-4 bottom-4 z-40 w-60 rounded-2xl border border-[#E5E3DC]/60 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <NuxtLink
          to="/admin/dashboard"
          class="flex items-center gap-2.5 border-b border-[#E5E3DC]/40 px-5 py-5 transition-all select-none group"
          aria-label="Aller au tableau de bord administrateur"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm group-hover:scale-105 transition-transform duration-300"
          >
            <ShieldCheck class="h-5 w-5 text-white" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-tight leading-none"><span class="text-[#FF7A00]">Medi</span><span class="text-[#0EA252]">côte</span></span>
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Admin</span>
          </div>
        </NuxtLink>

        <!-- navigation -->
        <nav class="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink
                :to="item.path"
                :class="[
                  'flex items-center gap-3 rounded-xl px-4.5 py-3 text-sm font-semibold transition-all duration-200',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/5 text-orange-700 shadow-sm border-l-4 border-orange-500 pl-3.5'
                    : 'text-[#5C5A52] hover:bg-[#F2EFF7] hover:text-[#1B2321]',
                ]"
              >
                <component :is="item.icon" class="h-4.5 w-4.5" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- user -->
        <div class="border-t border-[#E5E3DC]/40 p-4 bg-[#FAF9F6]/40 rounded-b-2xl">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 shadow-inner"
            >
              <ShieldCheck class="h-4.5 w-4.5 text-orange-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold text-[#1B2321]">
                {{ authStore.user?.email }}
              </p>
              <p class="text-[10px] font-semibold text-[#8C897E] uppercase tracking-wider">Administrateur</p>
            </div>
          </div>
          <button
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200/50 bg-orange-50/40 py-2.5 text-xs font-bold text-orange-600 transition-all hover:bg-orange-100 hover:text-orange-700"
            @click="handleLogout"
          >
            <LogOut class="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>

    <!-- main content -->
    <div class="ml-68 flex-1 flex flex-col min-h-screen">
      <header
        class="sticky top-4 z-30 mx-4 lg:mx-8 mt-4 mb-2 flex justify-end rounded-2xl border border-[#E5E3DC]/60 bg-white/70 px-6 py-3 shadow-sm backdrop-blur-md"
      >
        <CommonNotificationBell />
      </header>
      <main class="flex-1 p-4 lg:p-8">
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
