import { expect, test } from "vitest";
import type { Flight, FlightSegment } from "@/lib/types";
import {
  cabinLabel,
  carriers,
  dayOffset,
  durationMinutes,
  formatDuration,
  stopCount,
  stopsLabel,
  wallClockTime,
} from "./flight";

function segment(overrides: Partial<FlightSegment> = {}): FlightSegment {
  return {
    from: "SFO",
    to: "KIX",
    departure: "2026-11-02T11:20:00-08:00",
    arrival: "2026-11-03T15:05:00+09:00",
    carrier: "ZipAir",
    flightNumber: "ZG25",
    ...overrides,
  };
}

function flight(segments: FlightSegment[]): Flight {
  return { id: "f", cabin: "economy", price: { amount: 0, currency: "USD" }, segments };
}

test("cabinLabel spells out each cabin class", () => {
  expect(cabinLabel("economy")).toBe("Economy");
  expect(cabinLabel("premium_economy")).toBe("Premium economy");
  expect(cabinLabel("business")).toBe("Business");
  expect(cabinLabel("first")).toBe("First");
});

test("stopCount is one less than the segment count", () => {
  expect(stopCount(flight([segment()]))).toBe(0);
  expect(stopCount(flight([segment(), segment()]))).toBe(1);
  expect(stopCount(flight([segment(), segment(), segment()]))).toBe(2);
});

test("stopCount never goes negative for an empty flight", () => {
  expect(stopCount(flight([]))).toBe(0);
});

test("stopsLabel pluralizes and names the nonstop case", () => {
  expect(stopsLabel(0)).toBe("Nonstop");
  expect(stopsLabel(1)).toBe("1 stop");
  expect(stopsLabel(2)).toBe("2 stops");
});

test("carriers lists distinct operators in order of travel", () => {
  const f = flight([
    segment({ carrier: "United" }),
    segment({ carrier: "ANA" }),
    segment({ carrier: "United" }),
  ]);
  expect(carriers(f)).toEqual(["United", "ANA"]);
});

test("wallClockTime reads the written time without a timezone shift", () => {
  expect(wallClockTime("2026-11-02T11:20:00-08:00")).toBe("11:20");
  expect(wallClockTime("2026-11-03T15:05:00+09:00")).toBe("15:05");
  expect(wallClockTime("2026-11-03")).toBe("");
});

test("dayOffset counts calendar days between departure and arrival", () => {
  expect(dayOffset("2026-11-02T23:00:00-08:00", "2026-11-03T07:00:00-08:00")).toBe(1);
  expect(dayOffset("2026-11-02T08:00:00-08:00", "2026-11-02T11:00:00-08:00")).toBe(0);
});

test("durationMinutes measures the real elapsed time across offsets", () => {
  // SFO 11:20 -0800 → KIX 15:05 +0900 is 10h 45m in the air.
  expect(durationMinutes(flight([segment()]))).toBe(645);
});

test("durationMinutes spans first departure to last arrival on a connection", () => {
  const f = flight([
    segment({ departure: "2026-11-02T08:00:00-08:00", arrival: "2026-11-02T11:00:00-06:00" }),
    segment({ departure: "2026-11-02T12:30:00-06:00", arrival: "2026-11-02T18:00:00-05:00" }),
  ]);
  // 08:00 PST → 18:00 EST is 7 hours.
  expect(durationMinutes(f)).toBe(420);
});

test("durationMinutes is null when times are unparseable or reversed", () => {
  expect(durationMinutes(flight([]))).toBeNull();
  expect(durationMinutes(flight([segment({ arrival: "not-a-date" })]))).toBeNull();
  expect(
    durationMinutes(
      flight([segment({ departure: "2026-11-03T15:05:00+09:00", arrival: "2026-11-02T11:20:00-08:00" })]),
    ),
  ).toBeNull();
});

test("formatDuration drops empty hour or minute parts", () => {
  expect(formatDuration(645)).toBe("10h 45m");
  expect(formatDuration(120)).toBe("2h");
  expect(formatDuration(45)).toBe("45m");
});
