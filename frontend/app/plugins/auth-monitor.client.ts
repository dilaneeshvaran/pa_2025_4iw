export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const router = useRouter();

  // check token expiration every minute
  const checkInterval = setInterval(() => {
    if (!authStore.isAuthenticated) {
      return;
    }

    // if token expired and we have a refresh token, try to refresh
    if (authStore.isTokenExpired) {
      if (authStore.refreshToken) {
        // useAuthenticatedFetch will handle refresh on next request
        // todo refresh token
        console.log("Access token expired, will refresh on next request");
      } else {
        // force logout if no refresh token
        console.log("Session expired, logging out");
        authStore.logout();
        router.push("/auth/login");
      }
    }
  }, 60000); // every minute

  // cleanup on app unmount
  if (import.meta.client) {
    window.addEventListener("beforeunload", () => {
      clearInterval(checkInterval);
    });
  }
});
