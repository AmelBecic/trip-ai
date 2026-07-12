import { cn } from "@/lib/utils";

/*
 * The native <select> keeps keyboard behaviour, the OS option list, and
 * accessibility for free; we only restyle the closed control to match Input.
 * Callers pass <option> children and wire an accessible label the same way.
 */
const BASE =
  "flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-budget-over";

export type SelectProps = React.ComponentProps<"select">;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn(BASE, className)} {...props}>
      {children}
    </select>
  );
}
