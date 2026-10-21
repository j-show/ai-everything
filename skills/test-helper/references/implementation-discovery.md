# Implementation Discovery

Load at Step 2 (Discover implementation).

## Search strategy

Combine **semantic search** and **exact search**:

- Module names, exported symbols, route paths, error message strings, config keys
- Imports from test files → follow to implementation
- `rg` for handler names, CLI subcommands, env vars used in tests; fall back to available text search

## Trace the call chain

1. Open **entry points**: HTTP handlers, CLI main, public package exports, job workers
2. Follow calls inward to core logic (services, domain, pure functions)
3. Stop at boundaries you will assert against (return values, thrown errors, side effects)

## Record per behavior area

| Item | What to capture |
| ---- | --------------- |
| I/O | Parameter types, return shape, status codes |
| Side effects | FS, network, DB, clock, random, env; test-owned mutations/resources and their existing teardown |
| Concurrency | Locks, races, retries |
| Errors | Distinguish synchronous throw, Promise rejection and caught errors returned as values; message or code if stable |
| Contract evidence | Explicit user requirements, public API guarantees, and callers that support or conflict with actual behavior |

## Rules

- **Do not** infer actual behavior from existing tests alone; source proves execution, not correctness
- Do not dismiss a public contract because implementation disagrees. Record both sources and classify the mismatch in Step 3; comments or old tests alone do not establish intended behavior.
- Prefer reading the code path tests claim to cover, not only type definitions or comments
- If multiple implementations exist (legacy + new), identify which path production uses

## Output

Short notes linking **symbol → observable outcomes → test files** before editing. Resolve test imports and runner configuration rather than assuming tests share the source directory; include the owning package's working directory and setup/build prerequisites.

If requested coverage has no existing test file, mark a proposed test location from project conventions. Continue tracing the implementation; absence of tests is not itself a blocker.
