import { Badge, Card } from "@/components/ui";
import {
  cabinLabel,
  carriers,
  dayOffset,
  durationMinutes,
  formatDuration,
  stopCount,
  stopsLabel,
  wallClockTime,
} from "@/lib/flight";
import { formatMoney } from "@/lib/money";
import type { Flight } from "@/lib/types";

/**
 * One flight option (TRIP-13): who flies it, when it leaves and lands, how long
 * and how many stops, the cabin, and the price. Derivations live in `@/lib/flight`
 * so this stays a layout. Long carrier and airport strings truncate rather than
 * push the price off the card.
 */
export function FlightCard({ flight }: { flight: Flight }) {
  const { segments } = flight;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const carrierLabel = carriers(flight).join(", ");
  const duration = durationMinutes(flight);
  const stops = stopCount(flight);
  const offset = first && last ? dayOffset(first.departure, last.arrival) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium text-foreground">
            {carrierLabel || "Flight"}
          </span>

          {first && last ? (
            <span className="flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
              <span className="tabular-nums text-foreground">
                {wallClockTime(first.departure)}
              </span>
              <span className="min-w-0 truncate">{first.from}</span>
              <span aria-hidden>→</span>
              <span className="whitespace-nowrap tabular-nums text-foreground">
                {wallClockTime(last.arrival)}
                {offset > 0 ? (
                  <sup
                    className="ml-0.5 text-xs text-muted-foreground"
                    title={`Arrives ${offset} day${offset === 1 ? "" : "s"} later`}
                  >
                    +{offset}
                  </sup>
                ) : null}
              </span>
              <span className="min-w-0 truncate">{last.to}</span>
            </span>
          ) : null}

          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {duration !== null ? (
              <>
                <span>{formatDuration(duration)}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{stopsLabel(stops)}</span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold text-foreground">
            {formatMoney(flight.price)}
          </span>
          <Badge>{cabinLabel(flight.cabin)}</Badge>
        </div>
      </div>
    </Card>
  );
}
