import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan a trip",
};

// Stub route so the header nav has no dead links. TRIP-9 builds the search form.
export default function Plan() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-foreground">Plan a trip</h1>
      <p className="text-muted-foreground">The trip search form lands here.</p>
    </section>
  );
}
