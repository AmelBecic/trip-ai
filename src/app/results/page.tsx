import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { DataError, searchTrips } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { tripSearchToSearchParams } from "@/lib/search-params";
import type { BudgetBreakdown, BudgetStatus, TripSearch } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { FiltersSidebar } from "./filters-sidebar";
import { paramsToSearch, type SearchParams } from "./params-to-search";
import { ResultsSkeleton } from "./results-skeleton";

export const metadata: Metadata = {
  title: "Results",
};

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near budget",
  over: "Over budget",
};

// Complete literals so Tailwind's scanner emits them — a `text-budget-${status}`
// template would never be generated.
const DELTA_CLASS: Record<BudgetStatus, string> = {
  under: "text-budget-under",
  near: "text-budget-near",
  over: "text-budget-over",
};

/**
 * Spend against the cap, phrased for a human: how much is left, or how far over.
 * Both amounts share a currency in this path (the fixtures price in USD and the
 * cap is validated), but the guard keeps a mixed pair from producing nonsense.
 */
function budgetDelta({
  total,
  cap,
  status,
}: BudgetBreakdown): { label: string } | null {
  if (total.currency !== cap.currency) return null;
  const diff = cap.amount - total.amount;
  if (status === "over") {
    return { label: `${formatMoney({ amount: -diff, currency: cap.currency })} over` };
  }
  return { label: `${formatMoney({ amount: diff, currency: cap.currency })} to spare` };
}

/**
 * The priced list for one search. Split out from the route shell so it can be
 * the thing that suspends: the parent keys a Suspense boundary on the query, so
 * every filter change re-runs this fetch behind `ResultsSkeleton` while the
 * sidebar stays put. Exported for the route tests, which exercise the list
 * directly with a parsed search.
 */
export async function ResultsList({ search }: { search: TripSearch }) {
  let itineraries: Awaited<ReturnType<typeof searchTrips>>;
  try {
    itineraries = await searchTrips(search);
  } catch (err) {
    // Two failure classes land here. A DataError is the seam's transient outage
    // — a retry can clear it, so offer one and surface its message. Anything
    // else is deterministic for this search (e.g. a mixed-currency cap the
    // pricing always rejects): router.refresh() would only reproduce it, so drop
    // the no-op retry and point the user back to adjusting the search instead.
    if (err instanceof DataError) {
      return <ErrorState message={err.message} />;
    }
    return (
      <ErrorState
        retryable={false}
        message="We can't price this search — the budget cap uses a different currency than these trips. Adjust your search and try again."
      />
    );
  }

  if (itineraries.length === 0) {
    return <EmptyState destination={search.destination} />;
  }

  const heading = search.destination
    ? `Trips to ${search.destination}`
    : "Results";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">{heading}</h1>
        <p className="text-muted-foreground">
          {`${itineraries.length} ${
            itineraries.length === 1 ? "itinerary" : "itineraries"
          } priced against your ${formatMoney(search.budget)} budget.`}
        </p>
      </div>

      <ul className="grid gap-4">
        {itineraries.map((itinerary) => {
            const { budget } = itinerary;
            const delta = budgetDelta(budget);
            return (
              <li key={itinerary.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle>{itinerary.summary}</CardTitle>
                        <CardDescription>
                          {itinerary.days.length}-day trip ·{" "}
                          {itinerary.hotels.length}{" "}
                          {itinerary.hotels.length === 1 ? "stay" : "stays"} ·{" "}
                          {itinerary.flights.length}{" "}
                          {itinerary.flights.length === 1 ? "flight" : "flights"}
                        </CardDescription>
                      </div>
                      <Badge variant={budget.status}>
                        {STATUS_LABEL[budget.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl font-semibold text-foreground">
                      {formatMoney(budget.total)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatMoney(budget.cap)} budget
                    </span>
                    {delta ? (
                      <span
                        className={`ml-auto text-sm font-medium ${DELTA_CLASS[budget.status]}`}
                      >
                        {delta.label}
                      </span>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/itinerary/${itinerary.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-brand-300"
                    >
                      View itinerary
                    </Link>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
      </ul>
    </section>
  );
}

/**
 * The results route (TRIP-12), now with a filters sidebar (TRIP-17). Reads the
 * flat query into a validated `TripSearch`, then lays out the sidebar beside the
 * priced list. The list is wrapped in a Suspense boundary keyed on the query, so
 * adjusting a filter (which rewrites the query) re-runs `searchTrips` behind the
 * skeleton while the sidebar — outside the boundary — keeps its state.
 */
export default async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = paramsToSearch(await searchParams);
  // A stable, order-independent identity for the current query, so the boundary
  // re-suspends on any filter change and not on incidental param reordering.
  const queryKey = tripSearchToSearchParams(search).toString();

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      <FiltersSidebar className="md:sticky md:top-8 md:w-64 md:shrink-0" />
      <div className="min-w-0 flex-1">
        <Suspense key={queryKey} fallback={<ResultsSkeleton />}>
          <ResultsList search={search} />
        </Suspense>
      </div>
    </div>
  );
}
