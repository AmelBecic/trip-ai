import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Hotel } from "@/lib/types";
import { HotelCard } from "./hotel-card";

afterEach(cleanup);

function hotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: "kix-lean-hotel",
    name: "Gion Guesthouse",
    address: "Higashiyama, Kyoto",
    rating: 4,
    checkIn: "2026-11-03",
    checkOut: "2026-11-09",
    nights: 6,
    nightlyRate: { amount: 9500, currency: "USD" },
    total: { amount: 57000, currency: "USD" },
    ...overrides,
  };
}

test("shows name, location, star rating, and nightly + total price", () => {
  render(<HotelCard hotel={hotel()} />);

  expect(screen.getByText("Gion Guesthouse")).not.toBeNull();
  expect(screen.getByText("Higashiyama, Kyoto")).not.toBeNull();
  expect(screen.getByLabelText("4 of 5 stars")).not.toBeNull();
  expect(screen.getByText("$95.00")).not.toBeNull();
  expect(screen.getByText("$570.00 total")).not.toBeNull();
});

test("announces the rounded, clamped star count so label matches the glyphs", () => {
  render(<HotelCard hotel={hotel({ rating: 3.5 })} />);

  // 3.5 rounds to 4 filled stars; the label must not announce the raw rating.
  expect(screen.getByLabelText("4 of 5 stars")).not.toBeNull();
  expect(screen.queryByLabelText("3.5 of 5 stars")).toBeNull();
});

test("flags a stay below the min-star requirement", () => {
  render(<HotelCard hotel={hotel({ rating: 3 })} minRating={4} />);

  expect(screen.getByText("Below 4★ minimum")).not.toBeNull();
});

test("does not flag a stay that meets the requirement", () => {
  render(<HotelCard hotel={hotel({ rating: 5 })} minRating={4} />);

  expect(screen.queryByText(/minimum/)).toBeNull();
});

test("keeps the below-minimum flag consistent with the rounded stars shown", () => {
  render(<HotelCard hotel={hotel({ rating: 3.5 })} minRating={4} />);

  // 3.5 rounds to 4 filled stars, so the card must not also flag it below 4.
  expect(screen.getByLabelText("4 of 5 stars")).not.toBeNull();
  expect(screen.queryByText(/minimum/)).toBeNull();
});
