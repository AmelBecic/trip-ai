# Trip Planner — Frontend Sprint Backlog

Project key: **TRIP** · Epic: **[TRIP-1] Frontend Foundation & Screens (mock data)**

Board: https://becicamel98.atlassian.net/jira/software/projects/TRIP/boards/34

Frontend-first sprint. All screens are built against **typed mock fixtures** behind a
clean data seam (`src/lib/data/`), so the real Amadeus agent backend can be swapped in
later without touching the UI. Each ticket = one feature branch → PR → ai-code-reviewer → merge.

Acceptance criteria are written so the reviewer can check requirement fulfillment against them.

---

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
