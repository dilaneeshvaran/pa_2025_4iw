import { getDashboardPath } from "~/utils/authNavigation";
import {
  AUTH_EMAIL_VERIFIED_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTHENTICATED_COOKIE,
  isAuthenticatedCookieValue,
  isEmailVerifiedCookieValue,
} from "~/utils/authSessionCookies";

export default defineNuxtRouteMiddleware((to, _from) => {
  const authStore = useAuthStore();
  const authenticatedCookie = useCookie<string | null>(AUTHENTICATED_COOKIE);
  const roleCookie = useCookie<string | null>(AUTH_ROLE_COOKIE);
  const emailVerifiedCookie = useCookie<string | null>(
    AUTH_EMAIL_VERIFIED_COOKIE,
  );

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
  ];

  //  if route is public checker
  const isPractitionerProfile =
    to.name === "practitioner-id" ||
    (/^\/practitioner\/[^/]+$/.test(to.path) &&
      !["dashboard", "agenda", "settings", "billing", "cabinets", "cabinet-appointments", "patients", "messages", "statistics", "teleconsultations", "staff", "public-profile"].includes(to.path.split("/")[2] || ""));

  const isPublicRoute =
    to.path === "/" ||
    isPractitionerProfile ||
    publicRoutes.some((route) => to.path.startsWith(route));



  // init auth state from localstorage if not already done
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth();
  }

  // check authentication status
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

  // redirect unverified users trying to access protected routes
  if (
    isUserAuthenticated &&
    !isEmailVerified &&
    !isPublicRoute &&
    to.path !== "/auth/verify-email-notice"
  ) {
    return navigateTo("/auth/verify-email-notice");
  }

  // Redirect unpaid practitioners to the pay page
  if (
    isUserAuthenticated &&
    userRole === "PRACTITIONER" &&
    authStore.user?.isUnpaid &&
    to.path !== "/practitioner/pay"
  ) {
    return navigateTo("/practitioner/pay");
  }

  // Prevent paid practitioners from accessing pay page
  if (
    isUserAuthenticated &&
    userRole === "PRACTITIONER" &&
    !authStore.user?.isUnpaid &&
    to.path === "/practitioner/pay"
  ) {
    return navigateTo("/practitioner/dashboard");
  }

  if (isUserAuthenticated && to.path === "/") {
    if (!isEmailVerified) {
      return navigateTo("/auth/verify-email-notice");
    }

    return navigateTo(getDashboardPath(userRole));
  }

  // redirect to login if not authenticated and trying to access protected route
  if (!isUserAuthenticated && !isPublicRoute) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // client-only check for expired token
  if (
    import.meta.client &&
    authStore.isAuthenticated &&
    authStore.isTokenExpired &&
    !isPublicRoute
  ) {
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
