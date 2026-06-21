import { describe, expect, it } from "vitest";

import { shouldShowConsentBannerForLayout } from "../consentVisibility";

describe("shouldShowConsentBannerForLayout", () => {
  it("autorise les layouts des espaces authentifiés", () => {
    expect(shouldShowConsentBannerForLayout("patient")).toBe(true);
    expect(shouldShowConsentBannerForLayout("practitioner")).toBe(true);
    expect(shouldShowConsentBannerForLayout("staff")).toBe(true);
    expect(shouldShowConsentBannerForLayout("cabinet")).toBe(true);
    expect(shouldShowConsentBannerForLayout("admin")).toBe(true);
  });

  it("masque la bannière sur les pages publiques et auth", () => {
    expect(shouldShowConsentBannerForLayout("default")).toBe(false);
    expect(shouldShowConsentBannerForLayout(false)).toBe(false);
    expect(shouldShowConsentBannerForLayout(undefined)).toBe(false);
  });
});
