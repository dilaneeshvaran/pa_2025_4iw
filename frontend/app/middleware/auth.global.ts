export default defineNuxtRouteMiddleware((to, _from) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // routes that dont require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/contact",
    "/about",
  ];

  //  if route is public checker
  const isPublicRoute = publicRoutes.some((route) => to.path.startsWith(route));

  // initialize auth from localstorage
  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // redirect login if not authenticated and trying to access protected route
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // if authenticated but token is expired
  if (authStore.isAuthenticated && authStore.isTokenExpired && !isPublicRoute) {
    // try refresh token
    if (authStore.refreshToken) {
      // useAuthenticatedFetch should handle refresh
      return;
    } else {
      // logout if no refresh token and redirect to login
      authStore.logout();
      return navigateTo({
        path: "/auth/login",
        query: { redirect: to.fullPath },
      });
    }
  }
});
