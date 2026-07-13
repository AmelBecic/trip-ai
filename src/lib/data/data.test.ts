import { afterEach, beforeEach, expect, test } from "vitest";
import type { Money, TripSearch } from "@/lib/types";
import {
  DataError,
  configureData,
  getFlights,
  getHotels,
  getItinerary,
  resetDataConfig,
  searchTrips,
} from "./index";

const usd = (dollars: number): Money => ({
  amount: dollars * 100,
  currency: "USD",
});

function searchFor(destination: string, capUsd: number): TripSearch {
  return {
    origin: "SFO",
    destination,
    dates: { start: "2026-11-02", end: "2026-11-09" },
    travelers: { adults: 2, children: 0 },
    cabin: "economy",
    budget: usd(capUsd),
    constraints: [],
  };
}

beforeEach(() => {
  // Keep the suite fast; the latency path itself is covered separately.
  configureData({ latencyMs: 0 });
});

afterEach(resetDataConfig);

test("unknown destination returns the empty set", async () => {
  expect(await searchTrips(searchFor("XXX", 6500))).toEqual([]);
});

test("a mid budget yields a mixed set spanning every status", async () => {
  const results = await searchTrips(searchFor("KIX", 6500));

  expect(results.length).toBeGreaterThan(1);
  const statuses = new Set(results.map((it) => it.budget.status));
  expect(statuses.has("under")).toBe(true);
  expect(statuses.has("near")).toBe(true);
  expect(statuses.has("over")).toBe(true);
});

test("a generous cap makes the whole set under budget", async () => {
  const results = await searchTrips(searchFor("KIX", 20000));

  expect(results.length).toBeGreaterThan(0);
  expect(results.every((it) => it.budget.status === "under")).toBe(true);
});

test("a tight cap pushes the whole set over budget", async () => {
  const results = await searchTrips(searchFor("KIX", 3000));

  expect(results.length).toBeGreaterThan(0);
  expect(results.every((it) => it.budget.status === "over")).toBe(true);
});

test("budget total is the sum of its lines and carries the caller's cap", async () => {
  const [trip] = await searchTrips(searchFor("KIX", 6500));

  const lineSum = trip.budget.lines.reduce((n, line) => n + line.amount.amount, 0);
  expect(trip.budget.total.amount).toBe(lineSum);
  expect(trip.budget.cap).toEqual(usd(6500));
});

test("rejects a budget in a currency the trips are not priced in", async () => {
  const eurBudget: TripSearch = { ...searchFor("KIX", 6500), budget: { amount: 600000, currency: "EUR" } };
  await expect(searchTrips(eurBudget)).rejects.toThrow(/mixed currencies/);
});

test("cabin acts as a comfort floor, not an exact match", async () => {
  // Economy keeps every trip; business narrows to the one splurge option.
  const economy = await searchTrips(searchFor("KIX", 6500));
  expect(economy).toHaveLength(3);

  const business = await searchTrips({
    ...searchFor("KIX", 6500),
    cabin: "business",
  });
  expect(business.map((it) => it.id)).toEqual(["kix-lux"]);
});

test("a min-hotel-rating constraint drops trips below the floor", async () => {
  const results = await searchTrips({
    ...searchFor("KIX", 6500),
    constraints: [{ kind: "min-hotel-rating", rating: 5 }],
  });

  // kix-lean is a 4-star stay; the two 5-star trips remain.
  expect(results.map((it) => it.id)).toEqual(["kix-classic", "kix-lux"]);
});

test("a max-stops constraint keeps only trips within the cap", async () => {
  // Every fixture flies nonstop, so a 0-stop cap keeps them all…
  const nonstop = await searchTrips({
    ...searchFor("KIX", 6500),
    constraints: [{ kind: "max-stops", stops: 0 }],
  });
  expect(nonstop).toHaveLength(3);
});

test("filters that match nothing yield the empty set", async () => {
  const results = await searchTrips({
    ...searchFor("KIX", 6500),
    cabin: "first",
  });
  expect(results).toEqual([]);
});

test("getItinerary resolves a known id and null otherwise", async () => {
  const trip = await getItinerary("kix-lean");
  expect(trip?.id).toBe("kix-lean");
  expect(await getItinerary("nope")).toBeNull();
});

test("flight and hotel getters return the trip's own records", async () => {
  expect((await getFlights("kix-lean")).length).toBeGreaterThan(0);
  expect((await getHotels("kix-lean")).length).toBeGreaterThan(0);
  expect(await getFlights("nope")).toEqual([]);
});

test("the error toggle makes reads reject with DataError", async () => {
  configureData({ shouldFail: true });
  await expect(searchTrips(searchFor("KIX", 6500))).rejects.toBeInstanceOf(
    DataError,
  );
});

test("resetDataConfig clears the error toggle", async () => {
  configureData({ shouldFail: true });
  resetDataConfig();
  configureData({ latencyMs: 0 });
  await expect(searchTrips(searchFor("KIX", 6500))).resolves.toHaveLength(3);
});
