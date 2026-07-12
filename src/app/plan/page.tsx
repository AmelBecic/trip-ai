import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan a trip",
};

// Stub route so the header nav has no dead links. TRIP-9 builds the search form;
// for now it links straight through to the results destination.
export default function Plan() {
  return (
    <section className="flex flex-col items-start gap-2">
      <h1 className="text-3xl font-semibold text-foreground">Plan a trip</h1>
      <p className="text-muted-foreground">The trip search form lands here.</p>
      <Link
        href="/results"
        className="mt-2 rounded-md text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        See results
      </Link>
    </section>
  );
}
