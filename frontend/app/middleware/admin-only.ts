import { getDashboardPath } from "~/utils/authNavigation";
import {
  AUTH_ROLE_COOKIE,
  AUTHENTICATED_COOKIE,
  isAuthenticatedCookieValue,
} from "~/utils/authSessionCookies";

export default defineNuxtRouteMiddleware((to, _from) => {
  const authStore = useAuthStore();
  const authenticatedCookie = useCookie<string | null>(AUTHENTICATED_COOKIE);
  const roleCookie = useCookie<string | null>(AUTH_ROLE_COOKIE);

  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  const isUserAuthenticated = import.meta.server
    ? isAuthenticatedCookieValue(authenticatedCookie.value)
    : authStore.isAuthenticated;
  const userRole = import.meta.server
    ? roleCookie.value
    : authStore.currentRole;

  if (!isUserAuthenticated || (import.meta.client && !authStore.user)) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // redirect non admin users to their appropriate dashboard
  if (userRole && userRole !== "ADMIN") {
    return navigateTo(getDashboardPath(userRole));
  }
});
