import { Badge, Card } from "@/components/ui";
import { meetsMinRating, starCounts } from "@/lib/hotel";
import { formatMoney } from "@/lib/money";
import type { Hotel } from "@/lib/types";

/**
 * One lodging option (TRIP-14): its name, star rating, nightly and total price,
 * and location. A stay below the search's min-star requirement keeps its place
 * in the list but is flagged, so a constraint the results couldn't fully honour
 * stays visible rather than silently disappearing. Long names and addresses
 * truncate rather than push the price off the card.
 */
export function HotelCard({
  hotel,
  minRating = null,
}: {
  hotel: Hotel;
  minRating?: number | null;
}) {
  const meets = meetsMinRating(hotel, minRating);
  const { filled, empty } = starCounts(hotel.rating);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium text-foreground">
            {hotel.name}
          </span>

          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span
              role="img"
              className="tabular-nums text-foreground"
              aria-label={`${hotel.rating} of 5 stars`}
            >
              <span aria-hidden>
                {"★".repeat(filled)}
                <span className="text-muted-foreground">
                  {"☆".repeat(empty)}
                </span>
              </span>
            </span>
            {!meets && minRating !== null ? (
              <Badge variant="over">Below {minRating}★ minimum</Badge>
            ) : null}
          </span>

          <span className="truncate text-sm text-muted-foreground">
            {hotel.address}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold text-foreground">
            {formatMoney(hotel.nightlyRate)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / night
            </span>
          </span>
          <span className="text-sm text-muted-foreground">
            {formatMoney(hotel.total)} total
          </span>
        </div>
      </div>
    </Card>
  );
}
