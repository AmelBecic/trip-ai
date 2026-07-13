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
  // A mid cap spans every budget status, so all three pills show at once.
  expect(screen.getByText("Under budget")).not.toBeNull();
  expect(screen.getByText("Near budget")).not.toBeNull();
  expect(screen.getByText("Over budget")).not.toBeNull();
});

test("each option offers a select action into its itinerary detail", async () => {
  render(
    await Results({
      searchParams: params({ destination: "KIX", budget: "650000", currency: "USD" }),
    }),
  );

  const links = screen.getAllByRole("link", { name: /view itinerary/i });
  expect(links).toHaveLength(3);
  for (const link of links) {
    expect(link.getAttribute("href")).toMatch(/^\/itinerary\/kix-/);
  }
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
