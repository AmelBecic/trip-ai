import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { configureData, resetDataConfig } from "@/lib/data";
import Results from "./page";

// Drop the fixture latency so the async page resolves instantly under test.
beforeEach(() => configureData({ latencyMs: 0 }));
afterEach(() => {
  resetDataConfig();
  cleanup();
});

function params(overrides: Record<string, string>) {
  return Promise.resolve({
    start: "2026-11-02",
    end: "2026-11-09",
    adults: "2",
    ...overrides,
  });
}

test("lists the priced itineraries for a matched destination", async () => {
  render(
    await Results({
      searchParams: params({ destination: "KIX", budget: "650000", currency: "USD" }),
    }),
  );

  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("KIX");
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  // A mid cap spans every budget status, so at least one "over budget" pill shows.
  expect(screen.getAllByText(/budget$/).length).toBeGreaterThan(0);
});

test("shows the empty state when no itineraries match", async () => {
  render(
    await Results({
      searchParams: params({ destination: "XXX", budget: "650000", currency: "USD" }),
    }),
  );

  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  expect(screen.getByText(/no itineraries matched/i)).not.toBeNull();
});

test("degrades to a message instead of crashing when the seam throws", async () => {
  // The fixtures price in USD; a EUR cap makes searchTrips reject on mixed
  // currencies. The route should catch that, not blow up.
  render(
    await Results({
      searchParams: params({ destination: "KIX", budget: "600000", currency: "EUR" }),
    }),
  );

  expect(screen.getByText(/couldn.t load trips/i)).not.toBeNull();
});
