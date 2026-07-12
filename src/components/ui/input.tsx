import { cn } from "@/lib/utils";

/*
 * A styled wrapper over the native <input> — every attribute (type, value,
 * onChange, aria-*) passes straight through. The accessible label is the
 * caller's job; pairing a <label htmlFor> with an id keeps that explicit.
 *
 * aria-invalid recolors the border so validation state is visible, not only
 * announced.
 */
const BASE =
  "flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-budget-over";

export type InputProps = React.ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input type={type} className={cn(BASE, className)} {...props} />
  );
}
