import { formatDayDate } from "@/lib/itinerary";
import type { TimelineDay, TimelineEventKind } from "@/lib/itinerary";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The day-by-day plan (TRIP-16): a vertical timeline with one node per calendar
 * day the trip touches, each listing its flight legs, hotel check-in/out, and
 * activities in the order they happen. An ordered list carries the day sequence
 * to assistive tech; the rail (dot and connector) is decorative. Single-day and
 * multi-day trips share the path — the connector just doesn't draw under the
 * last day — and a trip with nothing to show falls back to a plain note.
 */

// Logistics events get a leading glyph; activities read as plain rows.
const KIND_ICON: Partial<Record<TimelineEventKind, string>> = {
  flight: "✈",
  hotel: "🛏",
};
const KIND_LABEL: Partial<Record<TimelineEventKind, string>> = {
  flight: "Flight",
  hotel: "Hotel",
};

export function Timeline({ days }: { days: TimelineDay[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="timeline-heading">
      <h2
        id="timeline-heading"
        className="text-lg font-semibold text-foreground"
      >
        Day by day
      </h2>

      {days.length > 0 ? (
        <ol className="flex flex-col">
          {days.map((day, i) => {
            const last = i === days.length - 1;
            const dateLabel = formatDayDate(day.date);
            return (
              <li key={day.date} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className="mt-0.5 size-3.5 shrink-0 rounded-full border-2 border-brand bg-surface"
                  />
                  {!last ? (
                    <span aria-hidden className="w-px flex-1 bg-border" />
                  ) : null}
                </div>

                <div
                  className={cn(
                    // min-w-0 lets the column shrink below its content so long
                    // event strings wrap instead of forcing horizontal scroll.
                    "flex min-w-0 flex-1 flex-col gap-2 break-words",
                    !last && "pb-6",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Day {i + 1}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                    </span>
                    {day.title ? (
                      <h3 className="font-medium text-foreground">
                        {day.title}
                      </h3>
                    ) : null}
                  </div>

                  {day.events.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {day.events.map((event) => (
                        <li
                          key={event.id}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                        >
                          {KIND_ICON[event.kind] ? (
                            <span
                              role="img"
                              aria-label={KIND_LABEL[event.kind]}
                              className="text-muted-foreground"
                            >
                              {KIND_ICON[event.kind]}
                            </span>
                          ) : null}
                          {event.time ? (
                            <span className="tabular-nums text-muted-foreground">
                              {event.time}
                            </span>
                          ) : null}
                          <span className="font-medium text-foreground">
                            {event.title}
                          </span>
                          {event.detail ? (
                            <span className="text-muted-foreground">
                              {event.detail}
                            </span>
                          ) : null}
                          {event.cost ? (
                            <span className="text-muted-foreground">
                              {formatMoney(event.cost)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No plans for this day yet.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          This itinerary doesn&apos;t include a day-by-day plan yet.
        </p>
      )}
    </section>
  );
}
