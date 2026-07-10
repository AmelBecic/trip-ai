import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Trip Planner</p>
        <p>Budget-aware trips, planned end to end.</p>
      </Container>
    </footer>
  );
}
