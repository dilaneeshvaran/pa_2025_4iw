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

  // redirect non staff users to their appropriate dashboard
  if (authStore.user?.role !== "STAFF") {
    const dashboardMap: Record<string, string> = {
      PATIENT: "/patient/dashboard",
      PRACTITIONER: "/practitioner/dashboard",
      CABINET_ADMIN: "/cabinet/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user?.role || ""] || "/";
    return navigateTo(redirectPath);
  }
});
