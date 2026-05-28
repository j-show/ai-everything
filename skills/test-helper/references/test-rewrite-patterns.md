# Test Rewrite Patterns

Load at Step 4 (Rewrite tests).

## Replace over patch

When tests clearly disagree with implementation, **rewrite the whole case** (or file structure) instead of fixing assertions one-by-one.

## Minimum effective coverage

- Prioritize **behavior and boundaries** (errors, empty input, limits)
- Remove tests that only duplicate implementation literals without adding signal
- Remove or replace cases for **deleted APIs** — add equivalent scenarios for new APIs

## One case, one behavior

- Each test validates **one** behavior or **one** error path
- Name tests after the behavior: `returns 401 when password invalid`, not `test login`

## Layout

- Mirror project convention: test dir next to `src/`, `__tests__` colocated, etc.
- Keep file names aligned with module under test

## Isolate instability

Use patterns already in the repo:

| Concern | Prefer |
| ------- | ------ |
| Time | Fake timers, injectable clock |
| Network | MSW, nock, httptest, recorded fixtures |
| FS | Temp dirs, in-memory FS, injectable adapter |
| Random | Seeded RNG or injectable generator |

Do not introduce a new mocking stack unless the project has none.

## Anti-coupling

- Avoid asserting private helpers or internal call order unless that **is** the public contract
- Do not copy implementation logic into expected values (brittle) unless testing a literal protocol (checksum format, exact error string)

## Mock depth

| Too shallow | Too deep |
| ----------- | -------- |
| Everything mocked — integration never runs | Every dependency mocked — refactor breaks tests unrelated to behavior |
| Match project norm: unit vs shallow integration | Ask user if unsure |
