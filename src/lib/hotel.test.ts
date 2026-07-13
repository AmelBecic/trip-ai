import { expect, test } from "vitest";
import { meetsMinRating, minHotelRating, starCounts } from "@/lib/hotel";
import type { Constraint, Hotel } from "@/lib/types";

function hotel(rating: number): Hotel {
  return {
    id: "h",
    name: "Test Hotel",
    address: "Somewhere",
    rating,
    checkIn: "2026-11-03",
    checkOut: "2026-11-09",
    nights: 6,
    nightlyRate: { amount: 9500, currency: "USD" },
    total: { amount: 57000, currency: "USD" },
  };
}

test("minHotelRating picks the min-hotel-rating constraint, ignoring others", () => {
  const constraints: Constraint[] = [
    { kind: "max-stops", stops: 1 },
    { kind: "min-hotel-rating", rating: 4 },
  ];
  expect(minHotelRating(constraints)).toBe(4);
});

test("minHotelRating is null when no min-star constraint is present", () => {
  expect(minHotelRating([{ kind: "avoid-red-eye" }])).toBeNull();
  expect(minHotelRating([])).toBeNull();
});

test("meetsMinRating treats a null minimum as always met", () => {
  expect(meetsMinRating(hotel(2), null)).toBe(true);
});

test("meetsMinRating compares rating against the floor inclusively", () => {
  expect(meetsMinRating(hotel(4), 4)).toBe(true);
  expect(meetsMinRating(hotel(3), 4)).toBe(false);
});

test("starCounts rounds and clamps to a 0–5 scale", () => {
  expect(starCounts(4)).toEqual({ filled: 4, empty: 1 });
  expect(starCounts(0)).toEqual({ filled: 0, empty: 5 });
  expect(starCounts(7)).toEqual({ filled: 5, empty: 0 });
  expect(starCounts(3.5)).toEqual({ filled: 4, empty: 1 });
});
