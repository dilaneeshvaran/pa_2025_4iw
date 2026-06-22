export const AUTHENTICATED_COOKIE = "sb-authenticated";
export const AUTH_ROLE_COOKIE = "sb-auth-role";
export const AUTH_EMAIL_VERIFIED_COOKIE = "sb-email-verified";

export const AUTH_COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60,
  sameSite: "lax" as const,
  path: "/",
};

export const isAuthenticatedCookieValue = (
  value: string | null | undefined,
): boolean => value === "true";

export const isEmailVerifiedCookieValue = (
  value: string | null | undefined,
): boolean => value !== "false";
