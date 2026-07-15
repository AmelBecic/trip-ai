"use client";

import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import type { BudgetStatus } from "@/lib/types";
import { useSavedTrips } from "@/lib/use-saved-trips";

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near budget",
  over: "Over budget",
};

/**
 * The saved-trips list on /saved (TRIP-19). Reads the persisted trips through
 * the hook and lets the traveller open or remove each one, with an empty state
 * until they've saved something. On first paint the store reads empty (SSR can't
 * see localStorage), so the list fills in right after hydration.
 */
export function SavedTripsList() {
  const { trips, remove } = useSavedTrips();

  if (trips.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="text-muted-foreground">
          You haven&apos;t saved any trips yet. Open an itinerary and tap{" "}
          <span className="font-medium text-foreground">Save trip</span> to keep it here.
        </p>
        <Link
          href="/plan"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-brand-300"
        >
          Plan a trip
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle>{trip.summary}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {trip.destination} · {trip.days}-day trip
                  </p>
                </div>
                <Badge variant={trip.status}>{STATUS_LABEL[trip.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-3">
              <span className="text-lg font-semibold text-foreground">
                {formatMoney(trip.total)}
              </span>
              <span className="text-sm text-muted-foreground">
                of {formatMoney(trip.cap)} budget
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/itinerary/${trip.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  View
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => remove(trip.id)}
                  aria-label={`Remove ${trip.summary} from saved trips`}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
