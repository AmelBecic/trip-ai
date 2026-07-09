# Task Completion Checklist

Run before pushing / opening a PR:

```bash
npm run lint       # defined
npx tsc --noEmit   # `npm run typecheck` is NOT defined — see below
# tests: no runner installed yet
```

## The gate silently passes — don't trust a green hook
`CLAUDE.md` names three quality gates (`lint`, `typecheck`, `test`), but only `lint` exists as a
script. Both enforcement points skip missing scripts instead of failing:

- `.githooks/pre-commit` probes `require('./package.json').scripts?.['typecheck']` and skips if absent.
- `.github/workflows/ci.yml` uses `npm run typecheck --if-present` / `npm run test --if-present`.

So **a passing pre-commit hook and a green CI run currently prove only that lint and gitleaks passed.**
Typecheck manually with `npx tsc --noEmit` until a `typecheck` script is added.

The hook also skips lint/typecheck entirely when `node_modules` is missing, and skips the secret
scan when `gitleaks` is not on `PATH` (warns, does not fail).

## What does hard-block
- **gitleaks** on staged changes — a commit containing a secret is rejected. Remove the secret or
  allowlist it in `.gitleaks.toml`.

## CI-only
- `npm audit --audit-level=high || true` — advisory, never fails the build.
- gitleaks-action runs over full history (`fetch-depth: 0`).
