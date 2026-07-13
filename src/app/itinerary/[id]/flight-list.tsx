import type { Flight } from "@/lib/types";
import { FlightCard } from "./flight-card";

/**
 * The flights section of the itinerary (TRIP-13): a card per option, or a plain
 * note when an itinerary carries none. Typed on `Flight[]` so the empty case is
 * a length check, not a missing-data guess.
 */
export function FlightList({ flights }: { flights: Flight[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="flights-heading">
      <h2
        id="flights-heading"
        className="text-lg font-semibold text-foreground"
      >
        Flights
      </h2>

      {flights.length > 0 ? (
        <ul className="grid gap-3">
          {flights.map((flight) => (
            <li key={flight.id}>
              <FlightCard flight={flight} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No flights are included in this itinerary.
        </p>
      )}
    </section>
  );
}
