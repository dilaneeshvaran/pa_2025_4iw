export default defineNuxtRouteMiddleware((to, _from) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // redirect non cabinet-admin users to their appropriate dashboard
  if (authStore.user?.role !== "CABINET_ADMIN") {
    const dashboardMap: Record<string, string> = {
      PATIENT: "/patient/dashboard",
      PRACTITIONER: "/practitioner/dashboard",
      STAFF: "/staff/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user?.role || ""] || "/";
    return navigateTo(redirectPath);
  }
});
