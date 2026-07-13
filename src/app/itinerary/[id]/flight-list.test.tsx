import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Flight } from "@/lib/types";
import { FlightList } from "./flight-list";

afterEach(cleanup);

function flight(id: string, carrier: string): Flight {
  return {
    id,
    cabin: "economy",
    price: { amount: 165000, currency: "USD" },
    segments: [
      {
        from: "SFO",
        to: "KIX",
        departure: "2026-11-02T11:20:00-08:00",
        arrival: "2026-11-03T15:05:00+09:00",
        carrier,
        flightNumber: "ZG25",
      },
    ],
  };
}

test("renders one item per flight", () => {
  render(
    <FlightList flights={[flight("a", "ZipAir"), flight("b", "ANA")]} />,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("ZipAir")).not.toBeNull();
  expect(screen.getByText("ANA")).not.toBeNull();
});

test("shows an empty note and no list when there are no flights", () => {
  render(<FlightList flights={[]} />);

  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText(/no flights/i)).not.toBeNull();
});
