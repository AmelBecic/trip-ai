import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Hotel } from "@/lib/types";
import { HotelList } from "./hotel-list";

afterEach(cleanup);

function hotel(id: string, name: string, rating = 4): Hotel {
  return {
    id,
    name,
    address: "Higashiyama, Kyoto",
    rating,
    checkIn: "2026-11-03",
    checkOut: "2026-11-09",
    nights: 6,
    nightlyRate: { amount: 9500, currency: "USD" },
    total: { amount: 57000, currency: "USD" },
  };
}

test("renders one item per hotel", () => {
  render(
    <HotelList
      hotels={[hotel("a", "Gion Guesthouse"), hotel("b", "Hotel Kanra")]}
    />,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Gion Guesthouse")).not.toBeNull();
  expect(screen.getByText("Hotel Kanra")).not.toBeNull();
});

test("shows the min-star floor beside the heading when set", () => {
  render(<HotelList hotels={[hotel("a", "Gion Guesthouse")]} minRating={4} />);

  expect(screen.getByText("4★ minimum")).not.toBeNull();
});

test("shows an empty note and no list when there are no hotels", () => {
  render(<HotelList hotels={[]} />);

  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText(/no hotels/i)).not.toBeNull();
});
