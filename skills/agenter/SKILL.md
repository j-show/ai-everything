---
name: agenter
description: "Create, refresh, merge, or split repository agent instructions from live evidence."
disable-model-invocation: true
---

# Agenter

IRON LAW: **Every instruction needs repo evidence or a confirmed project convention; every deferred rule needs a task-triggered pointer.** Preserve existing constraints and user edits within the authorized scope.

Agenter owns the workflow below. Installed `writing-for-agents` supplies writing rules. Apply it at the three marked checkpoints without copying its body into this skill or the generated documents.

## Invocation contract

An explicit invocation with no additional arguments (for example, `$agenter`) is a request and authorization to **scan the current workspace and create its root AGENTS.md, or incrementally refresh it when it exists**. Proceed through verification without asking the user to restate this default action.

The default write scope is root AGENTS.md and necessary, task-linked guides under `docs/agents/` identified in Step 2. Reuse other authoritative documents as sources and pointers; editing them requires their own scope authorization. Preserve existing constraints and unrelated content; this default does not authorize full replacement, deletion, nested AGENTS files, or business operations.

Explicit active restrictions, paths, and outline-only requests override the default. A mention of the skill in an evaluation or discussion is not an invocation. Required dependencies and safe-write prerequisites still apply; optional missing information becomes a disclosed gap, not an automatic questionnaire.

## Workflow

```text
Agenter Progress:
- [ ] 0. Resolve writing-for-agents ⛔ BLOCKING before planning
- [ ] 1. Discover scope, source facts, and existing constraints ⚠️ REQUIRED
- [ ] 2. Plan hierarchy with writing-for-agents ⚠️ REQUIRED
- [ ] 3. Resolve authorization and remaining choices ⚠️ REQUIRED
- [ ] 4. Draft and write with writing-for-agents ⚠️ REQUIRED for write requests
- [ ] 5. Verify with writing-for-agents and report ⚠️ REQUIRED
```

## 0. Load the dependency

Resolve `writing-for-agents` from the session skill catalog or a supported discovery mechanism, including plugin-prefixed names. Record its registered entrypoint.

- Use the environment's skill invocation tool when provided. Otherwise read the registered `SKILL.md` through its declared file/resource mechanism and follow it; a tool literally named `Skill` is not required.
- Load once per available context, then apply it at Steps 2, 4, and 5. Reload if the instructions are no longer available.
- A same-name repository folder alone does not establish installation. If resolution or loading fails, report the exact missing dependency or read error. Read-only discovery may continue; stop before planning or writing. Do not install automatically or use an embedded substitute.
- Ordinary AGENTS/domain-document generation needs the dependency's main rules. Load its skill-mechanics branch only when authoring a Skill; interpret invocation metadata through the actual host's supported behavior.

**Done:** the registered dependency's instructions are available, or the run reports **阻塞** with the dependency error and any discovery-only results.

## 1. Discover

Resolve the project root from an explicit project/subproject path, otherwise the host-provided workspace root; if unavailable, use the Git root containing cwd, or cwd for a non-Git project. Honor a separately requested output path without treating that file as the project root. If multiple roots remain equally applicable, resolve the target before dependent work. Apply the invocation contract to select create, merge, or read-only mode.

Read [discovery.md](references/discovery.md) for the scan boundary and coverage ledger. Account for the root and discovered first-party workspace members, their applicable instructions, manifests, scripts, CI, README, and existing guides. Record working-tree and staged changes without changing the index. Read scope does not expand write authorization.

For an existing target, load [existing-documents.md](references/existing-documents.md) before planning edits. Keep a baseline of its content and any constraints that the proposed change could affect.

**Done:** each discovered member and source category is accounted for; target paths, mode, source-backed conventions, protected content, and gaps are identified. Continue safe work with non-blocking gaps; ask only when a necessary decision cannot be resolved from available evidence.

## 2. Plan — writing-for-agents checkpoint 1

Apply the loaded skill's information hierarchy and context-pointer rules. Read [document-contract.md](references/document-contract.md) to select the output sections.

Classify each candidate item:

| Needed by | Placement |
| --- | --- |
| Every task in scope | Root AGENTS.md |
| A specific task branch | Existing suitable guide, or a planned `docs/agents/<topic>.md` |
| A cheap, reliable repository lookup | Pointer to its authoritative source; inline only the exception or costly-to-recover invocation |

Ask: Which concrete agent error does each retained line prevent? Which task makes each external guide necessary?

Produce a short outline, root line budget, proposed target paths, and changes to existing content. Root defaults to **at most 200 lines**; this is a budget, not a target. Split by task branch even below the limit when useful; preserve global constraints in root. Exceed the budget only with an explicit user exception.

For a scoped merge, including a bare invocation, into an already over-budget root, preserve unrelated content and avoid adding avoidable bulk. If the excess cannot be resolved within scope, report it as a gap. The budget does not authorize a wider rewrite or block an otherwise valid scoped fix.

**Done:** each planned section has a purpose, each deferred rule has a trigger at the referring location, and the plan accounts for all affected existing constraints.

## 3. Resolve authorization

Reuse the user's current and earlier instructions, including the bare invocation's default authorization. Present the concrete plan and proceed when its writes fit that scope; absence of extra arguments is not a reason to ask again.

- For outline-only requests, skip Step 4 and use Step 5's outline checks before delivering; write no artifacts.
- For full replacement, require explicit authorization for that target; follow the preservation rules in `existing-documents.md`.
- Ask only for an unresolved necessary choice, scope expansion, or missing replacement authorization. Prepare the proposed content/diff before asking so the choice is reviewable.

**Done:** each planned write is covered by existing authorization or the user's response. Silence or elapsed time is not approval.

## 4. Draft and write — writing-for-agents checkpoint 2

Apply the loaded skill's co-location, completion-criteria, positive-instruction, and pruning rules to the planned documents.

Use `document-contract.md` as a selection guide, not a mandatory full template. Keep each rule's condition, action, and exception together. For ordered procedures, specify observable completion or failure conditions.

Create only the planned guides, linked from root with task triggers. Prefer existing authoritative docs over copies. Retain hard guardrails even when negative wording is necessary, and pair them with the intended action where useful.

Before writing, recheck every target, including paths initially absent, and resolve any parent/path redirection against the authorized scope. If a new target has appeared, load `existing-documents.md` and reconcile it as an existing document. Re-read existing targets and reconcile later edits against the baseline. Apply the smallest semantic patch; leave unchanged files untouched. If a material conflict cannot be resolved within the authorization, retain the current file and ask.

**Done:** authorized documents are written, protected content is preserved, and no out-of-scope file or staged entry was changed. Creation of instructions does not authorize executing the business operations they describe.

## 5. Verify — writing-for-agents checkpoint 3

Apply the loaded skill's pointer, single-source-of-truth, relevance, and completion checks to the resulting files, not just the draft.

For outline-only work, check source support, scan coverage, constraint coverage, proposed triggers, and the estimated budget. Distinguish planned targets from existing links; report plan validation using the delivery status in `document-contract.md`, without file-write or command-execution claims, then stop.

For write requests, apply the checks below to new and changed content and its affected links/rules. Report pre-existing problems outside scope without rewriting them or marking them fixed.

- [ ] Every retained command resolves to a real source with its working directory, required setup, and relevant flags. Distinguish source inspection from execution; run only safe, authorized checks.
- [ ] The discovery ledger accounts for all discovered members and source categories; omissions and unreadable sources are disclosed instead of silently treated as covered.
- [ ] Every affected existing constraint is preserved, validly relocated with a pointer, or explicitly resolved with the user.
- [ ] Root fits the agreed line budget, or pre-existing excess is disclosed under Step 2's scoped-update rule; global rules remain visible and readable.
- [ ] Each generated guide has a root trigger; every local link resolves relative to the referring file. External links are attributable sources, not a claim that they were fetched.
- [ ] Each meaning has one authoritative location; ordinary script lists, directory inventories, generic advice, and empty sections are omitted.
- [ ] Procedures have observable completion criteria; no unresolved template markers remain.
- [ ] The final diff matches the scope, preserves subsequent edits and staged changes, and introduces no unrelated rewrites.

For each generated branch, walk a representative task through its root pointer to the correct guide, then check a task outside that branch. Label this a walkthrough, not an independent agent run. When maintaining or evaluating this skill, load [acceptance-scenarios.md](references/acceptance-scenarios.md); execute applicable cases in disposable fixtures and distinguish executed checks from untested scenarios.

Repair failures within the authorized scope and recheck affected criteria. If a required planned write or required check fails, record the error, classify every planned target as written, failed, or not attempted, continue only targets that do not depend on the failure, and report **阻塞**. Do not downgrade that failure to **完成但存在缺口**. When the missing evidence is optional, keep the non-blocking gap rule in `document-contract.md`.

**Done:** report exactly one delivery status defined in `document-contract.md`: **完成 / 完成但存在缺口 / 阻塞**, with scope, changed/unchanged paths, actual verification, and any gaps or required next action. An unchanged result can be 完成; do not rewrite merely to produce a diff. Completeness is relative to the accounted-for repository evidence, not unwritten conventions.

## Anti-patterns

- Repeating a dependency's prose instead of loading it at the registered entrypoint.
- Filling section or rule-count quotas, or inventing commands to complete a template.
- Treating fewer lines as permission to drop a project constraint.
- Treating an outline, source inspection, or zero executed checks as behavioral verification.
