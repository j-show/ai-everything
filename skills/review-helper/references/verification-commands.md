# Verification Commands

Load at Step 3 and Step 4.

## Pick one project command

Discover scripts from `package.json`, `Makefile`, CI config, or README. Run the **first script that exists** in this order:

| Priority | Script name (examples) |
| -------- | ---------------------- |
| 1 | `check:all` |
| 2 | `check` |
| 3 | `test:all` |
| 4 | `test` |

Tooling equivalents:

| Ecosystem | Fallback when no `check` |
| --------- | ------------------------ |
| pnpm | `pnpm run check:all` → … → `pnpm test` |
| npm | `npm run check:all` → … → `npm test` |
| Python | `pytest`, `ruff check`, `mypy` per project docs |
| Go | `go test ./...`, `golangci-lint run` |

Success on the first available command ends Loop B. Do not chain multiple top-level scripts unless the project README explicitly requires it.

## Scope the run when possible

| Diff scope | Prefer |
| ---------- | ------ |
| Single package/dir | Package or directory target (`pnpm --filter`, `pytest path/`) |
| Few files | File-scoped test runner flags |
| Wide / `all` | Full `check` or `test` script |

Match verification breadth to review scope when the project supports it.

## Step 3 — run

1. State which command you will run and why it was chosen.
2. Run from repo root (or package root for monorepos).
3. Record exit code and a short pass/fail summary for the user.

If **no** check or test command exists, say so explicitly and end Loop B after documenting the gap — do not claim full verification.

## Step 4 — failure handling

When Step 3 fails:

| Failure type | Action |
| ------------ | ------ |
| Lint/type error from your fix | Fix the code; retry Step 3 |
| Test failed — caused by review fix | Fix implementation or test per project norms; retry Step 3 |
| Test failed — pre-existing / unrelated | Report to user; do not mark Loop B done without acknowledgment |
| Missing env (DB, API keys) | Document; retry only after env is available or user accepts skip |
| Flaky test | Stabilize per project patterns; do not silence without root cause |

Rules:

- **Retry Step 3 only** after fixes — do not skip verification
- Do not use `--no-verify` or skip hooks unless the user explicitly requests
- Do not start Loop A again for verification-only failures unless the fix changes review scope materially

## Done criteria for Loop B

- Chosen verification command **passed**, or
- No command exists and the user accepted the documented gap, or
- User explicitly accepted remaining failures with reason recorded

## Report to user (end of Loop B)

Include:

1. Command(s) run
2. Pass / fail
3. If fail → what was fixed before pass, or what remains and why
