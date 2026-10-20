# Extract the Task Contract

Read at the modeling stage. This reference defines the information to extract; installed grilling supplies the interview method. Keep the working model in the conversation unless the user requests a separate document.

## 1. Identify the outcome

What concrete request activates the Agent? What result satisfies that request, and what is outside scope? Resolve ambiguous verbs: preparing a release draft and publishing a release have different outputs and authority.

Record required inputs, their source and valid forms, outputs and destinations, and acceptance criteria. Separate project facts from user preferences. Do not invent undocumented schemas, thresholds, defaults, or permission rules.

## 2. Recover the operational logic

Trace an actual example from input to result using the relevant implementation, existing Skill, procedures, and confirmed requirements. Extract decisions and data dependencies, not just headings or command names.

For each consequential step, answer:

| Element | Operational detail |
| --- | --- |
| Entry | When does this step apply? What input or prior result must be available? |
| Decision | Which observable condition selects the next branch? |
| Action | What exactly is done, by which command, tool, Skill, or reasoning procedure? |
| Result | What artifact/state is produced, and how does the next step consume it? |
| Acceptance | What observation proves this step succeeded? |
| Failure | What stops, what diagnostic is reported, and which fallback is permitted? |
| Authority | What existing authorization covers the action, or what must be approved at runtime? |

Use a compact chain or table; do not impose this as a verbose template on simple tasks. An analysis/writing step can be procedural without a script: specify evidence to inspect, selection rules, and output criteria. Remove steps that contribute neither a required result nor a constraint.

For branching or multi-step tasks, check that each later input comes from a real source. A failed prerequisite blocks its dependents; independent work may continue only if its inputs and side effects do not conflict. If retries, partial progress, or existing outputs matter, resolve their limits and rerun behavior. Do not introduce automatic retries for actions that may already have taken effect.

Maintain a short trace from each requirement to its implementing step and acceptance case. Before confirmation, ask internally: **Could another agent execute this without inventing a missing decision?** Send only those gaps to grilling.

## 3. Bind actions to real capabilities

Choose existing project commands/tools/Skills first. For every selected capability, establish:

- Actual identity and invocation, working directory, arguments, and input/output contract.
- Required runtime/service/permissions, material version constraints, and side effects.
- Which step needs it, whether it is required or optional, and observed availability.
- Missing behavior: stop affected steps for required dependencies; use only an agreed fallback for optional ones.

Do not invent slash commands, silently replace required capabilities, or automatically install dependencies. If a dependency is only available at future runtime, specify its discovery/loading gate and report dependent behavior as unverified during generation. Grilling is a generator dependency, not automatically an output dependency.

For a genuine capability gap, define a supporting script's exact project-root `scripts/` path, invocation, observable success/rejection, side effects, cleanup where needed, and isolated verification cases. Follow the project's language/framework. Inspect same-name files before choosing reuse, modification, or a different agreed path. Shared scripts require impact analysis of other callers.

## 4. Preserve scope during updates

Compare the requested change with the existing task contract. Identify behavior to keep, add, change, or remove, including accepted inputs, default outputs, and dependent callers. Treat local user edits as part of the baseline. Reuse settled decisions; only new or contradicted requirements need clarification.

Default to the current project. For an explicitly cross-project Agent, settle project discovery and how target projects provide commands/scripts. Moving only the Agent folder does not carry project scripts or installed Skills; do not claim self-containment without those capabilities.

The plan is ready when required decisions are settled, capabilities are implemented or have an agreed implementation plan, and every task outcome has an acceptance case. It must name file changes, existing content affected, dependencies, and any known limits on verification. A deliberately deferred runtime dependency must have a blocking gate, not an invented replacement.
