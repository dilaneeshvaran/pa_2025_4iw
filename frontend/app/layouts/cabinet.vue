<template>
  <div class="flex min-h-screen bg-[#FBFBF9]">
    <!-- sidebar -->
    <aside
      class="fixed left-4 top-4 bottom-4 z-40 w-60 rounded-2xl border border-[#E5E3DC]/60 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300"
    >
      <div class="flex h-full flex-col">
        <!-- logo -->
        <NuxtLink
          to="/cabinet/dashboard"
          class="flex items-center gap-2.5 border-b border-[#E5E3DC]/40 px-5 py-5 transition-all select-none group"
          aria-label="Aller au tableau de bord cabinet"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-sm group-hover:scale-105 transition-transform duration-300"
          >
            <Building2 class="h-5 w-5 text-white" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-tight leading-none"><span class="text-[#FF7A00]">Medi</span><span class="text-[#0EA252]">côte</span></span>
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cabinet</span>
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
                    ? 'bg-gradient-to-r from-green-600/10 to-emerald-500/5 text-green-700 shadow-sm border-l-4 border-green-600 pl-3.5'
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
              class="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 shadow-inner"
            >
              <Building2 class="h-4.5 w-4.5 text-green-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold text-[#1B2321]">
                {{ authStore.user?.email }}
              </p>
              <p class="text-[10px] font-semibold text-[#8C897E] uppercase tracking-wider">Admin Cabinet</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200/50 bg-orange-50/40 py-2.5 text-xs font-bold text-orange-600 transition-all hover:bg-orange-100 hover:text-orange-700"
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
  UserPlus,
  Building2,
  Settings,
  LogOut,
} from "lucide-vue-next";
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

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
  const route = useRoute();
  return route.path === path;
};

const handleLogout = async () => {
  authStore.logout();
  await router.push("/auth/login");
};
</script>
