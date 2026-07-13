import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/money";
import type { CabinClass, Constraint, TripSearch } from "@/lib/types";

/**
 * Read the flat `/results` query back into a validated `TripSearch` — the exact
 * reverse of `tripSearchToSearchParams` (see `@/lib/search-params`), which is
 * the seam between the search form and this route.
 *
 * Every field is coerced and range-checked here so the page and the data layer
 * only ever see a well-formed search. A hand-edited or truncated URL degrades to
 * sane defaults instead of surfacing a `$NaN` subtitle or throwing a currency
 * `RangeError` deep inside formatting.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

/** The four cabins the domain allows; anything else falls back to economy. */
const CABIN_CLASSES: readonly string[] = [
  "economy",
  "premium_economy",
  "business",
  "first",
];

/** Repeated params collapse to their first value; the search contract is flat. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A finite, non-negative integer, or `fallback` when the input isn't one. */
function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
}

/** Narrow an arbitrary query value to a `CabinClass`, defaulting to economy. */
function toCabin(value: string | undefined): CabinClass {
  return value && CABIN_CLASSES.includes(value)
    ? (value as CabinClass)
    : "economy";
}

/**
 * Narrow to a currency the app actually prices in, defaulting to USD. Keeps an
 * unknown code from reaching `Intl.NumberFormat`, which would throw a RangeError.
 */
function toCurrency(value: string | undefined): SupportedCurrency {
  return value && (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
    ? (value as SupportedCurrency)
    : "USD";
}

export function paramsToSearch(params: SearchParams): TripSearch {
  // minStars round-trips through a min-hotel-rating constraint (the only one the
  // form serializes); 0 / absent means "no rating floor".
  const minStars = toInt(first(params.minStars), 0);
  const constraints: Constraint[] =
    minStars > 0 ? [{ kind: "min-hotel-rating", rating: minStars }] : [];

  return {
    origin: (first(params.origin) ?? "").trim().toUpperCase(),
    destination: (first(params.destination) ?? "").trim().toUpperCase(),
    dates: {
      start: first(params.start) ?? "",
      end: first(params.end) ?? "",
    },
    travelers: {
      // A search always has at least one traveller; the form enforces the same.
      adults: Math.max(1, toInt(first(params.adults), 1)),
      children: toInt(first(params.children), 0),
    },
    cabin: toCabin(first(params.cabin)),
    budget: {
      amount: toInt(first(params.budget), 0),
      currency: toCurrency(first(params.currency)),
    },
    constraints,
  };
}
