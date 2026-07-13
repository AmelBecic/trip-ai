import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { STATUS_LABEL, budgetBarLabel, toBudgetBar } from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import type { BudgetBreakdown, BudgetStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Spent vs budget cap (TRIP-15) as a stacked bar: one segment per cost category,
 * the whole fill carrying the under/near/over status colour so the verdict reads
 * at a glance, with the categories kept apart by opacity rather than a second
 * hue. When spend overflows the cap a marker pins where the cap fell and the
 * overage is flagged in words. The bar is decorative to assistive tech — its
 * `aria-label` carries the full breakdown, and the legend repeats it as text.
 */

// Opacity steps down the stack; cycles if a trip ever carries more than five
// lines. Kept above ~0.3 so the faintest segment still holds contrast.
const SEGMENT_OPACITY = [1, 0.8, 0.62, 0.46, 0.32];

const FILL: Record<BudgetStatus, string> = {
  under: "bg-budget-under",
  near: "bg-budget-near",
  over: "bg-budget-over",
};

export function BudgetBar({ budget }: { budget: BudgetBreakdown }) {
  const bar = toBudgetBar(budget);
  const fill = FILL[budget.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>Budget</CardTitle>
          <Badge variant={budget.status}>{STATUS_LABEL[budget.status]}</Badge>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-semibold text-foreground">
            {formatMoney(budget.total)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatMoney(budget.cap)} budget
          </span>
          {bar.overBy ? (
            <span className="text-sm font-medium text-budget-over">
              {formatMoney(bar.overBy)} over
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div
          role="img"
          aria-label={budgetBarLabel(budget)}
          className="relative flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          {bar.segments.map((seg, i) => (
            <div
              key={seg.category}
              aria-hidden
              className={fill}
              style={{
                width: `${seg.fraction * 100}%`,
                opacity: SEGMENT_OPACITY[i % SEGMENT_OPACITY.length],
              }}
            />
          ))}
          {/* Only meaningful once spend overflows the cap; otherwise it sits at
              the very end of the track and adds nothing. */}
          {bar.overBy ? (
            <div
              aria-hidden
              className="absolute inset-y-0 w-0.5 bg-foreground"
              style={{ left: `${bar.capFraction * 100}%` }}
            />
          ) : null}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {bar.segments.map((seg, i) => (
            <li key={seg.category} className="flex items-center gap-1.5 text-sm">
              <span
                aria-hidden
                className={cn("size-2 shrink-0 rounded-full", fill)}
                style={{ opacity: SEGMENT_OPACITY[i % SEGMENT_OPACITY.length] }}
              />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-medium text-foreground">
                {formatMoney(seg.amount)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
