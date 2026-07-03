import { describe, expect, it } from "vitest";

import {
  shouldShowConsentBannerForLayout,
  shouldShowPublicConsentBanner,
} from "../consentVisibility";

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

describe("shouldShowPublicConsentBanner", () => {
  it("affiche la bannière sur la page d'accueil et les pages publiques", () => {
    expect(shouldShowPublicConsentBanner("/", "default")).toBe(true);
    expect(shouldShowPublicConsentBanner("/search", "default")).toBe(true);
    expect(
      shouldShowPublicConsentBanner(
        "/practitioner/cmqzak28a00166trsrkazpaqx",
        "default",
      ),
    ).toBe(true);
    expect(shouldShowPublicConsentBanner("/legal/privacy", "default")).toBe(
      true,
    );
  });

  it("masque la bannière sur les pages auth et les espaces connectés", () => {
    expect(shouldShowPublicConsentBanner("/auth/login", "default")).toBe(false);
    expect(shouldShowPublicConsentBanner("/", "patient")).toBe(false);
    expect(shouldShowPublicConsentBanner("/search", "practitioner")).toBe(
      false,
    );
  });
});
