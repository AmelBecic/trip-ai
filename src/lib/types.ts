/**
 * Domain types & data contracts (TRIP-5).
 *
 * These are the shapes the mock data layer (TRIP-6) fills today and the real
 * backend must satisfy later. They are the single source of truth for the app's
 * vocabulary — screens and fixtures import from here rather than restating a
 * shape inline. Keep them free of framework and rendering concerns.
 */

/** ISO 4217 alphabetic currency code, e.g. "USD", "EUR", "JPY". */
export type CurrencyCode = string;

/**
 * A monetary amount as an integer count of the currency's *minor unit* —
 * cents for USD, yen for JPY (which has no minor unit, so the count is whole
 * yen). Integers sidestep the rounding errors floats bring to money, and the
 * currency travels with the amount so two sums can never be added blind to
 * their denomination.
 */
export interface Money {
  /** Minor units, e.g. 129900 = $1,299.00. Never a float or a formatted string. */
  amount: number;
  currency: CurrencyCode;
}

/** A calendar span, both ends inclusive, as ISO 8601 dates (`YYYY-MM-DD`). */
export interface DateRange {
  start: string;
  end: string;
}

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

/** Who is travelling. Infants-in-lap are counted separately from seated children. */
export interface TravelParty {
  adults: number;
  children: number;
}

/**
 * A hard requirement the search must respect, as a discriminated union so each
 * kind carries exactly the payload it needs and switches stay exhaustive.
 */
export type Constraint =
  | { kind: "max-stops"; stops: number }
  | { kind: "max-layover-minutes"; minutes: number }
  | { kind: "min-hotel-rating"; rating: number }
  | { kind: "max-hotel-distance-km"; km: number }
  | { kind: "preferred-airlines"; airlines: string[] }
  | { kind: "avoid-red-eye" };

/** The user's request: where, when, for whom, and the ceiling it must fit under. */
export interface TripSearch {
  /** Origin/destination as IATA airport or city codes (e.g. "SFO", "KIX"). */
  origin: string;
  destination: string;
  dates: DateRange;
  travelers: TravelParty;
  cabin: CabinClass;
  /** Total budget cap for the whole trip. */
  budget: Money;
  constraints: Constraint[];
}

/** One leg of a flight; a booking with connections has more than one. */
export interface FlightSegment {
  from: string;
  to: string;
  /** ISO 8601 datetimes with offset, e.g. "2026-11-03T09:15:00-08:00". */
  departure: string;
  arrival: string;
  carrier: string;
  flightNumber: string;
}

export interface Flight {
  id: string;
  /** In order of travel; `segments.length - 1` is the number of stops. */
  segments: FlightSegment[];
  cabin: CabinClass;
  price: Money;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  /** Star rating, 0–5. */
  rating: number;
  /** ISO 8601 dates. */
  checkIn: string;
  checkOut: string;
  nights: number;
  nightlyRate: Money;
  /** `nightlyRate` × `nights`, precomputed so callers never re-derive it. */
  total: Money;
}

export type BudgetCategory =
  | "flights"
  | "lodging"
  | "food"
  | "activities"
  | "transit";

/**
 * How spend compares to the cap. Mirrors the budget design tokens
 * (`budget-under` / `budget-near` / `budget-over`) so UI can map status to
 * colour without a second lookup table.
 */
export type BudgetStatus = "under" | "near" | "over";

export interface BudgetLine {
  category: BudgetCategory;
  amount: Money;
}

export interface BudgetBreakdown {
  /** The cap carried over from `TripSearch.budget`. */
  cap: Money;
  /** Sum of every line; compare against `cap` to explain `status`. */
  total: Money;
  status: BudgetStatus;
  lines: BudgetLine[];
}

/** A single planned thing on a given day — a visit, meal, or transfer. */
export interface Activity {
  id: string;
  name: string;
  /** ISO 8601 datetime; absent for an all-day or unscheduled item. */
  start?: string;
  location?: string;
  cost?: Money;
}

export interface ItineraryDay {
  /** ISO 8601 date. */
  date: string;
  title: string;
  activities: Activity[];
}

/** A complete proposed trip: the answer to one `TripSearch`. */
export interface Itinerary {
  id: string;
  /** The request this itinerary answers. */
  search: TripSearch;
  summary: string;
  flights: Flight[];
  hotels: Hotel[];
  budget: BudgetBreakdown;
  days: ItineraryDay[];
}
