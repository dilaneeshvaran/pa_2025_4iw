export default defineNuxtRouteMiddleware((to, _from) => {
  const authStore = useAuthStore();
  const authenticatedCookie = useCookie("sb-authenticated");

  // routes that dont require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/contact",
    "/about",
    "/search",
    "/legal",
    "/practitioner/",
    "/cabinet/",
  ];

  //  if route is public checker
  const isPublicRoute =
    to.path === "/" ||
    publicRoutes.some((route) => to.path.startsWith(route));

  // initialize auth from localstorage on client side
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // check authentication status
  const isUserAuthenticated = import.meta.server
    ? !!authenticatedCookie.value
    : authStore.isAuthenticated;

  // redirect to login if not authenticated and trying to access protected route
  if (!isUserAuthenticated && !isPublicRoute) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // client-only check for expired token
  if (import.meta.client && authStore.isAuthenticated && authStore.isTokenExpired && !isPublicRoute) {
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
