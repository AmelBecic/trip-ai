import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItinerary } from "@/lib/data";
import { minHotelRating } from "@/lib/hotel";
import { BudgetBar } from "./budget-bar";
import { FlightList } from "./flight-list";
import { HotelList } from "./hotel-list";

export const metadata: Metadata = {
  title: "Itinerary",
};

/**
 * Itinerary detail — the destination of the results overview's select action.
 * Resolves the trip by id and lays out its summary, budget bar, flights, and
 * hotels. TRIP-16 adds the day-by-day timeline below.
 */
export default async function ItineraryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itinerary = await getItinerary(id);
  if (!itinerary) notFound();

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

      <BudgetBar budget={itinerary.budget} />

      <FlightList flights={itinerary.flights} />

      <HotelList
        hotels={itinerary.hotels}
        minRating={minHotelRating(itinerary.search.constraints)}
      />
    </section>
  );
}
