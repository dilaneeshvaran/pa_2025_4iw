export const PLAN_PRICES: Record<string, { value: number; formatted: string; label: string }> = {
  FREE: { value: 0, formatted: "0 XOF", label: "0 XOF / mois" },
  PREMIUM: { value: 12000, formatted: "12 000 XOF", label: "12 000 XOF / mois" },
  PRO: { value: 24000, formatted: "24 000 XOF", label: "24 000 XOF / mois" },
};

export function getPlanPriceFormatted(plan: string): string {
  const normalized = plan?.toUpperCase();
  return PLAN_PRICES[normalized]?.formatted || "0 XOF";
}

export function getPlanPriceLabel(plan: string): string {
  const normalized = plan?.toUpperCase();
  return PLAN_PRICES[normalized]?.label || "0 XOF / mois";
}
