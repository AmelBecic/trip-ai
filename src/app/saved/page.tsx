import type { Metadata } from "next";
import { SavedTripsList } from "./saved-trips-list";

export const metadata: Metadata = {
  title: "Saved trips",
};

// Saved trips (TRIP-19). The list itself is a client component — it reads the
// localStorage-backed store — while this route stays a thin server shell.
export default function Saved() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">Saved trips</h1>
        <p className="text-muted-foreground">
          Itineraries you&apos;ve kept for later. Saved on this device.
        </p>
      </div>
      <SavedTripsList />
    </section>
  );
}
