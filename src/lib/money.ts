/**
 * Currency helpers for turning user-entered major-unit amounts into the integer
 * minor units the `Money` contract stores (see `@/lib/types`), and back into a
 * display string.
 *
 * Only the currencies the trip search offers are listed; each maps to its
 * ISO 4217 minor-unit exponent. JPY has no minor unit, so its amount is whole
 * yen — a blind ×100 would overstate a yen budget a hundredfold.
 */

import type { Money } from "@/lib/types";

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

/** The inverse of `toMinorUnits`: 129950 USD → 1299.5, 150000 JPY → 150000. */
export function toMajorUnits(minor: number, currency: SupportedCurrency): number {
  return minor / 10 ** MINOR_UNIT_EXPONENT[currency];
}

/**
 * A `Money` value as a localized currency string, scaled by the currency's own
 * minor unit — so 129900 USD reads as $1,299.00 but 150000 JPY as ¥150,000.
 * Uses the runtime's default locale. Callers must pass a valid ISO 4217 code;
 * an unknown one makes `Intl.NumberFormat` throw (see `paramsToSearch`, which
 * narrows query currencies to `SUPPORTED_CURRENCIES` before they get here).
 */
export function formatMoney({ amount, currency }: Money): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}
