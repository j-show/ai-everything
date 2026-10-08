---
name: agent-creater
description: ""
---

# Agent Creater

IRON LAW: **Every generated route must have a settled trigger, ordered actions, acceptance criteria, failure handling, and authorization.** Never turn an unanswered question into a rule, a missing script into a runnable command, or an unexecuted check into a pass.

## Workflow

Copy and track:

```text
Agent Creater Progress:
- [ ] Step 1: Discover repository facts and existing constraints ⚠️ REQUIRED
- [ ] Step 2: Resolve missing information in grilling-style decision-tree rounds ⚠️ REQUIRED
- [ ] Step 3: Confirm concrete routes and file changes ⛔ BLOCKING
- [ ] Step 4: Reuse or implement agreed checks; execute and record evidence
- [ ] Step 5: Write minimal AGENTS.md and necessary procedure guides
- [ ] Step 6: Review routes and delivery evidence ⚠️ REQUIRED
```

```text
Repository facts -> interview -> agreed plan -> checks and evidence -> AGENTS.md
                         ^              |
                         +-- new gaps --+
```

## Step 1: Discover

Default to the current repository root; clarify only when multiple target repositories or a requested subpath make scope ambiguous. Inspect current changes before editing.

Read the applicable agent instructions, manifests, script implementations, test configuration, CI workflows, and relevant README sections. Follow referenced files only as needed to establish commands, environments, and constraints.

Build a working inventory, not a permanent project manual:

- Which behavioral tests, validators, and manual procedures already exist?
- What are their exact invocation, working directory, prerequisites, and observable pass/fail results?
- Which operations already have required ordering, reading rules, or authorization boundaries?
- Which facts are directly supported by files, and which decisions remain open?

Inspect command bodies before running them. A command named `test` may deploy, write data, or require a service. Reading a manifest proves only that a command is defined.

Preserve operative constraints from every section of an existing AGENTS.md, including nested scope instructions. Do not lose a rule merely because it appears outside a boundaries section. Do not edit nested instructions unless in the agreed scope.

## Step 2: Interview in grilling-style rounds

Whenever user input is needed in any step (including scope discovery, plan confirmation, and gaps found during verification), use the grilling-style protocol in `references/interview-routing.md`. It defines the decision tree, round format, route records, and overlap handling; no separate grilling installation is required.

Map unresolved choices and their prerequisites as a design tree. Resolve discoverable facts yourself; ask the whole ready frontier in each round using `❓ Qn` questions and `➡️` recommended answers. Wait for the user's answers, then recompute the frontier; defer any question that depends on an unanswered question or unfinished exploration.

Cover test scripts, validation scripts, test procedures, and operation routes. Existing commands may satisfy several needs; do not invent separate scripts or force a fixed number of rules. Ask whether unsupported categories are intentionally not applicable and record the reason.

For missing scripts, propose reuse, adaptation, or a new file with its behavior, location, invocation, and acceptance criteria. Prefer the target repository's tools and locations. Only implement after that choice is settled.

Persist answers in the conversation's working decision record; do not ask again unless new evidence changes the decision. Challenge incorrect premises, contradictions, and incomplete answers with evidence and a focused follow-up rather than silently choosing.

When all relevant branches are settled and no fact gathering remains pending, summarize the shared understanding through the concrete plan in Step 3. A recommended answer, elapsed time, or silence is not agreement.

## Step 3: Confirm the concrete plan

Present:

- Routes as `operation/condition -> ordered actions -> acceptance -> failure response`, including authorization.
- Existing checks to reuse and exact scripts/configuration to add or change.
- AGENTS.md create/merge/replace mode, planned procedure files, and any existing rule proposed for removal or changed meaning.
- Unavailable execution prerequisites and the agreed handling of those cases.

Obtain agreement before implementing the proposed writes. Reuse earlier explicit approval when it already covers the same concrete plan; ask only about material additions or changed scope. Preserve user changes and existing constraints outside the approved changes.

Route authoring is not route activation: an example or future automatic-commit rule does not instruct this authoring session to create a commit, deploy, or publish. Execute such actions only if separately authorized for this session.

## Step 4: Implement and verify agreed checks

Load `references/verification.md` when planning or executing automated checks, missing scripts, or manual procedures.

Reuse existing commands first. Make only agreed changes to target tests, scripts, and supporting configuration. Follow the target project's required documentation updates for those changes. Do not create a generic test harness merely to give this skill a bundled script.

Run the applicable commands within their authorized environment and scope. For new or changed checks, verify meaningful success and rejection behavior. Fix in-scope implementation errors and rerun affected checks; return to the user for unresolved policy or scope changes.

Keep execution results separate from policy: `passed`, `failed`, `not run`, or `not applicable`, with evidence and reasons. A blocked environment may still permit an agreed manual/deferred procedure to be documented; never claim that procedure passed. If a required missing script remains only a proposal, do not deliver a completed runnable route to it.

## Step 5: Generate minimal agent instructions

Load `references/output-examples.md` for placement, compact output, and worked cases.

Write in the user's requested language; otherwise follow the target repository's instruction language, falling back to the conversation language.

Use only sections with operative content:

1. **Reading rules**: when to read which relevant document or section.
2. **Operation routes**: conditions, ordered behaviors, completion gates, and failure behavior.
3. **Boundaries**: project-specific restrictions and actions needing authorization.

Exclude project introduction, directory overview, tutorials, interview transcripts, execution logs, and generic advice. Do not impose a minimum rule count or pad empty sections.

Keep short commands and criteria inline. Reuse existing detailed documentation when accurate; write `docs/agents/verification.md` or a focused topic file only when a long procedure needs it. Link each guide with a loading condition; a link is not an automatic loading mechanism. Scripts belong in the target repository's established locations, not in AGENTS.md code dumps.

Do not duplicate long procedures between root and guides. Keep global restrictions in root. Preserve module-specific scope when moving detailed rules. Remove redundant wording without dropping unique requirements. No template markers, dangling paths, or unresolved route choices may remain in the final instructions.

## Step 6: Review and deliver

Walk each route with a matching and a non-matching operation. Also check overlapping triggers, conflicting order, denied authorization, a failed prerequisite, and unavailable execution. This is a policy walkthrough, not proof that commands ran.

Check links, command definitions, working directories, and the final diff. Rerun affected checks if relevant inputs changed after a previous pass. Deliver file locations, a compact route summary, actual validation evidence, and any remaining environmental limitation. Claim completion only for what the evidence supports.

## Anti-patterns

- Treating conditional routing as only a changed-file-to-test mapping; operations can trigger documentation updates, reads, commits, or other agreed behavior.
- Asking the user for commands discoverable in the repository, or inventing project policy to fill a template.
- Asking dependent questions in the same round, omitting recommendations, or treating an empty ready frontier with pending exploration as interview completion.
- Treating an operation description as permission for automatic commits.
- Silently dropping existing rules during shortening or wholesale replacement.
- Continuing dependent actions after failure, skipping a check and calling it passed, or leaving a required script nonexistent.
- Executing newly authored side-effect routes merely to demonstrate them.

## Pre-delivery checklist

- [ ] Repository facts and user decisions are distinguished; no necessary decision is unanswered.
- [ ] All requests for user input used grilling-style rounds; dependent questions waited, and the concrete plan reflects confirmed shared understanding.
- [ ] Tests, validators, and procedures are accounted for or explicitly not applicable.
- [ ] Every route is executable or has an agreed manual/deferred procedure with a blocking gate.
- [ ] Triggers, order, acceptance, failure handling, authorization, and overlaps are settled.
- [ ] All script changes were agreed, and execution evidence is accurately labeled.
- [ ] Existing constraints and local changes were preserved unless their alteration was agreed.
- [ ] AGENTS.md contains only actionable reading rules, routes, and boundaries.
- [ ] Detailed guides are needed, linked conditionally, and free of duplicated procedures.
- [ ] Links and commands resolve; relevant final-input checks and route walkthroughs are complete.
