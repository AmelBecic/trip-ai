"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A nav item that knows whether it is the current page.
 *
 * "/" only matches exactly — every path is prefixed by it, so a prefix test
 * would light up Home on every route.
 */
export function NavLink({
  href,
  children,
}: Readonly<{
  href: string;
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:text-foreground"
    >
      {children}
    </Link>
  );
}
