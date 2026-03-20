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

  // redirect non practitioner users to their appropriate dashboard
  if (authStore.user.role !== "PRACTITIONER") {
    const dashboardMap: Record<string, string> = {
      PATIENT: "/patient/dashboard",
      STAFF: "/staff/dashboard",
      CABINET_ADMIN: "/cabinet/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user.role] || "/";
    return navigateTo(redirectPath);
  }
});
