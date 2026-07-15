import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";

// Landing / hero (TRIP-8). Text-only above the fold so the primary content
// paints without layout shift; the CTA routes into the planning flow.
export default function Home() {
  return (
    <div className="flex flex-col gap-12 py-4 sm:py-8">
      <section className="flex flex-col items-start gap-6">
        <Badge variant="brand">Budget-aware trip planning</Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Plan a trip that fits your budget.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Search flights and stays, see the full cost broken down, and know at a
          glance whether the trip lands under, near, or over your budget — before
          you book.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/plan"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto dark:hover:bg-brand-300"
          >
            Plan a trip
          </Link>
          <Link
            href="/saved"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            View saved trips
          </Link>
        </div>
      </section>

      <section
        aria-label="How it works"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardHeader>
            <CardTitle>Flights &amp; stays</CardTitle>
            <CardDescription>
              Curated flight and hotel options for your dates and destination,
              ready to compare.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Full cost breakdown</CardTitle>
            <CardDescription>
              Flights, lodging, and extras added up in one place, so nothing on
              the bill is a surprise.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget verdict</CardTitle>
            <CardDescription>
              Every plan is graded against your target at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="under">Under</Badge>
            <Badge variant="near">Near</Badge>
            <Badge variant="over">Over</Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
