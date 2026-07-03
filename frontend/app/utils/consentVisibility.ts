const AUTHENTICATED_CONSENT_LAYOUTS = new Set([
  "patient",
  "practitioner",
  "staff",
  "cabinet",
  "admin",
]);

const PUBLIC_CONSENT_ROUTE_PREFIXES = [
  "/search",
  "/practitioner/",
  "/legal/",
  "/contact/",
  "/cabinet/",
] as const;

const PUBLIC_CONSENT_EXCLUDED_PREFIXES = ["/auth/"] as const;

export const PUBLIC_CONSENT_STORAGE_KEY = "medicote_public_consent_given";

export const shouldShowConsentBannerForLayout = (layout: unknown): boolean => {
  return (
    typeof layout === "string" && AUTHENTICATED_CONSENT_LAYOUTS.has(layout)
  );
};

export const shouldShowPublicConsentBanner = (
  path: string,
  layout: unknown,
): boolean => {
  if (layout !== "default" && layout !== false && layout !== undefined) {
    return false;
  }

  if (
    PUBLIC_CONSENT_EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    return false;
  }

  if (path === "/") {
    return true;
  }

  return PUBLIC_CONSENT_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};
