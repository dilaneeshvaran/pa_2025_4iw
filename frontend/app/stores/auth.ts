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
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  }),

  actions: {
    setAuth(user: User, tokens: { accessToken: string; refreshToken: string }) {
      this.user = user;
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.isAuthenticated = true;

      // store tokens in localstorage
      if (import.meta.client) {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
      }
    },

    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;

      // remove tokens from localstorage
      if (import.meta.client) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    },

    initAuth() {
      // initialize auth state from localstorage
      if (import.meta.client) {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");

        if (accessToken && refreshToken && userStr) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.user = JSON.parse(userStr);
          this.isAuthenticated = true;
        }
      }
    },
  },
});
