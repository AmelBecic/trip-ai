/**
 * Presentation helpers for the day-by-day timeline (TRIP-16) — the derivations
 * the timeline needs over `ItineraryDay`/`Activity` (see `@/lib/types`) but that
 * don't belong on the data shape: the days and activities put into display order,
 * a day's date as a short label, and an activity's wall-clock time.
 *
 * Dates are read off the ISO strings without converting through `Date`'s local
 * zone, so a day written "2026-11-03" always reads as that calendar day and a
 * "…T07:30:00+09:00" activity always shows 07:30, wherever the runtime runs.
 */

import { wallClockTime } from "@/lib/flight";
import type { Activity, ItineraryDay } from "@/lib/types";

/**
 * Days in calendar order, each with its activities in the order they happen:
 * timed items first, chronologically, then untimed ones in their original order.
 * Returns fresh arrays so the caller never mutates the itinerary it was handed.
 */
export function orderedDays(days: ItineraryDay[]): ItineraryDay[] {
  return days
    .map((day) => ({
      ...day,
      activities: [...day.activities].sort(compareActivities),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Order two activities: timed before untimed, timed ones by their start. Two
 *  untimed activities compare equal, so a stable sort keeps their given order. */
function compareActivities(a: Activity, b: Activity): number {
  if (a.start && b.start) {
    return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
  }
  if (a.start) return -1;
  if (b.start) return 1;
  return 0;
}

const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * A day's date as "Tue, Nov 3". Reads the `YYYY-MM-DD` head of the string and
 * formats it in UTC, so the weekday can't drift a day either way with the
 * runtime's zone. Empty when the string carries no date.
 */
export function formatDayDate(iso: string): string {
  const date = /^(\d{4}-\d{2}-\d{2})/.exec(iso)?.[1];
  if (!date) return "";
  return DAY_LABEL.format(new Date(`${date}T00:00:00Z`));
}

/** An activity's "HH:MM" start as written, or "" when it has no scheduled time. */
export function activityTime(activity: Activity): string {
  return activity.start ? wallClockTime(activity.start) : "";
}
