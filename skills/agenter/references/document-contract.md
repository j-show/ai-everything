# Output contract

Read in Step 2; use again while drafting. Select only sections supported by project-specific evidence.

## Root AGENTS.md

| Section | Include when |
| --- | --- |
| Project and audience | A brief identity or human-facing README pointer helps orient work |
| Commands and environment | Non-obvious invocation, working directory, setup, or platform constraints prevent errors |
| Boundaries | The project establishes Always do, Ask first, or Never do rules; omit empty categories and minimum rule counts |
| Verification | A change-specific procedure differs from a trivial manifest lookup |
| Known fixes | Evidence shows a recurring failure and a reliable remedy |
| Document map | A task needs a guide or authoritative source outside root |

Keep exact command strings when included, with effect and working directory. Centralize repeated invocations in one section and refer to that section elsewhere. A common command can earn space if it is the reliable entrypoint into a non-obvious workflow.

Express ordinary guidance positively. Preserve explicit safety, scope, and authorization prohibitions; pruning style is not authority to relax them. Include approvals only where the actual project or user requires them.

## Task-triggered pointers

Place the load condition in the **referring document**, before the reader has opened the target:

```markdown
| Read when | Document | Purpose |
| --- | --- | --- |
| Changing deployment paths or link-conflict handling | [Deployment](docs/agents/deploy.md) | Destination rules and isolated verification |
| Editing an HTTP endpoint or its schema | [API](docs/agents/api.md) | Contract source and endpoint checks |
```

These are shape examples; emit a row only if that task and target actually exist. Use one trigger per distinct branch, not a list of synonyms. A title such as "Frontend rules" alone is not a load condition.

Resolve links relative to each document. A domain guide linking root README typically needs `../../README.md`; verify the actual layout rather than assuming this path.

## Domain guides

Prefer existing suitable docs. Create `docs/agents/<topic>.md` only for a planned task branch that needs its own material; use lowercase hyphenated names.

Each guide contains its scope, task-specific constraints, relevant command exceptions, and observable verification criteria. Keep a concept's definition, rule, and exceptions together. Root owns global rules; the guide owns branch detail. A root pointer describes the branch without repeating its rules.

Split by task, not file extension or an arbitrary line threshold. Multiple runtimes do not automatically require multiple guides if the same workflow handles them. Even below 200 root lines, disclose material that only one branch needs.

Nested AGENTS.md files require an explicit target or established project convention and verified host scoping. Do not assume identical nearest-file precedence across hosts. CLAUDE.md compatibility links are separate changes requiring user authorization; reuse existing project arrangements without automatically creating symlinks.

## Completion

Choose observable outcomes for procedures: the exact relevant check passes, every affected endpoint has a contract source, or an unmet prerequisite is reported. Avoid "finish reviewing" as its own acceptance criterion.

Use short text diagrams only when they clarify a workflow. Omit empty headings and generated placeholder content; retain unrelated pre-existing material during scoped updates.

## Delivery status

Start the final report with exactly one status; use the same distinction in early exits. These statuses describe the requested documentation task, not overall repository health.

| Status | Completion criterion |
| --- | --- |
| **完成** | Discovery coverage is accounted for, every authorized planned target is written or verified unchanged, and all required document checks pass without material unresolved gaps. For outline-only requests, the validated plan is the deliverable. |
| **完成但存在缺口** | Safe in-scope work and required document checks are complete, but non-blocking coverage or knowledge gaps remain, such as an optional inaccessible source, an unsupported convention, or pre-existing excess length preserved outside the change scope. State each gap's impact. |
| **阻塞** | A prerequisite, necessary decision, safe write, or required check remains unresolved: for example missing dependency, ambiguous root, unreadable target, conflicting edits, failed planned write, or missing necessary authorization. Report partial progress as well as the blocker. |

An absent optional source is not itself a gap; do not ask the user to invent policies or configuration. Report concrete gaps encountered in the scan and their effects, not hypothetical unwritten preferences. A failed required write/check cannot be downgraded to 完成但存在缺口. Partial success does not make an unresolved required target complete.

Keep the report concise: status → scope and changed/unchanged paths → verification actually performed → gaps or exact next action. A blocked multi-target run distinguishes completed, failed, and not-attempted targets. Do not create a separate report file unless requested.

Document-only work may verify commands from sources without executing them. Disclose that limit; it becomes a blocker only if the user or project requires execution for this task. Neither static inspection nor a successful document check proves the underlying business tests passed.
