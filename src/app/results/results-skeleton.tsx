import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Skeleton,
} from "@/components/ui";

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

/** A stand-in for one itinerary card, matching ./page.tsx's card shape:
 *  title + description beside a status pill, a cost line, then a select action. */
function ItinerarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex items-baseline gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardFooter>
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
