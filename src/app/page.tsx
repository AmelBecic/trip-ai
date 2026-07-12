import Link from "next/link";

// Landing skeleton. TRIP-8 builds the real hero; this keeps the route rendering
// within the app shell with a heading and a live path into the planning flow.
export default function Home() {
  return (
    <section className="flex flex-col items-start gap-6 py-12">
      <div className="flex flex-col gap-4">
        <h1 className="max-w-2xl text-4xl font-semibold text-foreground">
          Plan budget-aware trips end to end.
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Search flights and stays, see the full breakdown, and know whether it
          fits your budget before you book.
        </p>
      </div>
      <Link
        href="/plan"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-brand-300"
      >
        Plan a trip
      </Link>
    </section>
  );
}
