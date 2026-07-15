import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { configureData, resetDataConfig } from "@/lib/data";
import { paramsToSearch, type SearchParams } from "./params-to-search";
import { ResultsList } from "./page";

// The error branch renders ErrorState, a client component that reads useRouter;
// the app-router context is absent under jsdom, so stub next/navigation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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

test("shows the empty state with guidance and a CTA back to search when nothing matches", async () => {
  render(
    await ResultsList({
      search: searchFrom({ destination: "XXX", budget: "650000", currency: "USD" }),
    }),
  );

  // No itinerary options rendered (the guidance bullets are list items, so
  // assert on the absence of the per-trip "View itinerary" links instead).
  expect(screen.queryAllByRole("link", { name: /view itinerary/i })).toHaveLength(0);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/no trips/i);
  const cta = screen.getByRole("link", { name: /adjust your search/i });
  expect(cta.getAttribute("href")).toBe("/plan");
});

test("degrades to a retryable error state instead of crashing when the seam throws", async () => {
  // The fixtures price in USD; a EUR cap makes searchTrips reject on mixed
  // currencies. The list should catch that and render ErrorState, not blow up.
  render(
    await ResultsList({
      search: searchFrom({ destination: "KIX", budget: "600000", currency: "EUR" }),
    }),
  );

  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/something went wrong/i);
  expect(screen.getByRole("button", { name: /try again/i })).not.toBeNull();
});
