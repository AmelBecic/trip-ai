# Trip Planner — Sprint Backlog

Project key: **TRIP** · Board: https://becicamel98.atlassian.net/jira/software/projects/TRIP/boards/34

Each ticket = one feature branch → PR → ai-code-reviewer → merge.

Acceptance criteria are written so the reviewer can check requirement fulfillment against them.

---

# Sprint 1 — Frontend Foundation & Screens (mock data) ✅

Epic: **[TRIP-1]** · Complete — all 20 tickets (TRIP-2 … TRIP-21) merged.

Frontend-first sprint. All screens are built against **typed mock fixtures** behind a
clean data seam (`src/lib/data/`), so the real Amadeus agent backend can be swapped in
later without touching the UI. Sprint 2 is where that swap is actually attempted — see TRIP-29.

## Foundation

### TRIP-2 · Design tokens & Tailwind theme
**Type:** Task · **Labels:** frontend, foundation
Establish the visual foundation: color palette (brand, surface, budget states — under/at/over),
typography scale, spacing, radius, shadow tokens as Tailwind theme + CSS variables. Support light + dark.
**Acceptance criteria:**
- Tailwind theme exposes brand, neutral, and semantic budget colors (under/near/over cap).
- Typography + spacing scale defined as tokens; no hard-coded hex/px in components later.
- Dark mode works via `prefers-color-scheme` and a `data-theme` override.
- A `/style-guide` (or Storybook-free) reference page renders the token swatches.

### TRIP-3 · App shell & layout
**Type:** Task · **Labels:** frontend, foundation · **Depends on:** TRIP-2
Header (logo, nav), footer, and a responsive max-width container/layout wrapper used by all pages.
**Acceptance criteria:**
- `layout.tsx` renders header + footer around page content.
- Container is centered, max-width capped, responsive padding at sm/md/lg.
- Nav links to Home, Plan, Saved (routes can be stubs).
- Keyboard-focusable nav with visible focus states.

### TRIP-4 · UI primitives (Button, Input, Select, Card, Badge)
**Type:** Task · **Labels:** frontend, foundation · **Depends on:** TRIP-2
Reusable, typed primitives with variants, used by every screen.
**Acceptance criteria:**
- Button (primary/secondary/ghost, loading, disabled), Input, Select, Card, Badge exported from `src/components/ui/`.
- All props typed; variants use design tokens, not ad-hoc styles.
- Components are accessible (labels, aria, focus) and render in light + dark.

### TRIP-5 · Domain types & data contracts
**Type:** Task · **Labels:** frontend, foundation, types
Define the TypeScript contracts the backend must later satisfy.
**Acceptance criteria:**
- Types for `TripSearch`, `Itinerary`, `Flight`, `Hotel`, `BudgetBreakdown`, `Constraint` in `src/lib/types.ts`.
- Money represented consistently (amount + currency), no floats-as-strings ambiguity.
- Types are exported and used by fixtures (TRIP-6) — no `any`.

### TRIP-6 · Mock data layer & fixtures
**Type:** Task · **Labels:** frontend, foundation · **Depends on:** TRIP-5
The data seam: async functions returning typed fixtures, easily swapped for the real agent.
**Acceptance criteria:**
- `src/lib/data/` exposes `searchTrips(input): Promise<Itinerary[]>` (and hotel/flight getters) returning fixtures.
- Fixtures cover: a normal result set, an under-budget set, an over-budget set, and an empty set.
- Artificial latency + a togglable error path so loading/error states are testable.
- No UI imports fixtures directly — only through the data-layer functions.

### TRIP-7 · Routing & page skeletons
**Type:** Task · **Labels:** frontend, foundation · **Depends on:** TRIP-3
App Router structure with placeholder pages so navigation works end to end.
**Acceptance criteria:**
- Routes exist for `/` (landing), `/plan` (search), `/results`, `/saved`.
- Each renders within the app shell with a heading; no dead links.
- 404/not-found page present.

---

## Screens

### TRIP-8 · Landing / hero page
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-4
**Acceptance criteria:**
- Hero with value prop ("plan a trip that fits your budget"), primary CTA → `/plan`.
- Responsive at mobile/desktop; uses primitives + tokens.
- Above-the-fold has no layout shift.

### TRIP-9 · Trip search form
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-4, TRIP-5
The core input: origin, destination, dates, travelers, **budget cap**, cabin class, min hotel stars.
**Acceptance criteria:**
- Fields: origin, destination, start/end date, travelers, budget (amount+currency), cabin class, min stars.
- Submitting builds a typed `TripSearch` and navigates to `/results` with the query.
- Controlled inputs; state typed; no `any`.

### TRIP-10 · Search form validation
**Type:** Task · **Labels:** frontend, screen · **Depends on:** TRIP-9
**Acceptance criteria:**
- Required fields enforced; end date ≥ start date; budget > 0; travelers ≥ 1.
- Inline, accessible error messages (aria-describedby); submit blocked while invalid.
- Validation logic unit-testable and separated from the component.

### TRIP-11 · Loading & skeleton states
**Type:** Task · **Labels:** frontend, screen · **Depends on:** TRIP-6
**Acceptance criteria:**
- Results route shows skeletons while `searchTrips` is pending (uses the fixture latency).
- Skeletons match final layout to minimize shift; no spinner-only screens.

### TRIP-12 · Results / itinerary overview
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-6, TRIP-4
**Acceptance criteria:**
- Reads the `TripSearch` from the query and calls the data layer.
- Renders a list of itinerary options with total cost vs budget and a select action.
- Handles under/at/over-budget visual states from TRIP-2 tokens.

### TRIP-13 · Flight card & list
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-5, TRIP-4
**Acceptance criteria:**
- Flight card shows carrier, times, duration, stops, cabin, price.
- List renders from typed `Flight[]`; empty list handled.
- Overflow/long strings truncate gracefully.

### TRIP-14 · Hotel card & list
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-5, TRIP-4
**Acceptance criteria:**
- Hotel card shows name, star rating, nightly + total price, location.
- List renders from typed `Hotel[]`; min-star constraint reflected visually.

### TRIP-15 · Budget breakdown bar
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-5, TRIP-2
**Acceptance criteria:**
- Shows spent vs budget cap as a bar with flights/hotel/other segments.
- Under/near/over-cap colors from tokens; over-cap clearly flagged.
- Amounts formatted with currency; accessible text alternative for the bar.

### TRIP-16 · Day-by-day itinerary timeline
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-5, TRIP-4
**Acceptance criteria:**
- Vertical timeline of days with flight/hotel/activity items in order.
- Renders from a typed itinerary; handles single-day and multi-day.

### TRIP-17 · Filters / constraints sidebar
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-12
**Acceptance criteria:**
- Sidebar to adjust budget cap, cabin class, min stars, max stops.
- Changing a filter re-queries the data layer and updates results.
- Collapses to a drawer on mobile.

### TRIP-18 · Empty & error states
**Type:** Task · **Labels:** frontend, screen · **Depends on:** TRIP-6, TRIP-12
**Acceptance criteria:**
- Empty-result state with guidance (loosen budget/dates) + CTA back to search.
- Error state (uses fixture error path) with retry; no unhandled rejections.

---

## Polish

### TRIP-19 · Saved trips / history
**Type:** Story · **Labels:** frontend, screen · **Depends on:** TRIP-12
**Acceptance criteria:**
- Save an itinerary (localStorage for now) and list it on `/saved`.
- Remove a saved trip; empty state when none.
- Persistence layer isolated so it can move to a backend later.

### TRIP-20 · Responsive & mobile polish
**Type:** Task · **Labels:** frontend, polish
**Acceptance criteria:**
- All screens usable at 360px width; no horizontal body scroll.
- Search form, results, and sidebar adapt to mobile (drawer/stacked).

### TRIP-21 · Accessibility & dark-mode pass
**Type:** Task · **Labels:** frontend, polish
**Acceptance criteria:**
- Keyboard-navigable across all screens; visible focus; landmarks/headings correct.
- Color contrast meets AA in light + dark for text and budget states.
- Images have alt text; form controls have associated labels.

---

# Sprint 2 — Budget-constrained planning agent (real data + evals)

Epic: **[TRIP-26]** · In progress.

Sprint 1 shipped every screen against fixtures. This sprint builds the thing the app was
scoped to be: a **budget-constrained planning agent** over real price data, with an eval
harness measuring whether its plans are any good.

**Why this sprint exists.** After sprint 1 the app had no AI in it — the dependency list was
`next`, `react`, `clsx`, `tailwind-merge`. The screens demonstrate frontend delivery; the agent
layer, the real data, and the evals are what the project is actually for.

**Decisions taken up front:**
- **TypeScript, in this repo.** Agent in `src/lib/agent/` + Next route handlers. One repo, one
  deploy, one live URL; reuses the TRIP-5 domain types end to end. A separate Python service was
  considered and rejected — two deploys and duplicated types, slower to something clickable.
- **Anthropic API key.** The AI code reviewer drives the `claude` CLI on a subscription with no
  API key, but that path does not work in a deployed app (same reason it does not work in CI).
  Deploying means an API key, which costs real money per request — so rate limiting and prompt
  caching are tickets here, not follow-ups.
- **Thin vertical slice.** Real data → agent → optimizer → evals → live. Fewer tickets, but the
  whole story works end to end.

**Model:** `claude-opus-4-8` with adaptive thinking (`thinking: {type: "adaptive"}` — off unless
set explicitly). `temperature`, `top_p`, `top_k`, and `budget_tokens` are all rejected with a 400
on this model; steer with prompting and `output_config.effort`.

**Done when:** a live URL produces a real budget-constrained plan from real Amadeus prices, and
`npm run eval` reports measurable quality numbers.

## Real data

### TRIP-27 · Amadeus API client & auth (test tier)
**Type:** Task · **Labels:** backend, agent, foundation
The real price data source: Amadeus Self-Service API, free test tier. A thin transport layer —
auth, HTTP, retries, typed responses. No domain mapping (that is TRIP-28), no business logic.

**Verify early:** the free test environment serves sandbox data with limited coverage, not full
live inventory. Confirm what the endpoints return for our target routes *before* building on
them — if coverage is too thin to demo, say so rather than discovering it in TRIP-33.

**Acceptance criteria:**
- `src/lib/amadeus/client.ts` exposes an OAuth2 `client_credentials` token fetch plus
  `searchFlightOffers` and `searchHotelOffers`.
- Access token cached in memory and reused until shortly before expiry; a 401 triggers exactly
  one refresh-and-retry.
- A 429 retries with capped exponential backoff, then surfaces a typed error rather than a raw
  fetch failure.
- All responses typed — no `any`. Unknown fields tolerated, not fatal.
- `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` read from env and documented in `.env.example`.
  No real values in the repo; `npm run secrets` passes.
- Unit tests mock the HTTP layer. `npm run test` makes zero network calls and needs no
  credentials — CI has none.

### TRIP-28 · Map Amadeus responses to domain types
**Type:** Task · **Labels:** backend, agent, types · **Depends on:** TRIP-27, TRIP-5
The anti-corruption layer. Nothing downstream should ever see an Amadeus-shaped object — that
is what keeps the provider swappable.

`Money` is the trap: Amadeus returns prices as strings with a separate currency, while TRIP-5
defined Money as amount + currency precisely to kill that ambiguity. `src/lib/data/index.ts`
already throws on mixed-currency sums.

**Acceptance criteria:**
- `src/lib/amadeus/map.ts` maps offers to `Flight[]` / `Hotel[]` exactly as defined in
  `src/lib/types.ts`.
- Money carries the currency from the offer; no float parsed from a string without its currency,
  no cross-currency arithmetic introduced.
- Stops derive correctly (segments − 1, matching the TRIP-17 `max-stops` constraint); cabin maps
  onto `CabinClass`, and an unmapped cabin is an explicit error, not a silent `economy`.
- Missing or partial optional fields degrade gracefully and never throw.
- Unit tested against recorded Amadeus fixtures checked into the repo — no credentials, no network.

### TRIP-29 · Data seam: mock | live provider switch
**Type:** Task · **Labels:** backend, agent, foundation · **Depends on:** TRIP-28, TRIP-6
Where TRIP-6's bet pays off. The seam was built so the real backend could be swapped in without
touching the UI; this ticket swaps it in.

**Acceptance criteria:**
- `src/lib/data/index.ts` selects the provider from `TRIP_DATA_PROVIDER=mock|live`, defaulting to
  `mock` so tests and local dev need no credentials.
- Exported signatures (`searchTrips`, `getItinerary`, `getFlights`, `getHotels`) unchanged.
- **Zero changes to any file under `src/app/` or `src/components/`.** If a UI change proves
  unavoidable, stop and document why — that is a finding about the seam, not a task to work around.
- Live-provider failures surface as the existing `DataError`, so the TRIP-18 error state and retry
  still render unchanged.
- Existing `src/lib/data/data.test.ts` passes untouched against the mock provider.
- With `live`, a real search returns itineraries built from Amadeus data, priced against the
  caller's budget cap.

## Agent

### TRIP-30 · Planning agent — Claude tool-use loop
**Type:** Story · **Labels:** backend, agent, llm · **Depends on:** TRIP-29
The core AI ticket. The agent calls flight and hotel tools, reasons about the constraints, and
returns a structured, cited itinerary. It orchestrates and explains; the optimizer (TRIP-31) does
the arithmetic — never ask the LLM to add up prices.

**Acceptance criteria:**
- `src/lib/agent/tools.ts` defines `searchFlights` and `searchHotels` via the SDK tool runner,
  backed by the **data layer** — the agent must not import Amadeus or fixtures directly.
- Model is `claude-opus-4-8`, with `thinking: {type: "adaptive"}` set explicitly and
  `output_config.effort` chosen and justified.
- No `temperature`, `top_p`, `top_k`, or `budget_tokens` anywhere in the request path.
- Returns a **structured** itinerary validated against a schema via `output_config.format` — not
  free-form text that gets parsed.
- Every priced element is **cited** back to the offer it came from, so a number in the UI can be
  traced to a source.
- Prompt caching on the stable system prompt and tool definitions; `usage.cache_read_input_tokens`
  is non-zero on a repeat run.
- `ANTHROPIC_API_KEY` read from env, documented in `.env.example`, absent from the repo.
- Agent logic unit tested with the LLM call mocked; `npm run test` makes no live API calls.

### TRIP-31 · Budget optimizer & constraint satisfaction
**Type:** Story · **Labels:** backend, agent · **Depends on:** TRIP-30
The "budget-constrained" half of the pitch. **Contains no LLM call** — the optimizer is pure,
testable arithmetic, and TRIP-33 can only measure near-optimality against a known-best if the
selection is deterministic.

Constraint semantics already exist in `src/lib/data/index.ts` and must not drift: cabin is a
comfort **floor**, `min-hotel-rating` and `max-stops` are hard constraints, and budget deliberately
does **not** filter — an over-budget option stays visible and is re-priced, not removed.

**Acceptance criteria:**
- Given candidates and a `TripSearch`, returns feasible combinations ranked by total cost,
  honouring budget cap, cabin floor, min hotel rating, and max stops.
- "Near-optimal" is **defined numerically** (within N% of the cheapest feasible combination) and
  asserted in tests — TRIP-33 scores against it.
- Over budget: returns the closest feasible options flagged over-cap rather than an empty set.
- No feasible combination: returns an explicit reason naming **which constraint bound**,
  consumable by the TRIP-18 empty state.
- Pure and deterministic — same inputs, same output, no network, no LLM.
- Unit tested, including the over-budget and no-feasible-solution paths.

### TRIP-32 · /api/plan route handler
**Type:** Story · **Labels:** backend, agent, api · **Depends on:** TRIP-30, TRIP-31
Exposes the agent to the app, and is the cost boundary — every request past here spends real
money, so the guardrails are part of the ticket.

**Acceptance criteria:**
- `src/app/api/plan/route.ts` accepts a POST of a `TripSearch` and returns the structured
  itinerary plus its citations.
- Input validated **reusing the TRIP-10 validation logic** (deliberately separated from the
  component for exactly this); invalid input returns 400 with field-level errors and never
  reaches the LLM.
- Progress is streamed rather than blocking on a single opaque response — agent runs take many
  seconds, long enough that a plain request/response reads as broken.
- **Rate limited** per client; a looping caller cannot run up the API bill unbounded.
- `ANTHROPIC_API_KEY` stays server-side — never in a client bundle or a response body. Verified,
  not assumed.
- Failures return typed JSON mapping onto the existing TRIP-18 error state; no unhandled rejections.
- Client disconnect / timeout cancels in-flight work instead of orphaning a paid request.

## Evals & ship

### TRIP-33 · Eval harness — plan validity & near-optimality
**Type:** Story · **Labels:** backend, agent, evals · **Depends on:** TRIP-31, TRIP-32
The differentiator. Turns "I built a trip planner" into "I measured whether the planner is any
good, and here are the numbers." The metric definitions are as much the deliverable as the code —
a number nobody can interpret is worth nothing.

**Acceptance criteria:**
- `evals/` holds labeled cases covering at minimum: a normal result set, comfortably under budget,
  over budget, no results, and mutually conflicting constraints (e.g. business cabin under a cap
  that cannot fit it).
- Scores at least three dimensions:
  1. **Valid** — output matches the schema and every returned plan satisfies the stated constraints.
  2. **Near-optimal** — total cost within the threshold TRIP-31 defines, against the known-best
     combination for that fixture.
  3. **Graceful degradation** — no-results and over-budget cases produce the correct explicit
     outcome rather than an empty set, a crash, or a hallucinated itinerary.
- `npm run eval` prints per-case results and an aggregate, and exits non-zero on regression.
- Runs against **recorded fixtures**, not live Amadeus — reproducible, free, stable.
- Cases and expected outcomes checked into the repo.
- A seed run's numbers and each metric's definition are written up in the README. State honestly
  what is measured and what is not.

### TRIP-34 · Deploy to a live URL + rewrite README
**Type:** Task · **Labels:** backend, docs, deploy · **Depends on:** TRIP-27 … TRIP-33
Makes the work verifiable by someone who will not clone the repo.

`README.md` is currently stock `create-next-app` boilerplate, and this is a public repo — that is
the first thing any visitor sees today.

**Acceptance criteria:**
- Deployed to a public URL, with `TRIP_DATA_PROVIDER=live`, `ANTHROPIC_API_KEY`, and the Amadeus
  credentials set as deployment env vars — never committed.
- From a cold visit, a real budget-constrained plan can be produced with no local setup.
- README rewritten: what this is, the architecture (data seam → agent → deterministic optimizer →
  evals), how to run it locally, and the TRIP-33 eval numbers with their metric definitions.
- README explains the **cost guardrails** (rate limiting, prompt caching) and why the deployed app
  uses an API key rather than the subscription CLI path — that tradeoff is the interesting decision.
- No secrets in the repo; `.env.example` documents every required key with no real values.
- No machine-local paths, and no link to any private repo (the TRIP-24 rule).
