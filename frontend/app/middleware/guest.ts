export default defineNuxtRouteMiddleware((_to, _from) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // init auth state from localstorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // check if token is expired
  if (authStore.isAuthenticated && authStore.isTokenExpired) {
    authStore.logout();
  }

  if (authStore.isAuthenticated) {
    // if user is not verified, redirect to verification notice
    if (authStore.user && !authStore.user.emailVerified) {
      return navigateTo("/auth/verify-email-notice");
    }

    // redirect to dashboard based on role
    const dashboardMap: Record<string, string> = {
      PATIENT: "/patient/dashboard",
      PRACTITIONER: "/practitioner/dashboard",
      STAFF: "/staff/dashboard",
      CABINET_ADMIN: "/cabinet/dashboard",
      ADMIN: "/admin/dashboard",
    };

    const redirectPath = dashboardMap[authStore.user?.role || ""] || "/";
    return navigateTo(redirectPath);
  }
});
