"use client";

import { useSyncExternalStore } from "react";
import {
  getSavedTripsServerSnapshot,
  getSavedTripsSnapshot,
  removeSavedTrip,
  type SavedTrip,
  saveTrip,
  subscribeSavedTrips,
} from "./saved-trips";

/**
 * React binding over the saved-trips storage seam. `useSyncExternalStore`
 * subscribes to the store (writes from this tab via a custom event, and other
 * tabs via the native `storage` event) and reads a cached snapshot, so the list
 * stays in step without any setState-in-effect. The server snapshot is empty —
 * localStorage can't be read there — so SSR and the first client render agree,
 * then the real list appears after hydration.
 */
export function useSavedTrips() {
  const trips = useSyncExternalStore(
    subscribeSavedTrips,
    getSavedTripsSnapshot,
    getSavedTripsServerSnapshot,
  );

  return {
    trips,
    save: (trip: SavedTrip) => saveTrip(trip),
    remove: (id: string) => removeSavedTrip(id),
    isSaved: (id: string) => trips.some((t) => t.id === id),
  };
}
