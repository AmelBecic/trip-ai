import type {
  BudgetBreakdown,
  BudgetLine,
  BudgetStatus,
  CabinClass,
  Flight,
  Hotel,
  Itinerary,
  Money,
  TripSearch,
} from "@/lib/types";
import { ITINERARIES, type ItineraryFixture } from "./fixtures";

/**
 * The data seam. Every screen reads trips through these async functions; the
 * fixtures behind them can later be swapped for the real planning agent without
 * a UI change. Keep this the only module the UI imports from — fixtures stay
 * private to the layer.
 */

const DEFAULT_LATENCY_MS = 600;

/**
 * Seam config is deliberately process-global, not per-request: it exists only
 * to orchestrate demos and tests (slow the network down, force an outage), and
 * every read observes whatever is set when it runs. It is NOT a place to carry
 * per-call behaviour — flipping a toggle affects all in-flight and later reads,
 * so drive it from a single place (a test's beforeEach, a demo control) and
 * never from concurrent request handling. The real backend replaces all of it.
 */
let latencyMs = DEFAULT_LATENCY_MS;
let shouldFail = false;

/** Thrown by the seam when the error path is toggled on, so callers can render
 *  a real error state. Distinct from a programming error. */
export class DataError extends Error {
  constructor(message = "The trip service is unavailable. Please try again.") {
    super(message);
    this.name = "DataError";
  }
}

/**
 * Tune the seam for demos and tests: drop latency to 0 to keep tests fast, or
 * flip `shouldFail` to exercise error states. Call resetDataConfig() to restore
 * the production-like defaults.
 */
export function configureData(opts: {
  latencyMs?: number;
  shouldFail?: boolean;
}): void {
  if (opts.latencyMs !== undefined) latencyMs = opts.latencyMs;
  if (opts.shouldFail !== undefined) shouldFail = opts.shouldFail;
}

export function resetDataConfig(): void {
  latencyMs = DEFAULT_LATENCY_MS;
  shouldFail = false;
}

/** The artificial network: wait, then maybe fail — applied to every read. */
async function seam(): Promise<void> {
  if (latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }
  if (shouldFail) throw new DataError();
}

function sumMoney(items: readonly Money[]): Money {
  if (items.length === 0) return { amount: 0, currency: "USD" };
  const currency = items[0].currency;
  let amount = 0;
  for (const item of items) {
    // Guards the whole point of the Money type: never total across currencies.
    if (item.currency !== currency) {
      throw new Error(
        `Cannot sum ${item.currency} with ${currency}: mixed currencies.`,
      );
    }
    amount += item.amount;
  }
  return { amount, currency };
}

function statusFor(total: Money, cap: Money): BudgetStatus {
  // Same guard sumMoney applies: a ratio across currencies is meaningless.
  if (total.currency !== cap.currency) {
    throw new Error(
      `Cannot grade ${total.currency} spend against a ${cap.currency} cap: mixed currencies.`,
    );
  }
  const ratio = total.amount / cap.amount;
  if (ratio <= 0.85) return "under";
  if (ratio <= 1) return "near";
  return "over";
}

/** Derive an itinerary's budget verdict for a given cap, then assemble it. */
function build(fixture: ItineraryFixture, forSearch: TripSearch): Itinerary {
  const lines: BudgetLine[] = [
    { category: "flights", amount: sumMoney(fixture.flights.map((f) => f.price)) },
    { category: "lodging", amount: sumMoney(fixture.hotels.map((h) => h.total)) },
    ...fixture.extraLines,
  ];
  const total = sumMoney(lines.map((line) => line.amount));
  const budget: BudgetBreakdown = {
    cap: forSearch.budget,
    total,
    status: statusFor(total, forSearch.budget),
    lines,
  };

  return {
    id: fixture.id,
    search: forSearch,
    summary: fixture.summary,
    flights: fixture.flights,
    hotels: fixture.hotels,
    budget,
    days: fixture.days,
  };
}

/** Cabin comfort, low to high, so a requested cabin reads as a floor. */
const CABIN_RANK: Record<CabinClass, number> = {
  economy: 0,
  premium_economy: 1,
  business: 2,
  first: 3,
};

/**
 * Whether a trip satisfies the search's filters. Cabin is a comfort floor — a
 * trip qualifies if it offers a flight at least as premium as requested, so
 * asking for economy keeps everything and asking for business narrows to the
 * splurge options. `constraints` are hard requirements (see `types.ts`): every
 * hotel must clear a rating floor and every flight must stay within a stop cap.
 * Budget is deliberately not a filter here — it re-prices the set (under/over)
 * rather than removing trips, so an over-budget option stays visible.
 */
function matchesFilters(fixture: ItineraryFixture, input: TripSearch): boolean {
  const floor = CABIN_RANK[input.cabin];
  if (!fixture.flights.some((f) => CABIN_RANK[f.cabin] >= floor)) return false;

  for (const constraint of input.constraints) {
    switch (constraint.kind) {
      case "min-hotel-rating":
        if (!fixture.hotels.every((h) => h.rating >= constraint.rating)) {
          return false;
        }
        break;
      case "max-stops":
        if (
          !fixture.flights.every(
            (f) => f.segments.length - 1 <= constraint.stops,
          )
        ) {
          return false;
        }
        break;
      // Remaining constraint kinds have no fixture data to filter on yet; they
      // pass through untouched until the real backend can honour them.
    }
  }
  return true;
}

/**
 * Trips for a destination that satisfy the search's cabin and constraint
 * filters, priced against the caller's budget cap — so the same fixtures read
 * as under-, near-, or over-budget depending on `input.budget`. An unknown
 * destination, or one where nothing clears the filters, returns an empty set
 * (the no-results state).
 */
export async function searchTrips(input: TripSearch): Promise<Itinerary[]> {
  await seam();
  const destination = input.destination.trim().toUpperCase();
  return ITINERARIES.filter(
    (fixture) =>
      fixture.baselineSearch.destination === destination &&
      matchesFilters(fixture, input),
  ).map((fixture) => build(fixture, input));
}

/** A single trip by id, priced against the search it was born from. */
export async function getItinerary(id: string): Promise<Itinerary | null> {
  await seam();
  const fixture = ITINERARIES.find((it) => it.id === id);
  return fixture ? build(fixture, fixture.baselineSearch) : null;
}

export async function getFlights(itineraryId: string): Promise<Flight[]> {
  await seam();
  return ITINERARIES.find((it) => it.id === itineraryId)?.flights ?? [];
}

export async function getHotels(itineraryId: string): Promise<Hotel[]> {
  await seam();
  return ITINERARIES.find((it) => it.id === itineraryId)?.hotels ?? [];
}
