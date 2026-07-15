import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { configureData, resetDataConfig } from "@/lib/data";
import { paramsToSearch, type SearchParams } from "./params-to-search";
import { ResultsList } from "./page";

// Drop the fixture latency so the async list resolves instantly under test.
beforeEach(() => configureData({ latencyMs: 0 }));
afterEach(() => {
  resetDataConfig();
  cleanup();
});

// The route shell parses the query into a TripSearch and hands it to ResultsList
// behind a Suspense boundary; the tests drive that list directly with a search.
function searchFrom(overrides: SearchParams) {
  return paramsToSearch({
    start: "2026-11-02",
    end: "2026-11-09",
    adults: "2",
    ...overrides,
  });
}

test("lists the priced itineraries for a matched destination", async () => {
  render(
    await ResultsList({
      search: searchFrom({ destination: "KIX", budget: "650000", currency: "USD" }),
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
    await ResultsList({
      search: searchFrom({ destination: "KIX", budget: "650000", currency: "USD" }),
    }),
  );

  const links = screen.getAllByRole("link", { name: /view itinerary/i });
  expect(links).toHaveLength(3);
  for (const link of links) {
    expect(link.getAttribute("href")).toMatch(/^\/itinerary\/kix-/);
  }
});

test("filters narrow the set — a 5-star floor drops the 4-star trips", async () => {
  render(
    await ResultsList({
      search: searchFrom({
        destination: "KIX",
        budget: "650000",
        currency: "USD",
        minStars: "5",
      }),
    }),
  );

  // kix-lean is a 4-star stay; only the two 5-star trips survive the floor.
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("shows the empty state when no itineraries match", async () => {
  render(
    await ResultsList({
      search: searchFrom({ destination: "XXX", budget: "650000", currency: "USD" }),
    }),
  );

  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  expect(screen.getByText(/no itineraries matched/i)).not.toBeNull();
});

test("degrades to a message instead of crashing when the seam throws", async () => {
  // The fixtures price in USD; a EUR cap makes searchTrips reject on mixed
  // currencies. The list should catch that, not blow up.
  render(
    await ResultsList({
      search: searchFrom({ destination: "KIX", budget: "600000", currency: "EUR" }),
    }),
  );

  expect(screen.getByText(/couldn.t load trips/i)).not.toBeNull();
});
