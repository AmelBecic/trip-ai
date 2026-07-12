import Link from "next/link";

// Root not-found: renders inside the app shell (root layout) and also catches
// any unmatched URL across the app.
export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-12">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold text-foreground">
        This page doesn&apos;t exist.
      </h1>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for may have moved or never existed.
      </p>
      <Link
        href="/"
        className="rounded-md text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Return home
      </Link>
    </section>
  );
}
