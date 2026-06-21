import { defineStore } from "pinia";
import { ref, computed } from "vue";

const isClient = typeof window !== "undefined";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
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

  const isTokenExpired = computed((): boolean => {
    if (!tokenExpiresAt.value) return true;
    // add 30 second buffer to refresh before actual expiration
    return Date.now() >= (tokenExpiresAt.value - 30) * 1000;
  });

  function setAuth(userVal: User, tokens: { accessToken: string; refreshToken: string }) {
    user.value = userVal;
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
  }

  function updateUser(userVal: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userVal };

      // update user in localstorage
      if (isClient) {
        localStorage.setItem("user", JSON.stringify(user.value));
      }
    }
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    isAuthenticated.value = false;
    tokenExpiresAt.value = null;

    // remove tokens from localstorage
    if (isClient) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");
    }
  }

  function initAuth() {
    // initialize auth state from localstorage
    if (isClient) {
      const accessTokenVal = localStorage.getItem("accessToken");
      const refreshTokenVal = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      const tokenExpiresAtVal = localStorage.getItem("tokenExpiresAt");

      if (accessTokenVal && refreshTokenVal && userStr) {
        accessToken.value = accessTokenVal;
        refreshToken.value = refreshTokenVal;
        user.value = JSON.parse(userStr);
        tokenExpiresAt.value = tokenExpiresAtVal
          ? parseInt(tokenExpiresAtVal)
          : null;

        //check if token is expired
        if (isTokenExpired.value) {
          // token expired, clear auth
          logout();
          isAuthenticated.value = false;
        } else {
          isAuthenticated.value = true;
        }
      }
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    tokenExpiresAt,
    isTokenExpired,
    setAuth,
    updateUser,
    logout,
    initAuth,
  };
});


