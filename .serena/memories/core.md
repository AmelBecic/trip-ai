# Trip Planner — Core

Budget-aware trip planning web app. Next.js App Router, single module (no frontend/backend split yet).
Currently a bare `create-next-app` scaffold + a dev-kit workflow layer. Feature work has not started.

## Source map
- `src/app/` — App Router. Only `layout.tsx` (fonts + metadata) and `page.tsx` (default CNA landing) exist.
- `src/app/globals.css` — Tailwind v4 entrypoint; design tokens live here, not in a JS config.
- `docs/backlog.md` — TRIP-2..TRIP-21 sprint backlog under epic TRIP-1, with acceptance criteria. **Requirements source of truth is the Jira ticket**; the backlog mirrors it.
- `docs/workflow.md` — the branch → PR → review → merge loop.
- `.githooks/pre-commit` — secret/lint/typecheck gate. `.github/workflows/ci.yml` — same gates + `npm audit`.

## Planned structure (per backlog, not yet created)
- `src/lib/types.ts` — domain contracts: `TripSearch`, `Itinerary`, `Flight`, `Hotel`, `BudgetBreakdown`, `Constraint`.
- `src/lib/data/` — the **data seam**: async fns (`searchTrips(input): Promise<Itinerary[]>`) returning typed mock fixtures.
- `src/components/ui/` — typed primitives (Button, Input, Select, Card, Badge).
- Routes: `/`, `/plan`, `/results`, `/saved`, plus not-found.

## Invariants
- **Data seam**: UI never imports fixtures directly — only through `src/lib/data/` functions. Real Amadeus agent backend swaps in behind this seam without touching UI.
- **No `any`** in domain types or component state.
- Money is always `amount + currency`, never a float-as-string.
- No hard-coded hex/px in components — design tokens only (see `mem:conventions`).
- **Never commit directly to `main`.** Feature branch → PR → AI code reviewer → merge.
- No secrets in the repo. Names-only go in `.env.example`; real values in git-ignored `.env`.

## Further reading
- Stack, version pins, and the Next.js 16 / Tailwind v4 traps that break training-data assumptions: `mem:tech_stack`
- Commands to run (and the scripts that *don't* exist despite being documented): `mem:suggested_commands`
- Code style, naming, token/design conventions, branch naming: `mem:conventions`
- What to run before declaring a task done, and the gate that silently passes: `mem:task_completion`
