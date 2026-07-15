"use client";

import { Button } from "@/components/ui";
import type { SavedTrip } from "@/lib/saved-trips";
import { useSavedTrips } from "@/lib/use-saved-trips";

/**
 * Save/remove toggle for an itinerary on its detail page (TRIP-19). Reflects the
 * persisted state and flips between saving and removing. Before hydration the
 * store reads empty (see useSavedTrips), so it starts as "Save trip" and
 * settles to the real state right after mount.
 */
export function SaveTripButton({ trip }: { trip: SavedTrip }) {
  const { isSaved, save, remove } = useSavedTrips();
  const saved = isSaved(trip.id);

  return (
    <Button
      variant={saved ? "secondary" : "primary"}
      aria-pressed={saved}
      onClick={() => (saved ? remove(trip.id) : save(trip))}
    >
      {saved ? "Saved ✓" : "Save trip"}
    </Button>
  );
}
