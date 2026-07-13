import { expect, test } from "vitest";
import type { TripSearch } from "./types";
import { tripSearchToSearchParams } from "./search-params";

const base: TripSearch = {
  origin: "SFO",
  destination: "KIX",
  dates: { start: "2026-11-01", end: "2026-11-10" },
  travelers: { adults: 2, children: 1 },
  cabin: "economy",
  budget: { amount: 500000, currency: "USD" },
  constraints: [],
};

test("serializes every core field", () => {
  const params = tripSearchToSearchParams(base);

  expect(params.get("origin")).toBe("SFO");
  expect(params.get("destination")).toBe("KIX");
  expect(params.get("start")).toBe("2026-11-01");
  expect(params.get("end")).toBe("2026-11-10");
  expect(params.get("adults")).toBe("2");
  expect(params.get("children")).toBe("1");
  expect(params.get("cabin")).toBe("economy");
  expect(params.get("budget")).toBe("500000");
  expect(params.get("currency")).toBe("USD");
  expect(params.get("minStars")).toBeNull();
});

test("includes minStars only when a min-hotel-rating constraint is present", () => {
  const params = tripSearchToSearchParams({
    ...base,
    constraints: [{ kind: "min-hotel-rating", rating: 4 }],
  });

  expect(params.get("minStars")).toBe("4");
});

test("includes maxStops only when a max-stops constraint is present", () => {
  expect(tripSearchToSearchParams(base).get("maxStops")).toBeNull();

  const params = tripSearchToSearchParams({
    ...base,
    // stops: 0 is a real cap (nonstop only), not an absence.
    constraints: [{ kind: "max-stops", stops: 0 }],
  });
  expect(params.get("maxStops")).toBe("0");
});
