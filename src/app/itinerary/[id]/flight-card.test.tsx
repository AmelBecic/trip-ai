import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Flight, FlightSegment } from "@/lib/types";
import { FlightCard } from "./flight-card";

afterEach(cleanup);

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

function flight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: "kix-lean-out",
    cabin: "economy",
    price: { amount: 165000, currency: "USD" },
    segments: [segment()],
    ...overrides,
  };
}

test("shows carrier, wall-clock times, cabin, and price", () => {
  render(<FlightCard flight={flight()} />);

  expect(screen.getByText("ZipAir")).not.toBeNull();
  expect(screen.getByText("11:20")).not.toBeNull();
  expect(screen.getByText("15:05")).not.toBeNull();
  expect(screen.getByText("Economy")).not.toBeNull();
  expect(screen.getByText("$1,650.00")).not.toBeNull();
});

test("labels a single-segment flight nonstop with its duration", () => {
  render(<FlightCard flight={flight()} />);

  expect(screen.getByText("Nonstop")).not.toBeNull();
  expect(screen.getByText("10h 45m")).not.toBeNull();
});

test("counts stops and joins distinct carriers on a connection", () => {
  render(
    <FlightCard
      flight={flight({
        segments: [
          segment({ from: "SFO", to: "NRT", carrier: "United" }),
          segment({
            from: "NRT",
            to: "KIX",
            carrier: "ANA",
            departure: "2026-11-03T17:00:00+09:00",
            arrival: "2026-11-03T18:30:00+09:00",
          }),
        ],
      })}
    />,
  );

  expect(screen.getByText("1 stop")).not.toBeNull();
  expect(screen.getByText("United, ANA")).not.toBeNull();
});

test("marks an overnight arrival with a day offset", () => {
  render(<FlightCard flight={flight()} />);

  // SFO departs Nov 2, KIX lands Nov 3 → +1.
  expect(screen.getByText("+1")).not.toBeNull();
});
