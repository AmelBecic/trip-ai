import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { isTripSaved, type SavedTrip, saveTrip } from "@/lib/saved-trips";
import { SaveTripButton } from "./save-trip-button";

function trip(overrides: Partial<SavedTrip> = {}): SavedTrip {
  return {
    id: "kix-lean",
    summary: "Osaka on a budget",
    destination: "KIX",
    total: { amount: 420000, currency: "USD" },
    cap: { amount: 650000, currency: "USD" },
    status: "under",
    days: 7,
    savedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  cleanup();
});

test("saves the trip and reflects the saved state", async () => {
  render(<SaveTripButton trip={trip()} />);

  fireEvent.click(await screen.findByRole("button", { name: /save trip/i }));

  expect(isTripSaved("kix-lean")).toBe(true);
  const saved = await screen.findByRole("button", { name: /saved/i });
  expect(saved.getAttribute("aria-pressed")).toBe("true");
});

test("toggles back off, removing the trip", async () => {
  render(<SaveTripButton trip={trip()} />);

  fireEvent.click(await screen.findByRole("button", { name: /save trip/i })); // save
  fireEvent.click(await screen.findByRole("button", { name: /saved/i })); // remove

  expect(isTripSaved("kix-lean")).toBe(false);
  expect(await screen.findByRole("button", { name: /save trip/i })).not.toBeNull();
});

test("starts from the persisted state for an already-saved trip", async () => {
  saveTrip(trip());
  render(<SaveTripButton trip={trip()} />);
  expect(await screen.findByRole("button", { name: /saved/i })).not.toBeNull();
});
