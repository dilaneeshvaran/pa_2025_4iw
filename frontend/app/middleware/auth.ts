export default defineNuxtRouteMiddleware((to, _from) => {
  const authStore = useAuthStore();

  // initialize auth state from local storage on client side
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // if not authenticated, redirect to login with redirect path
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
