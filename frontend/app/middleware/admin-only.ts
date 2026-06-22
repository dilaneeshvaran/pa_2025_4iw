import { getDashboardPath } from "~/utils/authNavigation";

export default defineNuxtRouteMiddleware((to, _from) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // auth check is handled by global middleware
  // this middleware only checks role authorization

  if (!authStore.isAuthenticated || !authStore.user) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // redirect non admin users to their appropriate dashboard
  if (authStore.user.role !== "ADMIN") {
    return navigateTo(getDashboardPath(authStore.user.role));
  }
});
