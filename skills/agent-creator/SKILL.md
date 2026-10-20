---
name: agent-creator
description: "Create, build, rewrite, or incrementally update a project's task-executing Agent skill. Turn requirements and project evidence into an actionable workflow, dependencies, supporting tools, and acceptance checks. Use for 'create an agent', 'build a project agent', 'update an agent skill', '创建项目 Agent', '生成任务助手', or '重写 Agent'. Requires separately installed grilling. Not for generating AGENTS.md, running an existing Agent, or building an Agent application."
---

# Agent Creator

**Core constraint: Generate the confirmed task procedure, not just a role prompt. Every consequential step needs an input, action, observable result, and failure response. Creating an Agent does not authorize performing its real business task.**

An Agent here is a project Skill. Preserve the task's actual decisions and operational details; use personality only when requested for the job.

## Workflow

Track these steps; reuse answers and approvals already established in the session.

```text
- [ ] 0. Load installed grilling; settle project and name ⛔ BLOCKING
- [ ] 1. Extract relevant project facts and existing behavior ⚠️ REQUIRED
- [ ] 2. Model the task and confirm the concrete generation plan ⛔ BLOCKING
- [ ] 3. Implement agreed tools and write/update the Agent
- [ ] 4. Verify, fix within scope, and deliver evidence ⚠️ REQUIRED
```

```text
Requirement + project evidence
  -> task steps and branches -> confirmed plan -> tools + Agent skill
  -> isolated checks -> delivery
         | failure: fix and recheck
         ` new scope/policy gap: return to grilling
```

### 0. Establish prerequisites and identity

Locate **installed `grilling`** through the environment's available skills or supported discovery, and load its instructions using that environment's skill mechanism. A repository file with the same name alone is not proof of installation. If absent or unloadable, report the installation/loading requirement and stop; do not install it automatically or substitute an embedded interview protocol.

Use grilling for unresolved decisions and plan confirmation throughout this workflow. If the user supplied no name, naming is its first decision. Determine the actual project root from the user's target and environment; do not assume the current subdirectory is the root. Clarify genuinely ambiguous targets.

Resolve the name to `agent-<name>`, using the prefix once. The suffix must contain nonempty lowercase alphanumeric segments separated by single hyphens; the complete name is at most 64 characters. Reject path separators/traversal and confirm any proposed conversion rather than silently renaming.

Resolve the default destination as `<project root>/.agents/skills/agent-<name>/SKILL.md`. Record the path and whether this is creation or update; read an existing target before proposing changes. Do not create files at this stage.

### 1. Extract facts

Inspect applicable AGENTS.md rules, current changes, and only the implementation, commands, documentation, and tools relevant to the requested job. Read command bodies before interpreting their names or executing them. For an existing Agent, include its references, supporting scripts, and shared script callers.

Separate **observed facts**, **confirmed decisions**, and **unresolved gaps**. Keep valid behavior and constraints; challenge contradictory premises with evidence. Discoverable facts are investigation work, not questions for the user.

### 2. Model and confirm

Read [generation-contract.md](references/generation-contract.md). Extract the task's inputs, steps, decisions, tool contracts, outputs, and completion/failure conditions. Use installed grilling only for unresolved choices; its instructions govern the interview. Do not mechanically ask every contract field or repeat settled questions.

Present the resulting workflow, dependencies, exact file changes, meaningful removals, and verification cases. Confirm the concrete plan before writing; reuse an earlier acceptance of the same plan. Unresolved required decisions block dependent implementation. Reopen only material capability, scope, or authorization changes.

### 3. Build the artifacts

Read [output-examples.md](references/output-examples.md) for translating the task into an executable Skill. Reuse suitable capabilities first; implement necessary agreed scripts under the **target project root's `scripts/`**. The Skill records how to call them. Include business-code, dependency, or configuration changes only if explicitly within the confirmed plan, following the project's documentation requirements.

Write/update the entrypoint and only necessary references/assets. Match the requested language, otherwise the project's instruction language, then the conversation language. Preserve unrelated user changes and valid existing behavior; change references and command calls together. Avoid rewriting already-correct content solely for style.

Before finalizing, audit every generated mandatory restriction or stop condition against a confirmed requirement, applicable project rule, or verified tool precondition. Remove unsupported restrictions; use grilling only when the unresolved choice is necessary to complete the requested job. Do not promote examples, convenient defaults, or ordinary assumptions into hard input/output constraints. For example, “do not make the final decision” does not itself prohibit conditional ranking, and “compare supplied options” does not establish a minimum count. Check a valid boundary case that a new gate could wrongly exclude, while retaining the user's actual prohibitions and required missing-information gates.

Preserve the scope of confirmed stop gates: “only ask for missing information” suspends the whole deliverable, not just conclusions that depend on that information. Do not output partial analysis under that gate. Resume the deliverable after the required information is supplied or the user explicitly changes the contract; a normal output template does not override this exception.

### 4. Verify and deliver

Read [verification.md](references/verification.md); complete its delivery checklist. Use isolated fixtures for behavior and scripts. Fix in-scope defects and rerun affected checks; return to grilling for material design changes. Distinguish executed results from walkthroughs and unavailable tests.

Deliver the real artifact paths, an invocation example, supporting script/dependency requirements, verification evidence, and limitations. The `.agents/skills/agent-<name>/` location does not prove host auto-discovery; provide an explicit SKILL.md path invocation unless named invocation is confirmed. Do not change host registration or deployment settings merely to make the example work.

## Anti-patterns

- Replacing task logic with an expert persona, or copying a checklist without the decisions that make it executable.
- Copying another Skill's procedure instead of declaring and invoking the dependency.
- Treating the generator's dependencies as mandatory dependencies of every generated Agent.
- Turning an unimplemented tool, unanswered decision, or unexecuted test into a completed capability.

For maintenance, use the local `test-prompts.json` with the verification reference when available; this scenario inventory is excluded from Git. If absent, prepare focused cases from the confirmed task contracts. Scenarios are evaluation inputs, not an automated test runner.
