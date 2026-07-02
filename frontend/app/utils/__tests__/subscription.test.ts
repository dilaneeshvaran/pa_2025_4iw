import { describe, it, expect } from "vitest";
import { getPlanPriceFormatted, getPlanPriceLabel } from "../subscription";

describe("Subscription Utils", () => {
  it("should return the formatted price for FREE plan", () => {
    expect(getPlanPriceFormatted("FREE")).toBe("0 XOF");
    expect(getPlanPriceLabel("FREE")).toBe("0 XOF / mois");
  });

  it("should return the formatted price for PREMIUM plan", () => {
    expect(getPlanPriceFormatted("PREMIUM")).toBe("12 000 XOF");
    expect(getPlanPriceLabel("PREMIUM")).toBe("12 000 XOF / mois");
  });

  it("should return the formatted price for PRO plan", () => {
    expect(getPlanPriceFormatted("PRO")).toBe("24 000 XOF");
    expect(getPlanPriceLabel("PRO")).toBe("24 000 XOF / mois");
  });

  it("should handle case insensitivity", () => {
    expect(getPlanPriceFormatted("premium")).toBe("12 000 XOF");
    expect(getPlanPriceLabel("pro")).toBe("24 000 XOF / mois");
  });

  it("should handle unknown plans by defaulting to FREE price", () => {
    expect(getPlanPriceFormatted("unknown")).toBe("0 XOF");
    expect(getPlanPriceLabel("unknown")).toBe("0 XOF / mois");
  });
});
