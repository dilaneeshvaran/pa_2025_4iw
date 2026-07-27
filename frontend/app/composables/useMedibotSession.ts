const STORAGE_KEY = "medibot_session_id";

/**
 * Stable anonymous session id for Medibot.
 * Lets an unauthenticated visitor keep a single conversation thread that can
 * later be linked to their patient account when they log in.
 */
export const useMedibotSession = () => {
  const getSessionId = (): string => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `mb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  };

  const clearSession = () => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return { getSessionId, clearSession };
};
