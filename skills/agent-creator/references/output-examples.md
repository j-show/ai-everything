# Write the Agent from the Contract

Read while building artifacts. Translate the confirmed model into runtime instructions; do not copy the generator's own investigation/interview process into every Agent.

## Placement and instruction mapping

```text
project/
|-- .agents/skills/agent-<name>/
|   |-- SKILL.md          runtime entrypoint
|   |-- references/      substantial conditional procedures, when needed
|   `-- assets/          task-consumed templates/data, when needed
`-- scripts/             supporting tools, when needed
```

Place generated Agents under `.agents/skills/`; keep supporting scripts in the project root's `scripts/` directory. Reuse existing sufficient capabilities without creating a wrapper. Keep script implementations in project files, not code dumps in SKILL.md.

| Contract information | Generated content |
| --- | --- |
| Identity and activation | Matching frontmatter `name`; nonempty `description` with specific user requests and scope |
| Inputs and capability prerequisites | Runtime input/preflight instructions, project-root discovery, dependency loading and missing behavior |
| Steps and decisions | Ordered workflow with observable branch conditions and explicit downstream inputs |
| Completion and failure | Step gates, stop/fallback behavior, and final result format |
| Repeated use, when relevant | Existing-output policy, partial-progress detection, and which steps may safely resume or retry |
| Authority | Project-specific limits and approval points attached to the affected action |
| Conditional detail | References linked with when-to-read conditions |

Use only sections with operative content. Replace unresolved placeholders; retain intentional documented command arguments. Avoid copied project introductions, interview transcripts, and dated verification logs. Express the actual role through task decisions; add stylistic persona only if requested.

Commands run from their stated working directory. A link in `.agents/skills/agent-config-check/SKILL.md` to a project script is `../../../scripts/check-config.mjs`; a root-relative command is `node scripts/check-config.mjs`. Recompute links in deeper reference files. Pass user paths as arguments with proper quoting, not interpolated shell code.

For workflows with side effects, preserve the agreed distinction between failure and an unknown outcome. If a write may have succeeded before a timeout, inspect the agreed evidence of completion before any retry; do not equate a missing success response with permission to repeat it. State which verified outputs can be reused and how unresolved state is reported.

## Example 1: configuration checking

**Request:** Create config-check; validate application configuration without changing it.

Assume the user confirmed the default path `config/app.json` and an implemented read-only Node validator with `--file`, success status 0, schema rejection status 1, and other statuses for execution failures. These are example facts, not universal defaults.

The generated workflow should preserve the following logic:

```text
Supplied file, otherwise confirmed default
  -> resolve from project root; missing file: report and stop
  -> load runtime and scripts/check-config.mjs; missing: stop
  -> node scripts/check-config.mjs --file <configuration-path>
       0 + validation summary -> report checked path and success
       1 + field diagnostics  -> report schema errors, do not repair
       other execution error -> report incomplete validation
```

Name the Skill `agent-config-check`. Document the script link, working directory, exact accepted inputs, and result semantics. For an update adding JSON output, preserve the previous default unless a changed contract was accepted; check other script callers before changing their interface.

## Example 2: release-note drafting through a dependency

**Request:** Create release-notes; use an installed documentation Skill to prepare a draft, never publish it.

Resolve revision range, evidence sources, draft destination, formatting criteria, and existing-file behavior. Bind the writing step to the actual dependency's loading/invocation method. Required dependency unavailable: stop that step and report what is missing. Generate no script if existing tools suffice.

The runtime workflow gathers the agreed change evidence, invokes the dependency, checks draft coverage and format, and reports the draft path. It does not repeat the Agent-generation interview or publish the draft. Do not imply that the dependency was executed during generation if it was unavailable.

## Example 3: incremental output-format change

**Request:** Update config-check with a JSON result option while preserving its default output.

Trace the existing Skill-to-script invocation, output consumers, and failure statuses. Confirm the new schema and option, then change only the relevant instructions, script, and fixtures. Verify both formats, rejection behavior, and existing callers. A repeated request with the same already-implemented contract should not produce wording-only churn.

## Delivery

Give the real absolute path in an explicit invocation, for example: “Read and follow `<project root>/.agents/skills/agent-config-check/SKILL.md` to check `config/app.json`.” Replace the project-root token in the delivered example. Offer a native named invocation only if the host actually discovers the Skill.

List project scripts and external dependencies needed alongside the folder, especially for migration. Keep actual verification results in the delivery report rather than inside reusable instructions.
