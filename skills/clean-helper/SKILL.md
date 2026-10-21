---
name: clean-helper
description: "Remove dead code, deprecated branches, unused functions, and redundant logic within a scoped codebase area. Evidence-first cleanup with user confirmation before deletion. Use when user wants to clean code, remove deprecated paths, delete unused exports, deduplicate logic, prune feature flags, simplify conditionals, or invoke clean-helper. Triggers: 'clean', 'clean-helper', 'dead code', 'remove deprecated', 'unused function', 'redundant logic', 'prune', 'remove legacy', 'delete unused', 'cleanup', '清理代码', '删除废弃', '移除冗余', '无用代码', '废弃分支', '精简逻辑', 'dead branch', 'unreachable code'."
---

# Clean Helper

IRON LAW: **Clean only within the authorized scope and preserve required behavior.** Approval or a deprecated label alone does not prove code is dead. Keep valid tests and live callers; never mix unrelated refactors into a cleanup pass.

## Workflow

Copy this checklist and track progress:

```
Clean Helper Progress:

- [ ] Step 0: Scope ⛔ BLOCKING
  - [ ] Load references/scope-and-targets.md
  - [ ] Resolve files/modules from user input + optional staging/diff
- [ ] Step 1: Inventory ⚠️ REQUIRED
  - [ ] Load references/dead-code-discovery.md
  - [ ] List candidates with evidence (call graph, references, flags)
- [ ] Step 2: Redundancy pass
  - [ ] Load references/redundancy-patterns.md
  - [ ] Mark merge/simplify opportunities separate from deletions
- [ ] Step 3: Confirm ⚠️ REQUIRED
  - [ ] Reuse existing authorization; confirm only uncovered items
- [ ] Step 4: Apply cleanup
  - [ ] Record pre-cleanup state and relevant verification results
  - [ ] Delete/simplify only approved items
- [ ] Step 5: Verify ⚠️ REQUIRED
  - [ ] Load references/verification.md
  - [ ] Classify results; repair or undo cleanup-induced regressions
- [ ] Step 6: Self-check ⚠️ REQUIRED
```

**Control flow**

1. Complete Step 0 → 1 → 2 before Step 3.
2. Do **not** edit production code until Step 3 approval (or user pre-authorized “apply all safe removals”).
3. A read-only inventory ends after presenting findings. Otherwise run Step 5 after each logical cleanup; unresolved items do not block independent safe work.

## Step 0: Scope ⛔ BLOCKING

Load `references/scope-and-targets.md`.

| User input | Cleanup scope |
| ---------- | ------------- |
| Directory path | That tree only (imports may be traced outward read-only) |
| File path | That file + direct dependents in scope |
| `{{input}}` empty | Staged + unstaged diff files, or ask for path |
| `all` / whole repo | Ask to confirm — prefer module-by-module |

Ask one clarifying question if scope is ambiguous and would touch >30 files.

## Step 1: Inventory ⚠️ REQUIRED

Load `references/dead-code-discovery.md`.

For each candidate, record in a short table:

| Item | Kind | Evidence | Risk |
| ---- | ---- | -------- | ---- |

Kinds: `unused-export`, `unreferenced-fn`, `dead-branch`, `deprecated-api`, `stale-flag`, `duplicate-block`.

**Questions to answer before marking dead:**

- Who imports or calls this symbol? (ripgrep, IDE refs, dynamic import strings)
- Is it referenced from tests, config, codegen, or reflection?
- Could removal change runtime behavior for still-live paths?

Skip items with weak evidence — list under “needs user input” instead of Step 4.

Valid test-only callers are usage evidence, not a reason to delete the test with its implementation. Retire a test only when its contract is explicitly retired and changing that test is in scope.

Save the inventory table to `.review/clean-{timestamp}.md` (timestamp filename).

## Step 2: Redundancy pass

Load `references/redundancy-patterns.md`.

Separate **deletions** from **simplifications** (merge helpers, collapse duplicate conditionals). Simplifications still need Step 3 approval if they change control flow.

## Step 3: Confirm ⚠️ REQUIRED

Present to the user (Chinese summary OK):

1. **Delete** — symbols/branches/files with evidence
2. **Simplify** — redundancy merges (behavior-preserving)
3. **Defer** — uncertain items and why

Reuse explicit authorization from the conversation for the covered items. For uncovered items only, ask:

- Apply all **Delete** items?
- Apply **Simplify** items?
- Any item to keep despite appearing unused (public API, plugin hook, etc.)?

A broad “remove all deprecated” does not establish which public contracts may break. Defer those items unless the specific contract removal is already authorized; continue independent safe items.

Update the `.review/clean-{timestamp}.md` copy with the final approved plan before Step 4.

## Step 4: Apply cleanup

Rules:

- Load `references/verification.md` before editing: record the current diff/index, preserve the current contents of files to edit, and run relevant baseline checks. Keep later cleanup hunks distinguishable from user changes.
- One logical change per commit-worthy chunk (user may commit separately).
- Remove deprecated branches by deleting the dead arm and folding constants — do not leave `if (false)` stubs.
- When deleting a function, remove imports/call sites in scope; update barrels (`index.ts`) in same pass.
- Do not rename unrelated symbols or reformat whole files.

## Step 5: Verify ⚠️ REQUIRED

Load `references/verification.md`.

Follow `references/verification.md` for command selection, result classification and recovery:

```text
Failure → compare with pre-cleanup evidence
  ├─ Caused by this cleanup → repair in scope or undo only its responsible hunks → rerun
  ├─ Pre-existing / environment blocked → retain evidence; continue independent checks
  └─ Cause unknown / zero relevant tests → investigate or report unverified
```

Do not seek fresh permission to undo your own proven regression. If restoration overlaps user changes or its provenance is uncertain, preserve the current content, defer that item and ask only about the conflict. Never overwrite a whole file/index from an old snapshot or change valid assertions to make cleanup pass.

## Step 6: Self-check ⚠️ REQUIRED

Run the pre-delivery checklist below. Confirm `.review/clean-{timestamp}.md` reflects what was removed or deferred.

## Red flags (stop and re-run Step 1)

- “Probably unused” without search hits checked
- Deleting code only mentioned in CHANGELOG
- Removing feature flags still read from env/config
- Collapsing branches that differ in telemetry, auth, or billing side effects

## Anti-Patterns

- Whole-repo delete without scope confirmation
- Removing public API exports without user ack
- “Cleanup” that changes observable behavior without calling it out
- Drive-by style/format churn on untouched lines
- Skipping Step 5 after deletions
- Treating test-only helpers as dead because production does not call them (check test imports)
- Reporting exit 0 as verified when no relevant test ran, or removing valid failures to obtain a green run

## Pre-Delivery Checklist

- [ ] Scope documented and respected
- [ ] Every deletion has evidence noted in inventory
- [ ] User approved Step 3 plan (or pre-authorized scope stated)
- [ ] No unrelated files modified
- [ ] Actual commands, exit codes, relevant test counts and remaining failures/gaps reported
- [ ] Cleanup-induced regressions repaired or locally undone; user changes and index preserved
- [ ] Deferred/uncertain items listed for user
- [ ] Inventory/plan copy saved under `.review/clean-{timestamp}.md`
