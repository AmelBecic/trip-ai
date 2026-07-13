import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getItinerary } from "@/lib/data";
import { minHotelRating } from "@/lib/hotel";
import { formatMoney } from "@/lib/money";
import type { BudgetStatus } from "@/lib/types";
import { FlightList } from "./flight-list";
import { HotelList } from "./hotel-list";

export const metadata: Metadata = {
  title: "Itinerary",
};

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near budget",
  over: "Over budget",
};

/**
 * Itinerary detail — the destination of the results overview's select action.
 * Intentionally a thin shell for now: it resolves the trip by id and shows its
 * summary and budget verdict. TRIP-13–16 build the real body here (flight and
 * hotel cards, the budget breakdown bar, and the day-by-day timeline).
 */
export default async function ItineraryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itinerary = await getItinerary(id);
  if (!itinerary) notFound();

  const { budget } = itinerary;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/plan"
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          ← New search
        </Link>
        <h1 className="text-3xl font-semibold text-foreground">
          {itinerary.summary}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle>Budget</CardTitle>
            <Badge variant={budget.status}>{STATUS_LABEL[budget.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-semibold text-foreground">
            {formatMoney(budget.total)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatMoney(budget.cap)} budget
          </span>
        </CardContent>
      </Card>

      <FlightList flights={itinerary.flights} />

      <HotelList
        hotels={itinerary.hotels}
        minRating={minHotelRating(itinerary.search.constraints)}
      />
    </section>
  );
}
