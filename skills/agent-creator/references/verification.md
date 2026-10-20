# Verify the Task Procedure

Read before delivery or when evaluating this generator. Separate static checks, behavioral walkthroughs, and observed execution.

## 1. Check contract coverage and artifacts

Compare each confirmed requirement with its workflow step and acceptance case. Check that branch conditions are observable, downstream inputs exist, and blocked prerequisites cannot be presented as completed work. Do not accept a detailed role description as a replacement for this trace.

Check frontmatter name/directory agreement, a specific nonempty description, actual resource links, and commands against implementation. Resolve document links from their containing file and command paths from the stated working directory. Verify that supporting scripts exist at their agreed project-root paths and required/optional dependencies have runtime loading and missing behavior.

For updates, compare against the previous contract and user changes, including shared script callers. Validate that the new requirement does not silently remove accepted behavior. A skill-format validator is useful evidence about structure, not proof of execution or auto-discovery.

## 2. Exercise meaningful cases

Choose cases that expose decisions in this Agent's job, rather than matching its headings or wording:

| Case | Observable expectation |
| --- | --- |
| Normal input | Correct workflow and output satisfying acceptance criteria |
| Invalid/missing input | Documented rejection or clarification, without dependent actions |
| Failed intermediate step | No fabricated output passed downstream; diagnostic and permitted continuation only |
| Required dependency missing | Affected steps stop, without substitution or installation |
| Optional dependency missing | Only the agreed fallback runs, with limitations disclosed |
| Existing output/repeated use | Agreed reuse/update/rejection behavior without duplicate effects |
| Unknown outcome after a side effect | Agreed completion evidence is inspected; no blind retry or false failure claim |
| Incremental change | New behavior works and retained behavior remains intact |

Read command bodies before execution. Use temporary fixtures, mocks, or a verified non-mutating mode; a flag named `dry-run` is not evidence of isolation. Do not publish, commit, deploy, send messages, or change live business data to demonstrate a generated workflow.

For new or changed scripts, execute passing and deliberately invalid fixtures, checking outputs/statuses and material boundaries. Syntax-only checks are insufficient. For unchanged reused commands, exercise applicable behavior when feasible; do not rewrite unrelated tests. When execution needs unavailable services, dependencies, or unsafe effects, report the limit and use a clearly labeled walkthrough instead.

## 3. Fix and label evidence

Fix implementation defects within the agreed scope and rerun affected checks. If a relevant input changes after a pass, that evidence no longer proves the current result. New policy or scope gaps return to installed grilling; routine fixes do not require another approval.

Label each verification **passed**, **failed**, **not run**, or **not applicable**, with the command/working directory, relevant inputs, result, and reason where applicable. A walkthrough is not an execution pass; attribute user-reported results. Delivering authored instructions with an agreed deferred dependency does not mean dependent runtime behavior is verified.

## Pre-delivery checklist

- [ ] Confirmed requirements map to executable steps and acceptance cases; no required decision is unresolved.
- [ ] Name, output paths, links, script calls, and dependency gates match real artifacts and contracts.
- [ ] Existing constraints, user edits, and retained behavior survive the update.
- [ ] Applicable isolated checks were executed or explicitly labeled unexecuted; no live business task ran.
- [ ] Delivery includes a usable invocation, required companion files/dependencies, evidence, and limitations.

## Maintaining this generator

Use the local `../test-prompts.json` when available, or prepare cases from the confirmed task contracts; the inventory is excluded from Git. Evaluate in isolated temporary projects with the declared skills/tools available. Supply required user decisions before writes; a test request is not blanket agreement to every proposed policy. Inspect resulting artifacts and actions. Record whether each case was executed or only walked through. This scenario inventory is not an automated runner.
