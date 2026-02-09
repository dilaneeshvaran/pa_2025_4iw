import { useAuthStore } from "~/stores/auth";

// automatically adds auth headers, refreshes expired tokens
// retries failed requests, and logs users out when auth is no longer valid.
export const useAuthenticatedFetch = async <T>(
  request: string,
  opts?: any,
): Promise<T> => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const headers = {
    ...opts?.headers,
    Authorization: `Bearer ${authStore.accessToken}`,
  };

  try {
    return await $fetch<T>(request, {
      baseURL: config.public.apiBase,
      ...opts,
      headers,
    });
  } catch (error: any) {
    if (error.response?.status === 401) {
      // if we have a refresh token, try to refresh
      if (authStore.refreshToken) {
        try {
          const response = await $fetch<{
            success: boolean;
            data: { accessToken: string; refreshToken: string };
          }>("/auth/refresh", {
            baseURL: config.public.apiBase,
            method: "POST",
            body: { refreshToken: authStore.refreshToken },
          });

          if (response.success && response.data && authStore.user) {
            // update store with new tokens
            authStore.setAuth(authStore.user, response.data);

            // retry original request with new token
            return await $fetch<T>(request, {
              baseURL: config.public.apiBase,
              ...opts,
              headers: {
                ...opts?.headers,
                Authorization: `Bearer ${response.data.accessToken}`,
              },
            });
          }
        } catch (refreshError) {
          // refresh failed, logout
          authStore.logout();
          navigateTo("/auth/login");
          throw error;
        }
      }

      // no refresh token or 401 on other requests
      authStore.logout();
      navigateTo("/auth/login");
    }
    throw error;
  }
};
