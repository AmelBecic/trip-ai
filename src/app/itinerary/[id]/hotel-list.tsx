import type { Hotel } from "@/lib/types";
import { HotelCard } from "./hotel-card";

/**
 * The lodging section of the itinerary (TRIP-14): a card per stay, or a plain
 * note when an itinerary carries none. When the search set a min-star floor it's
 * shown beside the heading, and each card flags a stay that falls below it.
 * Typed on `Hotel[]` so the empty case is a length check, not a missing-data guess.
 */
export function HotelList({
  hotels,
  minRating = null,
}: {
  hotels: Hotel[];
  minRating?: number | null;
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="hotels-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="hotels-heading" className="text-lg font-semibold text-foreground">
          Hotels
        </h2>
        {minRating !== null ? (
          <span className="text-xs text-muted-foreground">
            {minRating}★ minimum
          </span>
        ) : null}
      </div>

      {hotels.length > 0 ? (
        <ul className="grid gap-3">
          {hotels.map((hotel) => (
            <li key={hotel.id}>
              <HotelCard hotel={hotel} minRating={minRating} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hotels are included in this itinerary.
        </p>
      )}
    </section>
  );
}
