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

  // block practitioners, staff, cabinet admins, admins from accessing patient only pages
  if (userRole && userRole !== "PATIENT") {
    return navigateTo(getDashboardPath(userRole));
  }
});
