# Checks and Test Procedures

Load when evaluating existing commands, proposing missing scripts, or recording execution evidence.

## Placement and reuse

| Need | Target location | Root AGENTS.md content |
| --- | --- | --- |
| Behavioral test | Existing test framework and directory | Trigger, invocation, acceptance, failure gate |
| Validator: lint, types, build, schema or consistency | Existing command or script location | Applicability, invocation, acceptance, failure gate |
| Short test procedure | Inline when readable | Ordered steps and observable results |
| Long automated/manual procedure | Existing accurate guide, otherwise a focused `docs/agents/` file | When to read it and which completion gate depends on it |

One command may cover both behavioral tests and validation. Classify by purpose only to find gaps, not to demand two implementations. Do not create empty directories, sample-only tests, or separate wrappers for commands already sufficient.

## Command contract

For each relevant command, establish:
- Exact invocation and working directory, including monorepo subpackage paths.
- Runtime/tool versions where material, environment variable names, required services, fixtures, and permissions. Do not copy secret values into instructions.
- Whether it terminates or starts a watch/server process; prefer a finite check where available.
- Expected exit status and domain-specific assertions or artifacts. Exit zero alone may not prove tests actually ran.
- Side effects, cleanup, and the dependencies needed before execution.

Use facts from manifests, script bodies, CI, and observed behavior. Do not infer a port, executable, shell, or test target from a framework convention.

## Missing scripts

Before implementing, show the specific gap, proposed file/command, checked behavior, pass/fail criteria, dependencies, and expected side effects. Obtain the user's choice to reuse, adapt, or add it; existing approval of that exact plan is sufficient.

Implement in the repository's existing language/framework. Avoid adding dependencies when existing tools suffice. If a new dependency or broader configuration change is necessary, expose it in the plan rather than expanding scope silently.

Verification must show that the check detects its intended failure:
- For a validator, use a safe passing fixture and a deliberately invalid fixture; confirm correct success and nonzero rejection.
- For tests, exercise agreed observable behavior and a meaningful failing case or assertion sensitivity through the existing framework.
- Use isolated fixtures or an explicitly scoped reversible probe. Do not break user files, mutate shared data, or deploy just to demonstrate rejection.
- If such execution cannot safely run here, report the missing evidence and follow the agreed blocking/manual procedure.

A syntax check is not functional validation. Never report a new script as fully verified from parsing alone.

## Manual or environment-dependent procedures

Include only the steps needed to reproduce the check:
1. Prerequisites and test data.
2. Ordered commands or exact manual actions.
3. Observable expected results and tolerances where relevant.
4. Evidence to capture and where the user should report it.
5. Cleanup and handling when a step cannot run or fails.

Ask the user about acceptance thresholds or physical/UI observations that repository facts cannot settle. User-reported results must be attributed; do not present them as agent-observed execution.

If a service, credential, device, or tool is absent, record `not run` and why. Keep dependent commit/deploy gates blocked unless the user explicitly selected a different fallback. Documenting the future procedure may be complete while its execution remains unverified; report these separately.

## Evidence and stopping

| Status | Meaning | Consequence |
| --- | --- | --- |
| Passed | Applicable check executed and met its criteria | May satisfy a gate for the same relevant inputs |
| Failed | Executed but violated criteria | Stop dependent steps; fix in scope or report |
| Not run | Discovered, proposed, or blocked, without execution evidence | Does not satisfy a passing gate |
| Not applicable | Explicitly excluded for this operation with a reason | Excluded from this operation's required checks, not globally passed |

Keep exact commands, relevant input revision/state, exit status, and a concise result or artifact reference in the delivery report. Put durable procedure rules in AGENTS.md or its guides, not dated success logs. If relevant inputs change after a pass, rerun the affected check before using that evidence.
