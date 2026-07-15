"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * The failure state for /results (TRIP-18). Shown when the data layer rejects —
 * the seam's error path, or an unsupported search such as a mixed-currency cap.
 * "Try again" re-runs the route's server components via router.refresh() (the
 * retry the ticket calls for), and there's always a way back to the form.
 */
export function ErrorState({ message }: { message?: string }) {
  const router = useRouter();
  return (
    <section className="flex flex-col gap-6" aria-labelledby="results-error-heading">
      <div className="flex flex-col gap-2">
        <h1
          id="results-error-heading"
          className="text-3xl font-semibold text-foreground"
        >
          Something went wrong
        </h1>
        <p role="alert" className="text-muted-foreground">
          {message ?? "We couldn't load trips for that search."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.refresh()}>Try again</Button>
        <Link
          href="/plan"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Back to search
        </Link>
      </div>
    </section>
  );
}
