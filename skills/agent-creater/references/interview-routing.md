# Interview and Operation Routing

Load whenever user input is needed, from scope discovery through delivery. This adapts grilling's questioning method to agent instruction authoring.

## Contents

- [Question frontier](#question-frontier)
- [Round format](#round-format)
- [Working route record](#working-route-record)
- [Commit example](#commit-example)
- [Overlap and ordering](#overlap-and-ordering)
- [Interview exit](#interview-exit)

## Question frontier

Start from the fact inventory and existing answers. Map the task as a **design tree**: each decision branches into the decisions that depend on it. Keep settled answers, open decisions, and pending fact discovery in the working record.

The **frontier** contains every unresolved decision whose prerequisites are settled. Ask the whole frontier in one round, then wait for the user's answers before recomputing it. A question depending on another open question belongs to a later round. Keep the tree limited to the requested instruction and verification scope.

```text
Repository facts + existing answers
  -> design tree -> ready frontier -> numbered questions + recommendations
                        ^                         |
                        +------ user answers -----+
  -> all branches settled -> concrete plan -> user agreement -> implementation
```

Finding facts is the agent's job: inspect the filesystem, tools, and available environment instead of asking the user for discoverable information. Delegate fact discovery to a sub-agent when available; otherwise inspect directly. Pending exploration blocks only downstream questions, so ask the rest of the frontier while it runs. Ask the user only for decisions or information inaccessible through available tools; do not fabricate a factual answer as a recommendation.

Use these dependencies to select questions:

| Decision | Ask when | Recommended starting point |
| --- | --- | --- |
| Operations | Target scope is known | Ask which actions should trigger behavior; offer examples relevant to this repository |
| Behaviors and order | An operation is selected | Specify exact steps, including required reads and documentation updates |
| Reuse or implementation | Existing checks and gaps are known | Reuse suitable checks; propose concrete additions only for uncovered needs |
| Acceptance | A check or procedure is selected | Define observable results, not just "looks correct" |
| Authorization | An action with side effects is proposed | Record whether explicitly requested each time or automatically authorized within a stated scope |
| Failure and unavailable execution | Prerequisites and steps are known | Stop dependent actions; report reason and the next permitted step |
| Overlap | Two routes can match together | Merge compatible actions; settle conflicting order or behavior with the user |

## Round format

Use this format in the user's language, including for later clarification or confirmation:

```text
❓ **Q1** - **<question title>**: <specific question, relevant evidence, and meaningful alternatives>

➡️ <recommended answer and brief reason>

---

❓ **Q2** - **<independent question title>**: <question whose prerequisites are already settled>

➡️ <recommended answer and brief reason>
```

Include only as many questions as the current frontier contains; do not force two questions or a generic questionnaire. If the harness requires a question tool, preserve the numbered question, evidence, and recommendation in its supported fields. Tool limits may split one round across messages; they do not make dependent questions ready.

For inaccessible facts, recommend a way to obtain the information or an explicit fallback decision, not an invented value. After each answer, update the tree, expose contradictions or remaining gaps, and ask only the new frontier. Reuse settled answers and earlier authorization; do not execute recommendations before acceptance.

## Working route record

Use this record during the interview; compress it for the final AGENTS.md:

| Field | Required detail |
| --- | --- |
| Trigger | A specific operation and phase, such as after editing code or before a requested commit |
| Scope | Relevant modules, files, environments, and exclusions |
| Actions | Ordered commands or concrete manual/document-editing actions; record prerequisites and working directories |
| Acceptance | Observable completion criteria for each action and the complete route |
| Failure | Which dependent actions stop, what evidence to report, and whether a fallback is authorized |
| Authorization | Source and scope of any automatic action, otherwise the request/approval required |
| Overlap | Merge/deduplication behavior or explicit priority if another route matches |

An action can be "update README to describe changed behavior" without a script. Ask what counts as completion and whether unchanged documentation is acceptable when behavior is unchanged. Never generate a fabricated README-update command.

## Commit example

User says: "When code changes, update README then create a commit."

Ask whether this is permission to commit automatically after every qualifying change or a prerequisite for commits the user requests. Until settled, no automatic-commit route is ready to write.

If request-only is selected, express two routes:
- After code changes: update the relevant README content, then execute agreed checks.
- Before a user-requested commit: ensure the documentation and checks are complete for the current changes, then commit the authorized changes.

If automatic is explicitly selected, record the applicable repository/change scope and passing gates. Exclude unrelated user changes. Automatic commit permission does not imply push, publication, or deployment permission. These are generated future instructions, not a request to commit while authoring them.

## Overlap and ordering

Treat ordered actions as prerequisites. Merge matching routes only if their combined ordering is consistent. If one says A before B and another says B before A, ask the user to choose; file order, recency, or specificity alone does not settle a conflict unless already agreed.

Deduplicate only identical actions with the same arguments, working directory, environment, inputs, and acceptance criteria. Similar command names are insufficient. Re-run a check when a later action changes its relevant inputs; earlier evidence is then stale.

Prevent self-triggering loops: route-generated edits belong to the current operation, not a new independent event that recursively restarts the same route. Still include those edits in applicable final verification. If secondary actions require another route, combine their prerequisites into the same plan; surface cycles instead of repeating indefinitely.

For a matching route with a failed, denied, or unavailable prerequisite, stop its dependent actions. Independent routes may continue only when they do not rely on that result or share conflicting side effects. Never choose an unapproved fallback.

## Interview exit

Before presenting the final plan, check:
- Every selected operation has a complete route record.
- Script gaps have an agreed implementation or an explicit manual/not-applicable decision.
- Missing execution environments have defined handling; this is not evidence of passing.
- Existing constraints and any proposed changes to them are accounted for.
- No route ambiguity, ordering cycle, or authorization decision remains open.
- No fact discovery remains pending; an empty ready frontier alone does not mean the tree is complete.

When every relevant branch is settled, present Step 3's concrete plan to confirm shared understanding before implementation. This is one confirmation gate, not a second approval after an already accepted identical plan. New gaps in later steps reopen the affected branch and use the same round format.

Unanswered required questions keep the interview open. If the user explicitly requests an incomplete draft, label it as a draft in the conversation; do not install unresolved instructions as the project's final AGENTS.md.
