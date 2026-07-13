/**
 * Presentation helpers for the `Flight` domain type (see `@/lib/types`) — the
 * derivations the flight card needs but that don't belong on the data shape:
 * how many stops, which carriers, how long, and the wall-clock times to show.
 *
 * Times are read straight off the ISO strings rather than through `Date`, so a
 * departure written "…T11:20:00-08:00" always displays as 11:20 regardless of
 * where the runtime happens to be. Elapsed duration is the one thing that *must*
 * cross timezones, so it alone parses the offsets into absolute instants.
 */

import type { CabinClass, Flight } from "@/lib/types";

const CABIN_LABEL: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};

/** Human label for a cabin class, matching the search form's wording. */
export function cabinLabel(cabin: CabinClass): string {
  return CABIN_LABEL[cabin];
}

/** Connections on the way; a nonstop flight has one segment and zero stops. */
export function stopCount(flight: Flight): number {
  return Math.max(0, flight.segments.length - 1);
}

/** "Nonstop", "1 stop", "2 stops". */
export function stopsLabel(stops: number): string {
  if (stops <= 0) return "Nonstop";
  return `${stops} stop${stops === 1 ? "" : "s"}`;
}

/** Distinct operating carriers, in order of travel. */
export function carriers(flight: Flight): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const { carrier } of flight.segments) {
    if (carrier && !seen.has(carrier)) {
      seen.add(carrier);
      ordered.push(carrier);
    }
  }
  return ordered;
}

/** The "HH:MM" wall clock as written in an ISO 8601 datetime, without converting
 * through the runtime's timezone. Empty when the string carries no time. */
export function wallClockTime(iso: string): string {
  return /T(\d{2}:\d{2})/.exec(iso)?.[1] ?? "";
}

/**
 * Whole calendar days between the departure and arrival wall-clock *dates* — a
 * red-eye that lands the next morning is `+1`. Compared at a fixed instant so a
 * DST boundary between the two dates can't round it to a fraction.
 */
export function dayOffset(departure: string, arrival: string): number {
  const from = /^(\d{4}-\d{2}-\d{2})/.exec(departure)?.[1];
  const to = /^(\d{4}-\d{2}-\d{2})/.exec(arrival)?.[1];
  if (!from || !to) return 0;
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : 0;
}

/**
 * Elapsed minutes from the first departure to the last arrival, honouring each
 * end's offset. `null` when the times are missing or don't parse, so the card
 * can simply omit the duration rather than print "NaNm".
 */
export function durationMinutes(flight: Flight): number | null {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  if (!first || !last) return null;
  const ms = new Date(last.arrival).getTime() - new Date(first.departure).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60_000);
}

/** Minutes as "13h 45m", dropping a zero hour or zero minute part. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
