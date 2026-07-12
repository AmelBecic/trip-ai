import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
};

// Stub route so the planning flow has a live destination. TRIP-12 builds the
// results / itinerary overview.
export default function Results() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-foreground">Results</h1>
      <p className="text-muted-foreground">
        Matching itineraries and their budget breakdown land here.
      </p>
    </section>
  );
}
