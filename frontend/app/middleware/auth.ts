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

  // check if token is expired
  if (authStore.isAuthenticated && authStore.isTokenExpired) {
    // logout and redirect to login if token expired
    authStore.logout();
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // check if users email is verified (except for the verify email notice page)
  if (
    authStore.user &&
    !authStore.user.emailVerified &&
    to.path !== "/auth/verify-email-notice"
  ) {
    return navigateTo("/auth/verify-email-notice");
  }
});
