export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms

  // update the lastActivity timestamp in localStorage
  const updateActivity = () => {
    if (authStore.isAuthenticated) {
      localStorage.setItem("lastActivity", Date.now().toString());
    }
  };

  // throttle mousemove to once every 10 seconds for performance
  let lastMouseMoveTime = 0;
  const onMouseMove = () => {
    const now = Date.now();
    if (now - lastMouseMoveTime > 10000) {
      lastMouseMoveTime = now;
      updateActivity();
    }
  };

  // Attach event listeners for user interactions
  if (import.meta.client) {
    updateActivity();
    window.addEventListener("click", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });
    window.addEventListener("touchstart", updateActivity, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
  }

  // check token expiration and user inactivity
  const checkInterval = setInterval(() => {
    if (!authStore.isAuthenticated) {
      return;
    }

    // Bypass inactivity check if active in teleconsultation
    if (route.path.includes("/teleconsultations")) {
      updateActivity();
      return;
    }

    const lastActivityStr = localStorage.getItem("lastActivity");
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr) : Date.now();
    const now = Date.now();

    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      console.log("Session expired due to inactivity, logging out");
      authStore.logout();
      router.push("/auth/login");
      return;
    }

    // if token expired and we have a refresh token, try to refresh on next request
    if (authStore.isTokenExpired) {
      if (authStore.refreshToken) {
        console.log("Access token expired, will refresh on next request");
      } else {
        // force logout if no refresh token
        console.log("Session expired, logging out");
        authStore.logout();
        router.push("/auth/login");
      }
    }
  }, 30000); // check every 30 seconds

  // cleanup on app unmount / beforeunload
  if (import.meta.client) {
    window.addEventListener("beforeunload", () => {
      clearInterval(checkInterval);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      window.removeEventListener("mousemove", onMouseMove);
    });
  }
});
