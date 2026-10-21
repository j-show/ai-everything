# Existing document preservation

Read before planning any edit to an existing target.

## Choose the operation

| User intent | Operation |
| --- | --- |
| Explicit bare invocation of agenter | Use the default write scope in SKILL.md; create a missing root file or incrementally refresh an existing one without asking for a mode |
| Update, refresh, improve, or merge | Scoped patch; preserve unrelated sections and conventions |
| Only outline, evaluate, or suggest | Read-only proposal; no artifact writes |
| Explicitly replace a named document | Prepare replacement and account for affected constraints before writing |

A general request to shorten or reorganize does not authorize dropping project constraints. A request to create instructions where a target already exists becomes a scoped merge unless the user explicitly requests replacement.

## Account for affected content

Use a small working ledger for affected rules: original location → preserve, update with evidence, relocate, or proposed removal.

- Preserve unrelated content verbatim where possible, including language and formatting.
- Relocate a rule only within the authorized document set; add a trigger at the original entrypoint and verify equivalent scope.
- Collapse exact duplicates only when one authoritative instance remains reachable for every affected task.
- Resolve changed or obsolete rules using current evidence and the user's instructions. Disputed, unsupported, or materially relaxed constraints remain until resolved.
- For replacement, show constraints that would be removed or relaxed in the proposed diff. Generic replacement authorization alone does not settle a disputed constraint; obtain a decision on that change.

## Write against the current file

1. Capture the initial content of every existing target before drafting.
2. Immediately before applying its patch, re-read that file, including targets initially absent.
3. Rebase the proposed edits onto the latest content; preserve subsequent edits outside scope.
4. If changes overlap and intent is ambiguous, retain the current content and ask about the concrete conflicting portion.
5. Inspect the resulting diff and staged state. Never stage, reset, commit, or restore unrelated content as part of this workflow.

If a path is a symlink or other redirection, resolve its destination and confirm the intended target is inside the authorized scope before writing. If a formerly absent path now exists, reconcile it as an existing document.

On partial write failure, report the delivery status defined in `document-contract.md`, including which files changed, failed, or were not attempted. Repair only this run's changes when possible without losing later edits; do not use whole-file baseline restoration over current content.

An unchanged rerun should result in no writes. Reordering equivalent rules, refreshing timestamps, or translating unrelated prose does not count as necessary maintenance.
