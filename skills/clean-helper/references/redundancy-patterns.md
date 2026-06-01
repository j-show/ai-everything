# Redundancy Patterns

Load at Step 2.

## Duplicate logic

Ask:

- Do two functions implement the same contract with different names?
- Is one wrapper only forwarding with no added policy?

**Fix:** Extract shared helper or keep the higher-level API and delete the thin duplicate — only if call sites can move without behavior change.

## Branch redundancy

| Pattern | Cleanup |
| ------- | ------- |
| Nested `if (x)` then `if (x)` again | Flatten |
| `switch` with duplicate bodies | Merge cases |
| `return A; ... unreachable` | Delete unreachable tail |
| Identical `try/catch` in siblings | Shared helper (optional, user-approved) |

## Constants and flags

- Remove enum variants with no references after enum-use scan.
- Replace `legacyMode ? old() : new()` with `new()` only when flag is proven always false in all deployments.

## Not redundancy (do not “simplify”)

- Different error messages or status codes
- Different metrics/logging tags
- A/B or gradual rollout branches still wired to config

## Classify in plan

Label each item **behavior-preserving** or **behavior-changing**. Behavior-changing items need explicit user approval, not bulk “cleanup OK.”
