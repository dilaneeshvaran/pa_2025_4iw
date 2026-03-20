import { defineStore } from "pinia";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tokenExpiresAt: number | null;
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
export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    tokenExpiresAt: null,
  }),

  getters: {
    isTokenExpired(): boolean {
      if (!this.tokenExpiresAt) return true;
      // add 30 second buffer to refresh before actual expiration
      return Date.now() >= (this.tokenExpiresAt - 30) * 1000;
    },
  },

  actions: {
    setAuth(user: User, tokens: { accessToken: string; refreshToken: string }) {
      this.user = user;
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.isAuthenticated = true;

      //decode token to get expiration
      const decoded = decodeJWT(tokens.accessToken);
      this.tokenExpiresAt = decoded?.exp || null;

      // store tokens in localstorage
      if (import.meta.client) {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        if (this.tokenExpiresAt) {
          localStorage.setItem(
            "tokenExpiresAt",
            this.tokenExpiresAt.toString(),
          );
        }
      }
    },

    updateUser(user: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...user };

        // update user in localstorage
        if (import.meta.client) {
          localStorage.setItem("user", JSON.stringify(this.user));
        }
      }
    },

    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      this.tokenExpiresAt = null;

      // remove tokens from localstorage
      if (import.meta.client) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiresAt");
      }
    },

    initAuth() {
      // initialize auth state from localstorage
      if (import.meta.client) {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");
        const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");

        if (accessToken && refreshToken && userStr) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.user = JSON.parse(userStr);
          this.tokenExpiresAt = tokenExpiresAt
            ? parseInt(tokenExpiresAt)
            : null;

          //check if token is expired
          if (this.isTokenExpired) {
            // token expired, clear auth
            this.logout();
            this.isAuthenticated = false;
          } else {
            this.isAuthenticated = true;
          }
        }
      }
    },
  },
});
