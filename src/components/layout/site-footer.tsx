import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
        {/*
         * Static on purpose. This is a server component in a prerendered
         * layout, so new Date() would be evaluated once at build time and the
         * year would go stale until the next deploy.
         */}
        <p>© 2026 Trip Planner</p>
        <p>Budget-aware trips, planned end to end.</p>
      </Container>
    </footer>
  );
}
