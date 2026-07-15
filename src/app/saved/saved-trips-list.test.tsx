import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { type SavedTrip, saveTrip } from "@/lib/saved-trips";
import { SavedTripsList } from "./saved-trips-list";

function seed(overrides: Partial<SavedTrip> = {}) {
  return saveTrip({
    id: "kix-lean",
    summary: "Osaka on a budget",
    destination: "KIX",
    total: { amount: 420000, currency: "USD" },
    cap: { amount: 650000, currency: "USD" },
    status: "under",
    days: 7,
    savedAt: new Date().toISOString(),
    ...overrides,
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  cleanup();
});

test("shows an empty state with a CTA when nothing is saved", async () => {
  render(<SavedTripsList />);
  expect(await screen.findByText(/haven.t saved any trips yet/i)).not.toBeNull();
  const cta = screen.getByRole("link", { name: /plan a trip/i });
  expect(cta.getAttribute("href")).toBe("/plan");
});

test("lists saved trips with a link into the itinerary", async () => {
  seed();
  render(<SavedTripsList />);

  expect(await screen.findByText("Osaka on a budget")).not.toBeNull();
  const view = screen.getByRole("link", { name: /view/i });
  expect(view.getAttribute("href")).toBe("/itinerary/kix-lean");
});

test("removes a saved trip and falls back to the empty state", async () => {
  seed();
  render(<SavedTripsList />);

  const remove = await screen.findByRole("button", { name: /remove osaka on a budget/i });
  fireEvent.click(remove);

  await waitFor(() =>
    expect(screen.getByText(/haven.t saved any trips yet/i)).not.toBeNull(),
  );
});
