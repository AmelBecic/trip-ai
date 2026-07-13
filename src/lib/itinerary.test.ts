import { expect, test } from "vitest";
import type { Activity, ItineraryDay } from "@/lib/types";
import { activityTime, formatDayDate, orderedDays } from "./itinerary";

function activity(id: string, start?: string): Activity {
  return start ? { id, name: id, start } : { id, name: id };
}

function day(date: string, activities: Activity[] = []): ItineraryDay {
  return { date, title: date, activities };
}

test("orderedDays puts days in calendar order", () => {
  const result = orderedDays([
    day("2026-11-05"),
    day("2026-11-03"),
    day("2026-11-04"),
  ]);

  expect(result.map((d) => d.date)).toEqual([
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
  ]);
});

test("orderedDays sorts activities by start, untimed ones last in given order", () => {
  const result = orderedDays([
    day("2026-11-03", [
      activity("late", "2026-11-03T19:00:00+09:00"),
      activity("no-time-a"),
      activity("early", "2026-11-03T08:00:00+09:00"),
      activity("no-time-b"),
    ]),
  ]);

  expect(result[0].activities.map((a) => a.id)).toEqual([
    "early",
    "late",
    "no-time-a",
    "no-time-b",
  ]);
});

test("orderedDays does not mutate the input arrays", () => {
  const input = [day("2026-11-04"), day("2026-11-03")];
  orderedDays(input);

  expect(input.map((d) => d.date)).toEqual(["2026-11-04", "2026-11-03"]);
});

test("formatDayDate reads the calendar date, independent of any time part", () => {
  expect(formatDayDate("2026-11-03")).toMatch(/Nov 3/);
  expect(formatDayDate("2026-11-03T23:30:00+09:00")).toMatch(/Nov 3/);
});

test("formatDayDate is empty for a string with no date", () => {
  expect(formatDayDate("not-a-date")).toBe("");
});

test("activityTime is the wall-clock start, or empty when unscheduled", () => {
  expect(activityTime(activity("a", "2026-11-04T07:30:00+09:00"))).toBe("07:30");
  expect(activityTime(activity("b"))).toBe("");
});
