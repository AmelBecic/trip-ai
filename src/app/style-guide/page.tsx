import type { Metadata } from "next";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Style guide",
  description: "Design tokens for the trip planner UI.",
};

/*
 * Tailwind scans for complete class strings, so every swatch names its utility
 * literally rather than composing it from a token name.
 */
const BRAND_RAMP = [
  ["brand-50", "bg-brand-50"],
  ["brand-100", "bg-brand-100"],
  ["brand-200", "bg-brand-200"],
  ["brand-300", "bg-brand-300"],
  ["brand-400", "bg-brand-400"],
  ["brand-500", "bg-brand-500"],
  ["brand-600", "bg-brand-600"],
  ["brand-700", "bg-brand-700"],
  ["brand-800", "bg-brand-800"],
  ["brand-900", "bg-brand-900"],
  ["brand-950", "bg-brand-950"],
] as const;

const NEUTRAL_RAMP = [
  ["neutral-50", "bg-neutral-50"],
  ["neutral-100", "bg-neutral-100"],
  ["neutral-200", "bg-neutral-200"],
  ["neutral-300", "bg-neutral-300"],
  ["neutral-400", "bg-neutral-400"],
  ["neutral-500", "bg-neutral-500"],
  ["neutral-600", "bg-neutral-600"],
  ["neutral-700", "bg-neutral-700"],
  ["neutral-800", "bg-neutral-800"],
  ["neutral-900", "bg-neutral-900"],
  ["neutral-950", "bg-neutral-950"],
] as const;

const SURFACES = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface-muted", "bg-surface-muted"],
  ["surface-raised", "bg-surface-raised"],
  ["border", "bg-border"],
  ["border-strong", "bg-border-strong"],
  ["brand", "bg-brand"],
  ["ring", "bg-ring"],
] as const;

const BUDGET_STATES = [
  {
    label: "Under cap",
    token: "budget-under",
    fill: "bg-budget-under",
    badge: "bg-budget-under-surface text-budget-under-foreground",
  },
  {
    label: "Near cap",
    token: "budget-near",
    fill: "bg-budget-near",
    badge: "bg-budget-near-surface text-budget-near-foreground",
  },
  {
    label: "Over cap",
    token: "budget-over",
    fill: "bg-budget-over",
    badge: "bg-budget-over-surface text-budget-over-foreground",
  },
] as const;

const TYPE_SCALE = [
  ["text-4xl", "text-4xl"],
  ["text-3xl", "text-3xl"],
  ["text-2xl", "text-2xl"],
  ["text-xl", "text-xl"],
  ["text-lg", "text-lg"],
  ["text-base", "text-base"],
  ["text-sm", "text-sm"],
  ["text-xs", "text-xs"],
] as const;

const SPACING_STEPS = [
  ["1", "w-1"],
  ["2", "w-2"],
  ["4", "w-4"],
  ["6", "w-6"],
  ["8", "w-8"],
  ["12", "w-12"],
  ["16", "w-16"],
] as const;

const RADII = [
  ["rounded-sm", "rounded-sm"],
  ["rounded-md", "rounded-md"],
  ["rounded-lg", "rounded-lg"],
  ["rounded-xl", "rounded-xl"],
  ["rounded-2xl", "rounded-2xl"],
  ["rounded-full", "rounded-full"],
] as const;

const SHADOWS = [
  ["shadow-card", "shadow-card"],
  ["shadow-raised", "shadow-raised"],
  ["shadow-overlay", "shadow-overlay"],
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-16 rounded-md border border-border ${className}`}
        aria-hidden
      />
      <code className="font-mono text-xs text-muted-foreground">{name}</code>
    </div>
  );
}

export default function StyleGuide() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Style guide
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Every token below flips with the color scheme. Use the utilities,
            never a literal hex or px value.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section
        title="Brand"
        description="Fixed ramp. Semantic tokens pick the step that reads correctly in each scheme."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-11">
          {BRAND_RAMP.map(([name, className]) => (
            <Swatch key={name} name={name} className={className} />
          ))}
        </div>
      </Section>

      <Section
        title="Neutral"
        description="Greys used for surfaces, borders, and body text."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-11">
          {NEUTRAL_RAMP.map(([name, className]) => (
            <Swatch key={name} name={name} className={className} />
          ))}
        </div>
      </Section>

      <Section
        title="Semantic surfaces"
        description="These invert between light and dark; reach for them instead of the raw ramps."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SURFACES.map(([name, className]) => (
            <Swatch key={name} name={name} className={className} />
          ))}
        </div>
      </Section>

      <Section
        title="Budget states"
        description="Spend against the trip cap: comfortably under, approaching, or past it."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {BUDGET_STATES.map(({ label, token, fill, badge }) => (
            <div
              key={token}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
                >
                  {label}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className={`h-full w-2/3 ${fill}`} aria-hidden />
              </div>
              <code className="font-mono text-xs text-muted-foreground">
                {token}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Typography"
        description="Each step carries its own line height; the display sizes also tighten tracking."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
          {TYPE_SCALE.map(([name, className]) => (
            <div
              key={name}
              className="flex flex-wrap items-baseline justify-between gap-4"
            >
              <span className={`text-foreground ${className}`}>
                Kyoto in seven days
              </span>
              <code className="font-mono text-xs text-muted-foreground">
                {name}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Spacing"
        description="A 0.25rem base step. Multiples drive padding, gaps, and sizing."
      >
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6">
          {SPACING_STEPS.map(([name, className]) => (
            <div key={name} className="flex items-center gap-3">
              <code className="w-8 font-mono text-xs text-muted-foreground">
                {name}
              </code>
              <div className={`h-3 rounded-sm bg-brand ${className}`} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Radius"
        description="Corner rounding, from input fields up to modal surfaces."
      >
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {RADII.map(([name, className]) => (
            <div key={name} className="flex flex-col gap-2">
              <div
                className={`h-16 border border-border-strong bg-surface-muted ${className}`}
                aria-hidden
              />
              <code className="font-mono text-xs text-muted-foreground">
                {name}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Elevation"
        description="Ambient occlusion in light, depth in dark. The shadow color is itself a token."
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {SHADOWS.map(([name, className]) => (
            <div key={name} className="flex flex-col gap-2">
              <div
                className={`h-24 rounded-lg bg-surface-raised ${className}`}
                aria-hidden
              />
              <code className="font-mono text-xs text-muted-foreground">
                {name}
              </code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
