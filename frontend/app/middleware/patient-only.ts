export default defineNuxtRouteMiddleware((to, _from) => {
  // skip during ssr - we cant access localstorage on the server
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

  // block practitioners, staff, cabinet admins, admins from accessing patient only pages
  if (authStore.user.role !== "PATIENT") {
    // redirect to their appropriate dashboard
    const dashboardMap: Record<string, string> = {
      PRACTITIONER: "/practitioner/dashboard",
      STAFF: "/staff/dashboard",
      CABINET_ADMIN: "/cabinet/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user.role] || "/";
    return navigateTo(redirectPath);
  }
});
