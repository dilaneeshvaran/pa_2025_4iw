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

  //todo : this is redirecting to login from dashboard after few hours of inactivity
  // so the correct way is to :
  // check if authenticated
  // if not > try to refresh the token first
  // if refresh succeeds > let through
  // if refresh fails > redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
