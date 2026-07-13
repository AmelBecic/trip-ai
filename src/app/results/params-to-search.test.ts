import { expect, test } from "vitest";
import { tripSearchToSearchParams } from "@/lib/search-params";
import type { TripSearch } from "@/lib/types";
import { paramsToSearch } from "./params-to-search";

test("round-trips a search through the query contract", () => {
  const search: TripSearch = {
    origin: "SFO",
    destination: "KIX",
    dates: { start: "2026-11-02", end: "2026-11-09" },
    travelers: { adults: 2, children: 1 },
    cabin: "business",
    budget: { amount: 650000, currency: "EUR" },
    constraints: [{ kind: "min-hotel-rating", rating: 4 }],
  };

  const query = Object.fromEntries(tripSearchToSearchParams(search));

  expect(paramsToSearch(query)).toEqual(search);
});

test("narrows an unknown cabin to economy", () => {
  expect(paramsToSearch({ cabin: "spaceship" }).cabin).toBe("economy");
  expect(paramsToSearch({ cabin: "first" }).cabin).toBe("first");
});

test("narrows an unsupported currency to USD but keeps supported ones", () => {
  expect(paramsToSearch({ currency: "XYZ" }).budget.currency).toBe("USD");
  expect(paramsToSearch({ currency: "JPY" }).budget.currency).toBe("JPY");
});

test("coerces a missing or non-numeric budget to 0, never NaN", () => {
  expect(paramsToSearch({}).budget.amount).toBe(0);
  expect(paramsToSearch({ budget: "abc" }).budget.amount).toBe(0);
  expect(paramsToSearch({ budget: "650000" }).budget.amount).toBe(650000);
});

test("keeps at least one adult and drops a negative child count", () => {
  expect(paramsToSearch({ adults: "0" }).travelers.adults).toBe(1);
  expect(paramsToSearch({}).travelers.adults).toBe(1);
  expect(paramsToSearch({ children: "-3" }).travelers.children).toBe(0);
});

test("maps a positive minStars to a min-hotel-rating constraint, else none", () => {
  expect(paramsToSearch({ minStars: "4" }).constraints).toEqual([
    { kind: "min-hotel-rating", rating: 4 },
  ]);
  expect(paramsToSearch({ minStars: "0" }).constraints).toEqual([]);
  expect(paramsToSearch({}).constraints).toEqual([]);
});

test("maps maxStops to a max-stops constraint, treating 0 as a real cap", () => {
  expect(paramsToSearch({ maxStops: "1" }).constraints).toEqual([
    { kind: "max-stops", stops: 1 },
  ]);
  // 0 means nonstop-only — present, not absent.
  expect(paramsToSearch({ maxStops: "0" }).constraints).toEqual([
    { kind: "max-stops", stops: 0 },
  ]);
  expect(paramsToSearch({}).constraints).toEqual([]);
});

test("round-trips both constraints together in a stable order", () => {
  const search: TripSearch = {
    origin: "SFO",
    destination: "KIX",
    dates: { start: "2026-11-02", end: "2026-11-09" },
    travelers: { adults: 2, children: 0 },
    cabin: "economy",
    budget: { amount: 650000, currency: "USD" },
    constraints: [
      { kind: "min-hotel-rating", rating: 4 },
      { kind: "max-stops", stops: 1 },
    ],
  };

  const query = Object.fromEntries(tripSearchToSearchParams(search));
  expect(paramsToSearch(query)).toEqual(search);
});

test("normalizes origin and destination to trimmed uppercase", () => {
  const search = paramsToSearch({ origin: " sfo ", destination: " kix " });
  expect(search.origin).toBe("SFO");
  expect(search.destination).toBe("KIX");
});
