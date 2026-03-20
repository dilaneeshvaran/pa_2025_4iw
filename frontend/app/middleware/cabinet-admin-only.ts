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

  // redirect non cabinet-admin users to their appropriate dashboard
  if (authStore.user.role !== "CABINET_ADMIN") {
    const dashboardMap: Record<string, string> = {
      PATIENT: "/patient/dashboard",
      PRACTITIONER: "/practitioner/dashboard",
      STAFF: "/staff/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user.role] || "/";
    return navigateTo(redirectPath);
  }
});
