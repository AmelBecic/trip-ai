import Link from "next/link";

/**
 * The no-results state for /results (TRIP-18). Rendered when a search matched
 * nothing — an unknown destination, or filters that excluded every trip. It
 * gives concrete ways to widen the search and a CTA back to the form, rather
 * than a bare "no results" line the traveller can't act on.
 */
export function EmptyState({ destination }: { destination?: string }) {
  return (
    <section className="flex flex-col gap-6" aria-labelledby="results-empty-heading">
      <div className="flex flex-col gap-2">
        <h1
          id="results-empty-heading"
          className="text-3xl font-semibold text-foreground"
        >
          {destination ? `No trips to ${destination}` : "No trips found"}
        </h1>
        <p className="text-muted-foreground">
          Nothing matched this search. A few ways to turn up more options:
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>Raise your budget cap, or try a less expensive destination.</li>
          <li>Widen your dates — more days usually means more availability.</li>
          <li>Relax your filters: lower the minimum hotel rating, or allow more stops.</li>
        </ul>
        <Link
          href="/plan"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-brand-300"
        >
          Adjust your search
        </Link>
      </div>
    </section>
  );
}
