import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  AUTH_COOKIE_OPTIONS,
  AUTH_EMAIL_VERIFIED_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTHENTICATED_COOKIE,
} from "~/utils/authSessionCookies";

const isClient = typeof window !== "undefined";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
}

// decode jwt to get expiration time
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error: unknown) {
    console.error("JWT decode error:", error);
    return null;
  }
}

//pinia memory resets on page refresh so we use localstorage
export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isAuthenticated = ref(false);
  const tokenExpiresAt = ref<number | null>(null);
  const sessionRole = ref<string | null>(null);

  const isTokenExpired = computed((): boolean => {
    if (!tokenExpiresAt.value) return true;
    // add 30 second buffer to refresh before actual expiration
    return Date.now() >= (tokenExpiresAt.value - 30) * 1000;
  });

  const currentRole = computed((): string | null => {
    return user.value?.role ?? sessionRole.value;
  });

  function syncAuthCookies(userVal: User) {
    const authCookie = useCookie<string | null>(
      AUTHENTICATED_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );
    const roleCookie = useCookie<string | null>(
      AUTH_ROLE_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );
    const emailVerifiedCookie = useCookie<string | null>(
      AUTH_EMAIL_VERIFIED_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );

    authCookie.value = "true";
    roleCookie.value = userVal.role;
    emailVerifiedCookie.value = userVal.emailVerified ? "true" : "false";
  }

  function clearAuthCookies() {
    const authCookie = useCookie<string | null>(
      AUTHENTICATED_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );
    const roleCookie = useCookie<string | null>(
      AUTH_ROLE_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );
    const emailVerifiedCookie = useCookie<string | null>(
      AUTH_EMAIL_VERIFIED_COOKIE,
      AUTH_COOKIE_OPTIONS,
    );

    authCookie.value = null;
    roleCookie.value = null;
    emailVerifiedCookie.value = null;
  }

  function setAuth(
    userVal: User,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    user.value = userVal;
    sessionRole.value = userVal.role;
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    isAuthenticated.value = true;

    //decode token to get expiration
    const decoded = decodeJWT(tokens.accessToken);
    tokenExpiresAt.value = decoded?.exp || null;

    // store tokens in localstorage
    if (isClient) {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(userVal));
      if (tokenExpiresAt.value) {
        localStorage.setItem(
          "tokenExpiresAt",
          tokenExpiresAt.value.toString(),
        );
      }
    }
    syncAuthCookies(userVal);
  }

  function updateUser(userVal: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userVal };
      sessionRole.value = user.value.role;

      // update user in localstorage
      if (isClient) {
        localStorage.setItem("user", JSON.stringify(user.value));
      }
      syncAuthCookies(user.value);
    }
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    isAuthenticated.value = false;
    tokenExpiresAt.value = null;
    sessionRole.value = null;

    // remove tokens from localstorage
    if (isClient) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");
    }
    clearAuthCookies();
  }

  function initAuth() {
    // initialize auth state from localstorage
    if (isClient) {
      const accessTokenVal = localStorage.getItem("accessToken");
      const refreshTokenVal = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      const tokenExpiresAtVal = localStorage.getItem("tokenExpiresAt");

      if (!accessTokenVal || !refreshTokenVal || !userStr) {
        logout();
        return;
      }

      try {
        const storedUser = JSON.parse(userStr) as User;
        accessToken.value = accessTokenVal;
        refreshToken.value = refreshTokenVal;
        user.value = storedUser;
        sessionRole.value = storedUser.role;
        tokenExpiresAt.value = tokenExpiresAtVal
          ? parseInt(tokenExpiresAtVal)
          : null;

        if (isTokenExpired.value) {
          logout();
          isAuthenticated.value = false;
          return;
        }

        isAuthenticated.value = true;
        syncAuthCookies(storedUser);
      } catch (error: unknown) {
        console.error("Auth initialization error:", error);
        logout();
      }
    }
  }

  function initServerAuth(role: string | null | undefined) {
    if (!role) {
      return;
    }

    sessionRole.value = role;
    isAuthenticated.value = true;
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    tokenExpiresAt,
    sessionRole,
    currentRole,
    isTokenExpired,
    setAuth,
    updateUser,
    logout,
    initAuth,
    initServerAuth,
  };
});


