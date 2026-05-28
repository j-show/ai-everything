# Verification

Load at Step 5 (Verify).

## Pick command scope

| Change scope | Run |
| ------------ | --- |
| Single file | Runner flag for that file (e.g. `vitest path`, `pytest path`) |
| Directory | Directory-scoped command |
| Full suite | `npm test`, `pnpm test`, `pytest`, etc. |

Discover commands from `package.json` `scripts`, `Makefile`, CI config, or README.

## Classify failures

| Symptom | Default action |
| ------- | -------------- |
| Assertion does not match actual implementation behavior | Fix **test** (this skill's default) |
| Implementation clearly violates stated product requirement | **Report to user** before changing production code |
| Flaky (time/network) | Stabilize with project patterns; do not silence without fixing root cause |
| Environment missing (DB, env vars) | Document; do not mark done without explaining |

## Report to user

Include:

1. Command(s) run
2. Pass / fail summary
3. For failures: test name, expected vs actual, and whether you changed tests or recommend changing implementation

## Done criteria

- Scoped tests **pass**, or
- Failures are explained with user decision pending on implementation changes
