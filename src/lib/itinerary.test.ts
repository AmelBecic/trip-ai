import { expect, test } from "vitest";
import type { Flight, Hotel, ItineraryDay } from "@/lib/types";
import { buildTimeline, formatDayDate } from "./itinerary";

function day(
  date: string,
  title: string,
  activities: ItineraryDay["activities"] = [],
): ItineraryDay {
  return { date, title, activities };
}

function flight(id: string): Flight {
  return {
    id,
    cabin: "economy",
    price: { amount: 100000, currency: "USD" },
    segments: [
      {
        from: "SFO",
        to: "KIX",
        departure: "2026-11-02T13:40:00-08:00",
        arrival: "2026-11-03T17:30:00+09:00",
        carrier: "ANA",
        flightNumber: "NH107",
      },
    ],
  };
}

function hotel(id: string): Hotel {
  return {
    id,
    name: "Hotel Kanra",
    address: "Shimogyo, Kyoto",
    rating: 5,
    checkIn: "2026-11-03",
    checkOut: "2026-11-06",
    nights: 3,
    nightlyRate: { amount: 32000, currency: "USD" },
    total: { amount: 96000, currency: "USD" },
  };
}

test("merges narrated days, flight legs, and hotel stays into calendar order", () => {
  const timeline = buildTimeline({
    flights: [flight("f1")],
    hotels: [hotel("h1")],
    days: [day("2026-11-03", "Arrival"), day("2026-11-04", "Higashiyama")],
  });

  // Nov 2 (departure), Nov 3 (arrival + check-in + day), Nov 4 (day), Nov 6 (check-out).
  expect(timeline.map((d) => d.date)).toEqual([
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-06",
  ]);
});

test("a pure travel day outside the narrated days still gets a node", () => {
  const timeline = buildTimeline({
    flights: [flight("f1")],
    hotels: [],
    days: [day("2026-11-03", "Arrival")],
  });

  const departure = timeline.find((d) => d.date === "2026-11-02");
  expect(departure?.title).toBeUndefined();
  expect(departure?.events.map((e) => e.title)).toEqual(["Depart SFO"]);
});

test("orders a day's events: flight arrival, then timed activity, then check-in", () => {
  const timeline = buildTimeline({
    flights: [flight("f1")],
    hotels: [hotel("h1")],
    days: [
      day("2026-11-03", "Arrival", [
        {
          id: "a1",
          name: "Evening stroll",
          start: "2026-11-03T19:30:00+09:00",
        },
      ]),
    ],
  });

  const nov3 = timeline.find((d) => d.date === "2026-11-03");
  expect(nov3?.events.map((e) => e.title)).toEqual([
    "Arrive KIX",
    "Evening stroll",
    "Check in — Hotel Kanra",
  ]);
});

test("check-out leads its day, ahead of any timed event", () => {
  const timeline = buildTimeline({
    flights: [],
    hotels: [hotel("h1")],
    days: [
      day("2026-11-06", "Departure day", [
        { id: "a1", name: "Last coffee", start: "2026-11-06T08:00:00+09:00" },
      ]),
    ],
  });

  const nov6 = timeline.find((d) => d.date === "2026-11-06");
  expect(nov6?.events.map((e) => e.title)).toEqual([
    "Check out — Hotel Kanra",
    "Last coffee",
  ]);
});

test("timed activities sort chronologically, untimed ones trail", () => {
  const timeline = buildTimeline({
    flights: [],
    hotels: [],
    days: [
      day("2026-11-04", "A day", [
        { id: "late", name: "late", start: "2026-11-04T19:00:00+09:00" },
        { id: "untimed", name: "untimed" },
        { id: "early", name: "early", start: "2026-11-04T08:00:00+09:00" },
      ]),
    ],
  });

  expect(timeline[0].events.map((e) => e.id)).toEqual([
    "early",
    "late",
    "untimed",
  ]);
});

test("flight events carry the wall-clock time and carrier label", () => {
  const timeline = buildTimeline({
    flights: [flight("f1")],
    hotels: [],
    days: [],
  });

  const arrival = timeline
    .flatMap((d) => d.events)
    .find((e) => e.title === "Arrive KIX");
  expect(arrival?.time).toBe("17:30");
  expect(arrival?.detail).toBe("ANA NH107");
});

test("an empty itinerary yields no days", () => {
  expect(buildTimeline({ flights: [], hotels: [], days: [] })).toEqual([]);
});

test("formatDayDate reads the calendar date, independent of any time part", () => {
  expect(formatDayDate("2026-11-03")).toMatch(/Nov 3/);
  expect(formatDayDate("2026-11-03T23:30:00+09:00")).toMatch(/Nov 3/);
  expect(formatDayDate("not-a-date")).toBe("");
});
