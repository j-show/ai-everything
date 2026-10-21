# Repository evidence

Read in Step 1. Keep findings in working notes unless the user requested a separate report.

## Scan boundary and coverage

For a bare invocation, scan the selected workspace root, not just cwd's package. For an explicit narrower request, scan that scope plus the root configuration and instructions it depends on.

1. Enumerate first-party manifests and task entrypoints; resolve declared workspace-member globs and note additional first-party project roots referenced by CI or repository docs. Exclude `.git`, installed dependencies, vendored code, caches, and generated output. Account for external member/source paths as exclusions rather than following them automatically; applicable ancestor instructions still govern the workspace.
2. For the root and each discovered member, inspect the applicable source categories below. Follow referenced scripts and configuration far enough to establish command prerequisites, effects, and cross-package verification order; reading every source file is not required.
3. Keep a compact ledger: `member/source → inspected | absent/not applicable | unreadable | excluded (reason)`. Empty globs, external members, and inaccessible paths remain visible gaps. Each discovered member needs an entry; do not equate “not read” with “not applicable.”
4. Read existing root/domain instructions in full before proposing edits; preserve relevant ancestor rules and inspect nested instructions for the members they govern.

Use absence as evidence: a project without CI does not need an invented CI section or a question about adding one. A failed read of an existing required source is different from a genuinely absent optional source.

## Evidence sources

| Source | Establish |
| --- | --- |
| User instructions and applicable AGENTS files | Scope, hard boundaries, established conventions, existing authorization |
| Existing AGENTS.md, CLAUDE.md, domain guides | Current rules, protected sections, useful pointers, duplicated or conflicting instructions |
| README opening | Project purpose and audience; link installation prose rather than copying it |
| Manifests and lockfiles | Runtime, package manager, workspace membership, available script entrypoints |
| Referenced scripts, task files, CI | Actual invocation, package working directory, setup/build order, meaningful verification |
| Relevant directory contents | Real target paths and ownership; distinguish observed roles from guesses |
| Git status and scoped diffs | Existing working-tree/staged changes to preserve; for non-Git projects record that this protection is unavailable |

Trace selected commands far enough to establish their prerequisites and effects. A script name alone does not prove the command succeeds. Prefer the project's established package manager; do not convert all examples to npm or pnpm by habit.

Record a command only if it prevents a likely mistake or avoids a costly lookup: workspace selection, special flags, initialization order, platform requirements, or the correct verification subset. Use a source pointer for an obvious one-file lookup.

Source disagreements need resolution:

- If a README invocation disagrees with the live script, inspect both and report the mismatch; do not silently turn a broken script into a recommended command.
- Preserve user-established conventions unless the user changes them. A config omission does not disprove an unwritten convention.
- For unreadable sources, try an available authoritative alternative. If the missing fact prevents a safe authorized write, stop that dependent work and report 阻塞. Otherwise preserve uncertain existing rules, omit unsupported new claims, continue safe work, and report 完成但存在缺口. Ask only for information necessary to unblock the task.
- Do not infer private commands, environment variables, test success, or project policies from directory names.

Select the shortest relevant verification path. Establish setup, build, and test dependencies before recommending an order; some repositories require build before tests, others do not.

Discovery is complete when the ledger accounts for the selected root, discovered members, and applicable categories. This establishes the limits of coverage; it does not prove that undocumented policies or undiscovered external systems were examined.
