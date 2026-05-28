# Implementation Discovery

Load at Step 2 (Discover implementation).

## Search strategy

Combine **semantic search** and **exact search**:

- Module names, exported symbols, route paths, error message strings, config keys
- Imports from test files → follow to implementation
- `grep` for handler names, CLI subcommands, env vars used in tests

## Trace the call chain

1. Open **entry points**: HTTP handlers, CLI main, public package exports, job workers
2. Follow calls inward to core logic (services, domain, pure functions)
3. Stop at boundaries you will assert against (return values, thrown errors, side effects)

## Record per behavior area

| Item | What to capture |
| ---- | --------------- |
| I/O | Parameter types, return shape, status codes |
| Side effects | FS, network, DB, clock, random, env |
| Concurrency | Locks, races, retries |
| Errors | Which branches throw/return errors; message or code if stable |

## Rules

- **Do not** infer behavior from existing tests alone — implementation is authoritative
- Prefer reading the code path tests claim to cover, not only type definitions or comments
- If multiple implementations exist (legacy + new), identify which path production uses

## Output

Short notes or bullet list linking **symbol → observable outcomes** before editing any test file.
