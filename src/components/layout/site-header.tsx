import Link from "next/link";
import { Container } from "./container";
import { NavLink } from "./nav-link";

const NAV_ITEMS = [
  ["/", "Home"],
  ["/plan", "Plan"],
  ["/saved", "Saved"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-lg font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="size-7 rounded-lg bg-brand"
          />
          Trip Planner
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(([href, label]) => (
              <li key={href}>
                <NavLink href={href}>{label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
