import { cn } from "@/lib/utils";

/*
 * Variants are plain class strings rather than a runtime styling library:
 * Tailwind only sees complete literals, and cn() lets a caller override any of
 * them. Hover steps reference the brand ramp per scheme so the token stays the
 * source of truth in both light and dark.
 */
const VARIANTS = {
  primary:
    "bg-brand text-brand-foreground hover:bg-brand-700 dark:hover:bg-brand-300",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

export type ButtonProps = Readonly<{
  variant?: ButtonVariant;
  /** Show a spinner and block interaction without collapsing the label. */
  loading?: boolean;
}> &
  React.ComponentProps<"button">;

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // A loading button is still disabled to the pointer and to assistive tech.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], className)}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
