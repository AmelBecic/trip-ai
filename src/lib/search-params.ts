import type { Constraint, TripSearch } from "./types";

/**
 * Serialize a TripSearch into the query string the `/results` route reads.
 *
 * Params are flat so the URL stays legible and shareable:
 *   origin, destination, start, end, adults, children, cabin,
 *   budget (integer minor units), currency, and — when the matching
 *   constraint is present — minStars (min-hotel-rating) and
 *   maxStops (max-stops).
 *
 * The `/results` route (TRIP-12) owns the reverse — reading these back into a
 * TripSearch — so this contract is the seam between the two.
 */
export function tripSearchToSearchParams(search: TripSearch): URLSearchParams {
  const params = new URLSearchParams({
    origin: search.origin,
    destination: search.destination,
    start: search.dates.start,
    end: search.dates.end,
    adults: String(search.travelers.adults),
    children: String(search.travelers.children),
    cabin: search.cabin,
    budget: String(search.budget.amount),
    currency: search.budget.currency,
  });

  const minRating = search.constraints.find(
    (c): c is Extract<Constraint, { kind: "min-hotel-rating" }> =>
      c.kind === "min-hotel-rating",
  );
  if (minRating) {
    params.set("minStars", String(minRating.rating));
  }

  const maxStops = search.constraints.find(
    (c): c is Extract<Constraint, { kind: "max-stops" }> =>
      c.kind === "max-stops",
  );
  if (maxStops) {
    params.set("maxStops", String(maxStops.stops));
  }

  return params;
}
