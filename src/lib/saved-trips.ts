import type { BudgetStatus, Itinerary, Money } from "./types";

/**
 * The persistence seam for saved trips (TRIP-19). Everything that touches
 * storage lives here, so swapping localStorage for a real backend later is a
 * one-file change — the UI only ever reaches storage through these functions
 * (via the `useSavedTrips` hook). A saved trip is a *display snapshot*, not the
 * whole itinerary: just enough to render the card and link back to it by id.
 */

export interface SavedTrip {
  id: string;
  summary: string;
  destination: string;
  total: Money;
  cap: Money;
  status: BudgetStatus;
  /** Number of days, for the card subtitle. */
  days: number;
  /** ISO 8601 timestamp of when it was saved, so the list can order newest-first. */
  savedAt: string;
}

const STORAGE_KEY = "trip-planner:saved-trips:v1";

/**
 * Dispatched on the current tab after every write. The native `storage` event
 * only reaches *other* tabs, so this is how the hook in this tab learns of a
 * change; the hook listens for both.
 */
export const SAVED_TRIPS_EVENT = "saved-trips:changed";

/** Snapshot an itinerary down to what the saved list needs to show. */
export function toSavedTrip(itinerary: Itinerary): SavedTrip {
  return {
    id: itinerary.id,
    summary: itinerary.summary,
    destination: itinerary.search.destination,
    total: itinerary.budget.total,
    cap: itinerary.budget.cap,
    status: itinerary.budget.status,
    days: itinerary.days.length,
    savedAt: new Date().toISOString(),
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function isSavedTrip(value: unknown): value is SavedTrip {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === "string" && typeof t.summary === "string";
}

/** The saved trips, newest first. Returns [] on the server or on malformed data. */
export function getSavedTrips(): SavedTrip[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    // Tolerate a corrupted or hand-edited store rather than throwing into render.
    return Array.isArray(parsed) ? parsed.filter(isSavedTrip) : [];
  } catch {
    return [];
  }
}

function write(trips: SavedTrip[]): SavedTrip[] {
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    window.dispatchEvent(new Event(SAVED_TRIPS_EVENT));
  }
  return trips;
}

/** Save (or re-save) a trip; stamped with the save time and kept newest-first,
 *  deduped by id so saving the same trip twice can't create a duplicate. */
export function saveTrip(trip: SavedTrip): SavedTrip[] {
  const stamped: SavedTrip = { ...trip, savedAt: new Date().toISOString() };
  const rest = getSavedTrips().filter((t) => t.id !== trip.id);
  return write([stamped, ...rest]);
}

/** Remove a saved trip by id. Returns the remaining trips. */
export function removeSavedTrip(id: string): SavedTrip[] {
  return write(getSavedTrips().filter((t) => t.id !== id));
}

export function isTripSaved(id: string): boolean {
  return getSavedTrips().some((t) => t.id === id);
}

// --- useSyncExternalStore adapters ------------------------------------------
// A stable empty reference for the server/SSR snapshot, and a cache so the
// client snapshot keeps the same array identity until the stored string
// actually changes (useSyncExternalStore requires getSnapshot to be cached).

const EMPTY: SavedTrip[] = [];
let cachedRaw: string | null = null;
let cachedValue: SavedTrip[] = EMPTY;

/** Subscribe to saved-trips changes from this tab and others. */
export function subscribeSavedTrips(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SAVED_TRIPS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_TRIPS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Referentially-stable client snapshot: same array until storage changes. */
export function getSavedTripsSnapshot(): SavedTrip[] {
  if (!canUseStorage()) return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = getSavedTrips();
  return cachedValue;
}

/** Server snapshot — localStorage is unreadable there, so the list starts empty. */
export function getSavedTripsServerSnapshot(): SavedTrip[] {
  return EMPTY;
}
