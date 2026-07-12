import { cn } from "@/lib/utils";

/*
 * Small status pill. The budget variants reuse the exact surface/foreground
 * pairs from the design tokens so a badge always reads correctly against its
 * own background in both schemes.
 */
const VARIANTS = {
  neutral: "bg-surface-muted text-muted-foreground",
  brand: "bg-brand text-brand-foreground",
  under: "bg-budget-under-surface text-budget-under-foreground",
  near: "bg-budget-near-surface text-budget-near-foreground",
  over: "bg-budget-over-surface text-budget-over-foreground",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

const BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export type BadgeProps = Readonly<{
  variant?: BadgeVariant;
}> &
  React.ComponentProps<"span">;

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(BASE, VARIANTS[variant], className)} {...props} />
  );
}
