const CONSENT_LAYOUTS = new Set([
  "patient",
  "practitioner",
  "staff",
  "cabinet",
  "admin",
]);

export const shouldShowConsentBannerForLayout = (layout: unknown): boolean => {
  return typeof layout === "string" && CONSENT_LAYOUTS.has(layout);
};
