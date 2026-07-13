import type { Metadata } from "next";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { searchTrips } from "@/lib/data";
import type { BudgetStatus, CabinClass, Money, TripSearch } from "@/lib/types";

export const metadata: Metadata = {
  title: "Results",
};

type SearchParams = Record<string, string | string[] | undefined>;

/** Repeated params collapse to their first value; the search contract is flat. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Read the flat query the search form writes (see `tripSearchToSearchParams`)
 * back into a TripSearch. Deliberately minimal — just enough to price the trips
 * — so this page can await `searchTrips` and exercise the loading skeleton.
 *
 * TODO(TRIP-12): owns the full, validated reverse mapping (cabin narrowing,
 * the minStars → constraint round-trip) and the rich itinerary overview.
 */
function paramsToSearch(params: SearchParams): TripSearch {
  return {
    origin: first(params.origin) ?? "",
    destination: (first(params.destination) ?? "").trim().toUpperCase(),
    dates: { start: first(params.start) ?? "", end: first(params.end) ?? "" },
    travelers: {
      adults: Number(first(params.adults) ?? 1),
      children: Number(first(params.children) ?? 0),
    },
    cabin: (first(params.cabin) as CabinClass) ?? "economy",
    budget: {
      amount: Number(first(params.budget) ?? 0),
      currency: first(params.currency) ?? "USD",
    },
    constraints: [],
  };
}

/** Minor units → a localized currency string, using the currency's own scale. */
function formatMoney({ amount, currency }: Money): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near budget",
  over: "Over budget",
};

/**
 * The results route. An async server component so navigation suspends on the
 * fixture latency and Next renders `loading.tsx` (the skeleton) meanwhile.
 * The itinerary cards here are intentionally thin — TRIP-12 builds the full
 * overview; the skeleton in ./results-skeleton.tsx tracks this shape.
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
    // The mock data prices only in USD; a mismatched-currency cap throws. Proper
    // error UI is TRIP-12's — keep this from crashing the route meanwhile.
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
              } within your ${formatMoney(search.budget)} budget.`
            : "No itineraries matched — try a different destination or budget."}
        </p>
      </div>

      {itineraries.length > 0 ? (
        <ul className="grid gap-4">
          {itineraries.map((itinerary) => (
            <li key={itinerary.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{itinerary.summary}</CardTitle>
                  <CardDescription>
                    {itinerary.days.length}-day trip · {itinerary.hotels.length}{" "}
                    {itinerary.hotels.length === 1 ? "stay" : "stays"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(itinerary.budget.total)} total
                  </span>
                  <Badge variant={itinerary.budget.status}>
                    {STATUS_LABEL[itinerary.budget.status]}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
