import { describe, expect, it } from "vitest";

import { parsePractitionerProfileTab } from "../practitionerProfile";

describe("parsePractitionerProfileTab", () => {
  it("lit le paramètre de tab des liens de disponibilités", () => {
    expect(parsePractitionerProfileTab("availability")).toBe("availability");
    expect(parsePractitionerProfileTab("reviews")).toBe("reviews");
  });

  it("revient à la présentation pour une valeur absente ou inconnue", () => {
    expect(parsePractitionerProfileTab(undefined)).toBe("about");
    expect(parsePractitionerProfileTab("unknown")).toBe("about");
  });
});
