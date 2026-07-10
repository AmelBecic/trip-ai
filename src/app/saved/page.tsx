import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved trips",
};

// Stub route so the header nav has no dead links. TRIP-19 builds saved trips.
export default function Saved() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-foreground">Saved trips</h1>
      <p className="text-muted-foreground">Your saved itineraries land here.</p>
    </section>
  );
}
