# Contract Checklist

Load at Step 3 (Contract checklist).

## Purpose

Record externally visible behavior and its contract evidence **before** changing test bodies. Keep actual behavior separate from required behavior when they conflict.

For each mismatch, record `test → active symbol → actual outcome → contract evidence → classification → action`. Use the Step 3 decision tree in `SKILL.md`; uncertainty is not permission to copy actual output into expectations. Example:

| Actual / evidence | Classification | Action |
| --- | --- | --- |
| Returns `{label,id}`; current API and caller use that shape; old test expects a string | Stale test | Update the assertion |
| Missing user returns 200; explicit API contract requires 404 | Implementation defect | Preserve the 404 assertion and report the conflict |
| Implementation and a possibly obsolete comment disagree; no decisive evidence | Uncertain | Leave the disputed assertion unchanged; continue independent repairs |

## Checklist template

For each module or API under scope, list:

```markdown
## <module or endpoint>

- [ ] Happy path: <input> → <output / side effect>
- [ ] Error: <condition> → <code / message / throw>
- [ ] Empty / null / missing input: <behavior>
- [ ] Boundary: <edge case>
- [ ] Idempotency / repeat call (if applicable)
```

## Quality bar

| Good | Bad |
| ---- | --- |
| "POST /login with wrong password returns 401 and `{ error: 'invalid_credentials' }`" | "login should fail correctly" |
| "CLI exits 2 when config file missing" | "handles errors" |
| Omit branch only when intentionally out of scope | Copy implementation line-by-line into checklist |

## Mapping to tests

- Map requested behaviors to existing cases first; record missing coverage explicitly rather than treating the absence of a test as a failure.
- Each checklist item should map to a test case or parameterized row; reuse valid coverage instead of duplicating it.
- If no test will cover an item, note **why** (deprecated, covered elsewhere, out of scope)

## Scope reminder

| User input | Checklist scope |
| ---------- | --------------- |
| Directory specified | Behaviors for modules under that directory only |
| No directory | Smallest scope established by failure output or relevant changes; ask if unresolved |
| Explicit full-suite request | Inspect all relevant suites; repair evidenced stale cases or fill requested coverage gaps |
