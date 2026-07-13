/**
 * The day-by-day timeline model (TRIP-16). `buildTimeline` folds an itinerary's
 * activities, flights, and hotels into one calendar-ordered list of days, each
 * carrying its events in the order they happen — so a flight leg, a hotel
 * check-in, and an activity all sit on the day they fall on, not in three
 * separate sections. The `Timeline` component (see `./timeline`) only renders
 * what this produces; all the ordering and derivation lives here so it can be
 * tested without a DOM.
 *
 * Dates and times are read straight off the ISO strings, never through `Date`'s
 * local zone, so a day written "2026-11-03" always reads as that calendar day
 * and a "…T17:30:00+09:00" leg always shows 17:30, wherever the runtime runs.
 */

import { wallClockTime } from "@/lib/flight";
import type { Flight, Hotel, ItineraryDay, Money } from "@/lib/types";

export type TimelineEventKind = "flight" | "hotel" | "activity";

/** Where an untimed event anchors within its day: "open" leads (a morning
 *  check-out, a departure), "close" trails after the day's timed events. */
type EventAnchor = "open" | "close";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  /** "HH:MM" as written, or "" when the event carries no clock time. */
  time: string;
  title: string;
  detail?: string;
  cost?: Money;
  /** Ordering hint for untimed events; ignored once the day is sorted. */
  anchor?: EventAnchor;
}

export interface TimelineDay {
  /** ISO date. */
  date: string;
  /** The narrated day's title, when the itinerary has one for this date. */
  title?: string;
  events: TimelineEvent[];
}

/**
 * Every day the trip touches, in calendar order, each with its events ordered.
 * Days come from three sources merged by date: narrated days (title + their
 * activities), flight departure/arrival legs, and hotel check-in/out — so a
 * pure travel day (a departure before the first narrated day, a check-out after
 * the last) still gets a node.
 */
export function buildTimeline({
  flights,
  hotels,
  days,
}: {
  flights: Flight[];
  hotels: Hotel[];
  days: ItineraryDay[];
}): TimelineDay[] {
  const byDate = new Map<string, { title?: string; events: TimelineEvent[] }>();

  const nodeFor = (date: string) => {
    let node = byDate.get(date);
    if (!node) {
      node = { events: [] };
      byDate.set(date, node);
    }
    return node;
  };

  // Narrated days carry the title and each day's own activities.
  for (const day of days) {
    const node = nodeFor(day.date);
    node.title = day.title;
    for (const activity of day.activities) {
      node.events.push({
        id: activity.id,
        kind: "activity",
        time: activity.start ? wallClockTime(activity.start) : "",
        title: activity.name,
        detail: activity.location,
        cost: activity.cost,
      });
    }
  }

  // Each flight contributes a departure and an arrival, on their own dates.
  for (const flight of flights) {
    const first = flight.segments[0];
    const last = flight.segments[flight.segments.length - 1];
    if (!first || !last) continue;

    const depDate = isoDate(first.departure);
    if (depDate) {
      nodeFor(depDate).events.push({
        id: `${flight.id}-dep`,
        kind: "flight",
        time: wallClockTime(first.departure),
        title: `Depart ${first.from}`,
        detail: flightLabel(first.carrier, first.flightNumber),
        anchor: "open",
      });
    }
    const arrDate = isoDate(last.arrival);
    if (arrDate) {
      nodeFor(arrDate).events.push({
        id: `${flight.id}-arr`,
        kind: "flight",
        time: wallClockTime(last.arrival),
        title: `Arrive ${last.to}`,
        detail: flightLabel(last.carrier, last.flightNumber),
        anchor: "open",
      });
    }
  }

  // Hotels bookend their stay: check-out leads its day (a morning departure),
  // check-in trails the day's timed plans (you settle in on arrival).
  for (const hotel of hotels) {
    const checkIn = isoDate(hotel.checkIn);
    if (checkIn) {
      nodeFor(checkIn).events.push({
        id: `${hotel.id}-checkin`,
        kind: "hotel",
        time: "",
        title: `Check in — ${hotel.name}`,
        detail: hotel.address,
        anchor: "close",
      });
    }
    const checkOut = isoDate(hotel.checkOut);
    if (checkOut) {
      nodeFor(checkOut).events.push({
        id: `${hotel.id}-checkout`,
        kind: "hotel",
        time: "",
        title: `Check out — ${hotel.name}`,
        detail: hotel.address,
        anchor: "open",
      });
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => compareStrings(a, b))
    .map(([date, node]) => ({
      date,
      title: node.title,
      events: [...node.events].sort(compareEvents),
    }));
}

const DAY_OPEN = -1;
const DAY_CLOSE = 24 * 60 + 1;

/** A minute-of-day sort key: real time when the event has one, else its anchor
 *  pushes it to the head ("open") or tail ("close", the default) of the day. */
function eventSortValue(event: TimelineEvent): number {
  const minutes = timeToMinutes(event.time);
  if (minutes !== null) return minutes;
  return event.anchor === "open" ? DAY_OPEN : DAY_CLOSE;
}

/** Sort a day's events by time; a stable sort keeps equal keys in insertion
 *  order, so same-minute or same-anchor events hold the order they were added. */
function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  return eventSortValue(a) - eventSortValue(b);
}

function timeToMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** A carrier + flight number as "ANA NH107", tolerant of a missing half. */
function flightLabel(carrier: string, flightNumber: string): string {
  return `${carrier} ${flightNumber}`.trim();
}

/** The `YYYY-MM-DD` head of an ISO date or datetime, or "" if there isn't one. */
function isoDate(iso: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(iso)?.[1] ?? "";
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * A day's date as "Tue, Nov 3". Formats the `YYYY-MM-DD` head in UTC, so the
 * weekday can't drift a day either way with the runtime's zone. Empty when the
 * string carries no date.
 */
export function formatDayDate(iso: string): string {
  const date = isoDate(iso);
  if (!date) return "";
  return DAY_LABEL.format(new Date(`${date}T00:00:00Z`));
}
