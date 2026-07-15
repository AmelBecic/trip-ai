import { afterEach, beforeEach, expect, test } from "vitest";
import {
  getSavedTrips,
  isTripSaved,
  removeSavedTrip,
  type SavedTrip,
  saveTrip,
  toSavedTrip,
} from "./saved-trips";
import type { Itinerary } from "./types";

const STORAGE_KEY = "trip-planner:saved-trips:v1";

function makeTrip(overrides: Partial<SavedTrip> = {}): SavedTrip {
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
afterEach(() => localStorage.clear());

test("saves a trip and reads it back", () => {
  saveTrip(makeTrip());
  const trips = getSavedTrips();
  expect(trips).toHaveLength(1);
  expect(trips[0].id).toBe("kix-lean");
  expect(isTripSaved("kix-lean")).toBe(true);
});

test("saving the same id twice does not duplicate; newest is first", () => {
  saveTrip(makeTrip({ id: "a", summary: "First" }));
  saveTrip(makeTrip({ id: "b", summary: "Second" }));
  saveTrip(makeTrip({ id: "a", summary: "First again" }));

  const trips = getSavedTrips();
  expect(trips.map((t) => t.id)).toEqual(["a", "b"]);
  // Re-saving "a" moves it to the front and updates the snapshot.
  expect(trips[0].summary).toBe("First again");
});

test("stamps savedAt at save time, ignoring the caller's value", () => {
  saveTrip(makeTrip({ savedAt: "1999-01-01T00:00:00.000Z" }));
  expect(getSavedTrips()[0].savedAt).not.toBe("1999-01-01T00:00:00.000Z");
});

test("removes a saved trip", () => {
  saveTrip(makeTrip({ id: "a" }));
  saveTrip(makeTrip({ id: "b" }));
  removeSavedTrip("a");
  expect(getSavedTrips().map((t) => t.id)).toEqual(["b"]);
  expect(isTripSaved("a")).toBe(false);
});

test("tolerates malformed storage instead of throwing", () => {
  localStorage.setItem(STORAGE_KEY, "{ not json");
  expect(getSavedTrips()).toEqual([]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([{ nonsense: true }, makeTrip({ id: "ok" })]));
  expect(getSavedTrips().map((t) => t.id)).toEqual(["ok"]);
});

test("toSavedTrip snapshots the fields the list needs", () => {
  const itinerary = {
    id: "kix-lux",
    summary: "Osaka in style",
    search: { destination: "KIX" },
    flights: [],
    hotels: [],
    budget: {
      cap: { amount: 900000, currency: "USD" },
      total: { amount: 950000, currency: "USD" },
      status: "over",
      lines: [],
    },
    days: [{}, {}, {}],
  } as unknown as Itinerary;

  const snap = toSavedTrip(itinerary);
  expect(snap).toMatchObject({
    id: "kix-lux",
    summary: "Osaka in style",
    destination: "KIX",
    status: "over",
    days: 3,
  });
  expect(snap.total.amount).toBe(950000);
  expect(typeof snap.savedAt).toBe("string");
});
