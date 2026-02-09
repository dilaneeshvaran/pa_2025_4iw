export default defineNuxtRouteMiddleware((_to, _from) => {
  // skip during ssr - we cant access localstorage on the server
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // init auth state from localstorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // if already authenticated, redirect to home or appropriate dashboard
  if (authStore.isAuthenticated) {
    const redirectPath =
      authStore.user?.role === "PATIENT" ? "/patient/dashboard" : "/";
    return navigateTo(redirectPath);
  }
});
