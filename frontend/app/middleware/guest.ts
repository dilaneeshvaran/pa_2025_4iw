import { getDashboardPath } from "~/utils/authNavigation";
import {
  AUTH_EMAIL_VERIFIED_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTHENTICATED_COOKIE,
  isAuthenticatedCookieValue,
  isEmailVerifiedCookieValue,
} from "~/utils/authSessionCookies";

export default defineNuxtRouteMiddleware((_to, _from) => {
  const authStore = useAuthStore();
  const authenticatedCookie = useCookie<string | null>(AUTHENTICATED_COOKIE);
  const roleCookie = useCookie<string | null>(AUTH_ROLE_COOKIE);
  const emailVerifiedCookie = useCookie<string | null>(
    AUTH_EMAIL_VERIFIED_COOKIE,
  );

  // init auth state from localstorage if not already done
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // check if token is expired
  if (import.meta.client && authStore.isAuthenticated && authStore.isTokenExpired) {
    authStore.logout();
  }

  const isUserAuthenticated = import.meta.server
    ? isAuthenticatedCookieValue(authenticatedCookie.value)
    : authStore.isAuthenticated;
  const userRole = import.meta.server
    ? roleCookie.value
    : authStore.user?.role;
  const isEmailVerified = import.meta.server
    ? isEmailVerifiedCookieValue(emailVerifiedCookie.value)
    : authStore.user?.emailVerified !== false;

  if (import.meta.server && isUserAuthenticated) {
    authStore.initServerAuth(userRole);
  }

  if (isUserAuthenticated) {
    // if user is not verified, redirect to verification notice
    if (!isEmailVerified) {
      return navigateTo("/auth/verify-email-notice");
    }

    return navigateTo(getDashboardPath(userRole));
  }
});
