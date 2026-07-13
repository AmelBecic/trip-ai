import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

/*
 * The results screen's loading state. It pre-draws the real layout — a heading,
 * a subheading, and a column of itinerary cards — so content swaps in without
 * shifting (no spinner-only screen). Keep this structurally in step with the
 * page's own itinerary card in ./page.tsx; when TRIP-12 fleshes those cards out,
 * the skeleton's block sizes should track them.
 *
 * The whole region is a single role="status" so assistive tech hears one
 * "Loading trip results" rather than a stream of anonymous placeholders.
 */

/** A stand-in for one itinerary card, matching ./page.tsx's card shape. */
function ItinerarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

export function ResultsSkeleton() {
  return (
    <section
      role="status"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">Loading trip results…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <ItinerarySkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
