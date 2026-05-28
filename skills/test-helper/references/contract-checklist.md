# Contract Checklist

Load at Step 3 (Contract checklist).

## Purpose

Produce a **current contract** — externally visible behaviors the rewritten tests must align with. Write this **before** changing test bodies.

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

- Each checklist item should map to **one** test case (or one parameterized row)
- If no test will cover an item, note **why** (deprecated, covered elsewhere, out of scope)

## Scope reminder

| User input | Checklist scope |
| ---------- | --------------- |
| Directory specified | Behaviors for modules under that directory only |
| No directory | All relevant suites in the project |
