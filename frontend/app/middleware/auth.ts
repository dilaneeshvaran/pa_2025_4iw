export default defineNuxtRouteMiddleware((to, _from) => {
  // we cant access localstorage on the server so skip auth check
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // init auth state from localstorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // after initialization, if not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
