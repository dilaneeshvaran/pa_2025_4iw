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

  // prevent logged in user to see pages like login or register
  if (authStore.isAuthenticated) {
    const redirectPath =
      authStore.user?.role === "PATIENT" ? "/patient/dashboard" : "/";
    return navigateTo(redirectPath);
  }
});
