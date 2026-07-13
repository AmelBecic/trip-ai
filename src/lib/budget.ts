/**
 * Presentation helpers for `BudgetBreakdown` (see `@/lib/types`) — the geometry
 * and wording the budget bar (TRIP-15) needs but that don't belong on the data
 * shape: how each category segment maps onto the bar, where the cap sits, how
 * far spend runs over it, and the text alternative that describes the bar to
 * assistive tech.
 */

import { formatMoney } from "@/lib/money";
import type {
  BudgetBreakdown,
  BudgetCategory,
  BudgetStatus,
  Money,
} from "@/lib/types";

/** Human labels for each category, in the order the bar stacks its segments. */
export const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  flights: "Flights",
  lodging: "Hotel",
  food: "Food",
  activities: "Activities",
  transit: "Transit",
};

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  under: "Under budget",
  near: "Near budget",
  over: "Over budget",
};

export interface BudgetSegment {
  category: BudgetCategory;
  label: string;
  amount: Money;
  /** Fraction of the bar's full width (0–1) this segment fills. */
  fraction: number;
}

export interface BudgetBar {
  segments: BudgetSegment[];
  /**
   * Where the cap sits along the bar, 0–1. `1` while spend is within the cap;
   * below `1` once spend overflows it, so the overage renders past the marker.
   */
  capFraction: number;
  /** Fraction of the bar left unspent, 0–1; `0` once spend reaches the cap. */
  remainingFraction: number;
  status: BudgetStatus;
  /** How far spend runs over the cap, or `null` when within it. */
  overBy: Money | null;
}

/**
 * Project a breakdown onto a single track. The track's full width represents
 * whichever is larger, total spend or the cap — so an under-budget trip leaves
 * the tail empty, and an over-budget one fills the track with the cap marker
 * pulled back to show the overage beyond it.
 */
export function toBudgetBar(breakdown: BudgetBreakdown): BudgetBar {
  const { cap, total, lines, status } = breakdown;
  // Avoid a divide-by-zero on an empty trip; all amounts are 0, so 0/1 = 0.
  const denom = Math.max(total.amount, cap.amount) || 1;

  const segments: BudgetSegment[] = lines.map((line) => ({
    category: line.category,
    label: CATEGORY_LABEL[line.category],
    amount: line.amount,
    fraction: line.amount.amount / denom,
  }));

  const overAmount = total.amount - cap.amount;

  return {
    segments,
    capFraction: cap.amount / denom,
    remainingFraction: Math.max(0, (cap.amount - total.amount) / denom),
    status,
    overBy:
      overAmount > 0 ? { amount: overAmount, currency: total.currency } : null,
  };
}

/**
 * A one-sentence text alternative for the bar: spend against the cap, the
 * per-category split, and the verdict — an over-budget trip states the overage
 * rather than just the label. Consumed as the bar's `aria-label`.
 */
export function budgetBarLabel(breakdown: BudgetBreakdown): string {
  const { cap, total, lines } = breakdown;
  const bar = toBudgetBar(breakdown);

  const pct = cap.amount === 0 ? null : Math.round((total.amount / cap.amount) * 100);
  const spend =
    `${formatMoney(total)} of ${formatMoney(cap)} budget` +
    (pct === null ? "" : ` (${pct}%)`);

  const split = lines
    .map((line) => `${CATEGORY_LABEL[line.category]} ${formatMoney(line.amount)}`)
    .join(", ");

  const verdict = bar.overBy
    ? `Over budget by ${formatMoney(bar.overBy)}`
    : STATUS_LABEL[breakdown.status];

  return `${spend}. ${split}. ${verdict}.`;
}
