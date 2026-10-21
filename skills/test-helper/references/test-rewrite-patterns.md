# Test Rewrite Patterns

Load at Step 4 (Rewrite tests).

## Match the requested work

Apply the Step 3 classification before replacing existing expectations. Preserve valid regression cases and user edits; a mismatch alone does not justify replacing a case or file.

| Request / evidence | Action |
| --- | --- |
| Repair outdated tests | Update evidenced stale cases; do not add unrelated coverage |
| Add tests or specified coverage; behavior is established | Map requested behaviors to existing cases and add only missing cases, even if all existing tests pass |
| No existing test for the requested module | Use the nearest applicable project convention, existing runner and setup; do not introduce a framework automatically |
| Required expectation or runner cannot be established | Report that gap and complete independent cases; do not invent a contract or claim coverage complete |

Repeating a completed request should produce no gratuitous edits. Do not rewrite correct cases just to satisfy a template.

## Minimum effective coverage

- Prioritize **behavior and boundaries** (errors, empty input, limits)
- Remove tests that only duplicate implementation literals without adding signal
- Remove or replace cases for **deleted APIs** — add equivalent scenarios for new APIs
- Never remove or skip a valid failure caused by an implementation defect or unresolved contract conflict.

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

Use installed tools and existing patterns. Missing tooling does not authorize new dependencies or connections to real services; report the blocker and run independent local tests.

When a test changes shared state or creates resources, use the project's per-test teardown or `try/finally`. Register cleanup before actions/assertions that can fail; await asynchronous cleanup. Restore the prior state, not an assumed default:

| Test-owned change | Cleanup |
| --- | --- |
| Mock, fake timer, patched method | Restore the original through the existing scoped fixture/mock handle |
| Environment variable or global value | Preserve whether it existed and its exact value; absent and empty are different |
| Temporary directory, file or open handle | Close handles and remove only resources created by this test; preserve pre-existing fixtures |

Do not hide pollution by deleting later assertions, relying on execution order, or broadly resetting resources owned by other tests. If shared mutation cannot be isolated for concurrent cases, use the project's isolation pattern rather than adding another global override.

Assert at the public error boundary: `assert.throws(() => call())` for synchronous throws, `await assert.rejects(call())` for Promise rejection, and a value assertion for caught errors returned as values. These are Node examples; use the existing runner's equivalents.

## Anti-coupling

- Avoid asserting private helpers or internal call order unless that **is** the public contract
- Do not compute expected values with the same implementation logic. Protocol literals and independently derived examples are valid expectations.

## Mock boundaries

Keep the public entry and behavior under test real. Isolate external effects at existing dependency boundaries; do not mock the tested function into returning its own expected value.
