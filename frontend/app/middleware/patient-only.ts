export default defineNuxtRouteMiddleware((to, _from) => {
  // skip during ssr - we cant access localstorage on the server
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // init auth state from localstorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // block practitioners, staff, cabinet admins, admins from accessing patient only pages
  if (authStore.user?.role !== "PATIENT") {
    // redirect to their appropriate dashboard
    const dashboardMap: Record<string, string> = {
      PRACTITIONER: "/practitioner/dashboard",
      STAFF: "/staff/dashboard",
      CABINET_ADMIN: "/cabinet/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user?.role || ""] || "/";
    return navigateTo(redirectPath);
  }
});
