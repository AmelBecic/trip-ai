import { cn } from "@/lib/utils";

const BASE = "mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 lg:px-12";

/**
 * The one horizontal rhythm every page and every shell slot shares: centered,
 * width-capped, and padded so content never touches the viewport edge.
 *
 * `className` composes through cn(), so a caller that passes a conflicting
 * utility (a narrower max-w, a different pad) actually overrides the base.
 */
export function Container({
  className,
  children,
}: Readonly<{
  className?: string;
  children: React.ReactNode;
}>) {
  return <div className={cn(BASE, className)}>{children}</div>;
}
