/**
 * Currency helpers for turning user-entered major-unit amounts into the integer
 * minor units the `Money` contract stores (see `@/lib/types`).
 *
 * Only the currencies the trip search offers are listed; each maps to its
 * ISO 4217 minor-unit exponent. JPY has no minor unit, so its amount is whole
 * yen — a blind ×100 would overstate a yen budget a hundredfold.
 */

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const MINOR_UNIT_EXPONENT: Record<SupportedCurrency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  CAD: 2,
  JPY: 0,
};

/** Convert a major-unit amount (e.g. 1299.5 USD) to integer minor units (129950). */
export function toMinorUnits(major: number, currency: SupportedCurrency): number {
  return Math.round(major * 10 ** MINOR_UNIT_EXPONENT[currency]);
}
