import { cn } from "@/lib/utils";

/*
 * A single pulsing placeholder block. Compose several to pre-draw a screen's
 * layout while its data loads, so real content swaps in without shifting. Purely
 * decorative: aria-hidden keeps it out of the accessibility tree — the loading
 * announcement belongs on the region that composes these (see ResultsSkeleton's
 * role="status").
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
