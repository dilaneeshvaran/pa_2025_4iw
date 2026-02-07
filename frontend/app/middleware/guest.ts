export default defineNuxtRouteMiddleware((_to, _from) => {
  const authStore = useAuthStore();

  // initialize auth state from local storage on client side
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // if already authenticated, redirect to home
  if (authStore.isAuthenticated) {
    return navigateTo("/");
  }
});
