import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { searchTrips } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import type { BudgetBreakdown, BudgetStatus } from "@/lib/types";
import { paramsToSearch, type SearchParams } from "./params-to-search";

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
 * The results route (TRIP-12). An async server component so navigation suspends
 * on the fixture latency and Next renders `loading.tsx` (the skeleton) meanwhile.
 * It reads the flat query into a validated `TripSearch`, prices it through the
 * data layer, and lists each option with its cost against the budget and a
 * select action into the full itinerary (fleshed out by TRIP-13–16).
 */
export default async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = paramsToSearch(await searchParams);

  let itineraries: Awaited<ReturnType<typeof searchTrips>>;
  try {
    itineraries = await searchTrips(search);
  } catch {
    // A cap in a currency the fixtures don't price in makes searchTrips reject on
    // mixed currencies. Proper error UI is TRIP-18's — keep the route standing.
    return (
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">Results</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t load trips for that search. Please try again.
        </p>
      </section>
    );
  }

  const heading = search.destination
    ? `Trips to ${search.destination}`
    : "Results";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">{heading}</h1>
        <p className="text-muted-foreground">
          {itineraries.length > 0
            ? `${itineraries.length} ${
                itineraries.length === 1 ? "itinerary" : "itineraries"
              } priced against your ${formatMoney(search.budget)} budget.`
            : "No itineraries matched — try a different destination or budget."}
        </p>
      </div>

      {itineraries.length > 0 ? (
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
      ) : null}
    </section>
  );
}
