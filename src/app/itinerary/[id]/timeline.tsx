import { activityTime, formatDayDate, orderedDays } from "@/lib/itinerary";
import { formatMoney } from "@/lib/money";
import type { ItineraryDay } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The day-by-day plan (TRIP-16): a vertical timeline with one node per day, in
 * calendar order, each listing its activities in the order they happen. An
 * ordered list carries the day sequence to assistive tech; the rail (dot and
 * connector) is decorative. Single-day and multi-day trips share the path — the
 * connector simply doesn't draw under the last day — and a trip with no plan
 * shows a plain note instead of an empty rail.
 */
export function Timeline({ days }: { days: ItineraryDay[] }) {
  const ordered = orderedDays(days);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="timeline-heading">
      <h2
        id="timeline-heading"
        className="text-lg font-semibold text-foreground"
      >
        Day by day
      </h2>

      {ordered.length > 0 ? (
        <ol className="flex flex-col">
          {ordered.map((day, i) => {
            const last = i === ordered.length - 1;
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
                    "flex flex-1 flex-col gap-2",
                    !last && "pb-6",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Day {i + 1} · {formatDayDate(day.date)}
                    </span>
                    <h3 className="font-medium text-foreground">{day.title}</h3>
                  </div>

                  {day.activities.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {day.activities.map((activity) => {
                        const time = activityTime(activity);
                        return (
                          <li
                            key={activity.id}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                          >
                            {time ? (
                              <span className="tabular-nums text-muted-foreground">
                                {time}
                              </span>
                            ) : null}
                            <span className="font-medium text-foreground">
                              {activity.name}
                            </span>
                            {activity.location ? (
                              <span className="text-muted-foreground">
                                {activity.location}
                              </span>
                            ) : null}
                            {activity.cost ? (
                              <span className="text-muted-foreground">
                                {formatMoney(activity.cost)}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No activities planned.
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
