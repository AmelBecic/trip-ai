# Task Completion Checklist

Run before pushing / opening a PR:

```bash
npm run lint
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
```

## The gates are real (since TRIP-23)
`CLAUDE.md` names three quality gates (`lint`, `typecheck`, `test`) and all three now exist as
scripts and are enforced. A green pre-commit hook and a green CI run mean the code was checked.

- `.githooks/pre-commit` runs gitleaks on staged changes, then lint, then typecheck. A **missing**
  `lint` or `typecheck` script is now a hard failure, not a skip.
- `.github/workflows/ci.yml` runs them without `--if-present`, so a script that disappears fails
  the build.

The hook still skips lint/typecheck when `node_modules` is missing, and skips the secret scan when
`gitleaks` is not on `PATH` (warns, does not fail). Both are local-dev conveniences; CI has no
such escape hatch.

## What does hard-block
- **gitleaks** on staged changes — a commit containing a secret is rejected. Remove the secret or
  allowlist it in `.gitleaks.toml`.
- **lint**, **typecheck** — locally via the hook, and again in CI.
- **test** — CI only.

## CI-only
- Secret scan is the pinned, sha256-verified gitleaks **CLI** (not `gitleaks-action`), doing a
  full-history `detect` over `fetch-depth: 0`. It fails on a shallow clone, and fails if the scan
  reports 0 commits — a scan that covers nothing must not pass.
- `npm audit --audit-level=high || true` — advisory, never fails the build. Deliberate: a new
  upstream advisory should not redden an unrelated PR.
