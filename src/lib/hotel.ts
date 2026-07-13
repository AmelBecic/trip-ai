/**
 * Presentation helpers for the `Hotel` domain type (see `@/lib/types`) — the
 * derivations the hotel card and list need but that don't belong on the data
 * shape: the active min-star requirement, whether a stay clears it, and the
 * filled/empty split of a star rating.
 */

import type { Constraint, Hotel } from "@/lib/types";

/**
 * The strictest `min-hotel-rating` requirement among a search's constraints, or
 * `null` when none is set. A search can only carry one today, but taking the
 * max keeps callers honest if that ever changes.
 */
export function minHotelRating(constraints: Constraint[]): number | null {
  let min: number | null = null;
  for (const c of constraints) {
    if (c.kind === "min-hotel-rating") {
      min = min === null ? c.rating : Math.max(min, c.rating);
    }
  }
  return min;
}

/** Filled and empty star counts for a 0–5 rating, rounded and clamped to the scale. */
export function starCounts(rating: number): { filled: number; empty: number } {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return { filled, empty: 5 - filled };
}

/**
 * Whether a hotel clears a minimum star rating. A `null` minimum is always met.
 * Compares the *displayed* star count (`starCounts`), not the raw rating, so the
 * "below minimum" flag can never contradict the glyphs the card draws — a stay
 * shown as 4 stars is treated as 4 stars here too.
 */
export function meetsMinRating(hotel: Hotel, min: number | null): boolean {
  return min === null || starCounts(hotel.rating).filled >= min;
}
