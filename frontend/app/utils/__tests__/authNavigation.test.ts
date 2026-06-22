import { describe, expect, it } from "vitest";
import { getDashboardPath } from "../authNavigation";

describe("authNavigation", () => {
  it.each([
    ["PATIENT", "/patient/dashboard"],
    ["PRACTITIONER", "/practitioner/dashboard"],
    ["STAFF", "/staff/dashboard"],
    ["CABINET_ADMIN", "/cabinet/dashboard"],
    ["ADMIN", "/admin/dashboard"],
  ])("redirige le role %s vers son tableau de bord", (role, expectedPath) => {
    expect(getDashboardPath(role)).toBe(expectedPath);
  });

  it("redirige un role inconnu vers le tableau de bord patient par defaut", () => {
    expect(getDashboardPath("UNKNOWN_ROLE")).toBe("/patient/dashboard");
  });
});
