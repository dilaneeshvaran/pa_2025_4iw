import { describe, expect, it } from "vitest";
import {
  isAuthenticatedCookieValue,
  isEmailVerifiedCookieValue,
} from "../authSessionCookies";

describe("authSessionCookies", () => {
  it("detecte uniquement la valeur authentifiee attendue", () => {
    expect(isAuthenticatedCookieValue(true)).toBe(true);
    expect(isAuthenticatedCookieValue("true")).toBe(true);
    expect(isAuthenticatedCookieValue(false)).toBe(false);
    expect(isAuthenticatedCookieValue("false")).toBe(false);
    expect(isAuthenticatedCookieValue(null)).toBe(false);
  });

  it("traite uniquement false comme email non verifie", () => {
    expect(isEmailVerifiedCookieValue(true)).toBe(true);
    expect(isEmailVerifiedCookieValue("true")).toBe(true);
    expect(isEmailVerifiedCookieValue(false)).toBe(false);
    expect(isEmailVerifiedCookieValue("false")).toBe(false);
    expect(isEmailVerifiedCookieValue(null)).toBe(true);
  });
});
