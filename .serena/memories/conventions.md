# Conventions

## Code
- TypeScript, ESM, small focused modules. Prefer clarity over cleverness.
- `strict: true`; **no `any`** in domain types, fixtures, or component state.
- Import via the `@/*` alias for anything under `src/`.
- Match surrounding code style; keep comment density consistent with neighbours.
- Components: props fully typed; variants expressed through design tokens, never ad-hoc styles.

## Styling
- Design tokens only — **no hard-coded hex or px in components**. Tokens are defined in the
  `@theme inline` block of `src/app/globals.css` (Tailwind v4 is CSS-first; see `mem:tech_stack`).
- Semantic budget colors are a first-class token family: under / near / over cap.
- Every screen ships light + dark and must be keyboard-navigable with visible focus
  (landmarks, headings, `aria-describedby` on field errors, labels on all controls, AA contrast).

## Architecture
- Validation logic lives outside components so it stays unit-testable (TRIP-10).
- Persistence (saved trips) sits behind its own isolated layer so localStorage can become a
  backend later (TRIP-19) — same reasoning as the `src/lib/data/` seam.

## Branches, commits, PRs
- Branch names: `feat/TICKET-desc`, `fix/TICKET-desc`, `chore/desc`. Ticket key = `TRIP-<n>`.
- PR title includes the ticket key. One ticket = one branch = one PR.
- Run the AI code reviewer on the PR before merge;
  it checks code quality *and* requirement fulfillment against the ticket's acceptance criteria —
  which is why `docs/backlog.md` writes ACs as checkable assertions.
- Never `git commit --no-verify` without a stated reason.
