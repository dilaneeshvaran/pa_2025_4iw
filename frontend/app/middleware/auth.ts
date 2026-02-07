export default defineNuxtRouteMiddleware((_to, _from) => {
  const authStore = useAuthStore();

  // initialize auth state from local storage on client side
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // if not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo("/auth/login");
  }
});
