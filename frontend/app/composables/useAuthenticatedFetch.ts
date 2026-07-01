import { useAuthStore } from "~/stores/auth";

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

interface FetchOptionsWithMethod {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  [key: string]: unknown;
}

// automatically adds auth headers, refreshes expired tokens
// retries failed requests, and logs users out when auth is no longer valid.
export const useAuthenticatedFetch = async <T>(
  request: string,
  opts?: FetchOptionsWithMethod,
): Promise<T> => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  // check if token is expired before making request
  if (authStore.isTokenExpired && authStore.refreshToken) {
    // if already refreshing, wait for it complete
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
    } else {
      // start refresh process
      isRefreshing = true;
      refreshPromise = authStore.refresh();

      try {
        await refreshPromise;
      } catch {
        isRefreshing = false;
        refreshPromise = null;
        authStore.logout();
        navigateTo("/auth/login");
        throw new Error("Session expired. Please login again.");
      }

      isRefreshing = false;
      refreshPromise = null;
    }
  }

  const headers = {
    ...opts?.headers,
    Authorization: `Bearer ${authStore.accessToken}`,
    "x-timezone-offset": new Date().getTimezoneOffset().toString(),
  };

  try {
    // @ts-expect-error - nuxt $fetch type inference with spread operator
    return await $fetch<T>(request, {
      baseURL: config.public.apiBase,
      ...opts,
      headers,
    });
  } catch (err: unknown) {
    const fetchError = err as { response?: { status?: number } };
    if (fetchError.response?.status === 401) {
      // if we have a refresh token, try to refresh
      if (authStore.refreshToken && !isRefreshing) {
        try {
          await authStore.refresh();

          // retry original request with new token
          // @ts-expect-error - nuxt $fetch type inference with spread operator
          return await $fetch<T>(request, {
            baseURL: config.public.apiBase,
            ...opts,
            headers,
          });
        } catch {
          // refresh failed, logout
          authStore.logout();
          navigateTo("/auth/login");
          throw err;
        }
      }

      // no refresh token or 401 on other requests
      authStore.logout();
      navigateTo("/auth/login");
    }
    throw err;
  }
};
