# Minimal Output and Worked Cases

Load while drafting AGENTS.md or checking whether a proposed artifact belongs in the target project.

## Output shape

```text
Target repository
|-- AGENTS.md                     reading conditions, operation routes, boundaries
|-- existing test/script paths    actual executable checks
`-- docs/agents/                  only if detailed procedures need new documents
    `-- verification.md           prerequisites, steps, acceptance, cleanup
```

Use the fewest lines that preserve executable decisions. No project introduction or directory overview belongs in the generated AGENTS.md. Omit empty sections. Preserve existing substantive rules and their scope; propose any removals explicitly during confirmation.

Each rule should answer a decision the AI must make. Commands are relative to a stated working directory; document links resolve relative to the file containing them. Add a loading condition to every linked procedure. Link to existing authoritative guides rather than duplicating them.

The following example assumes all commands exist, the repository root is their working directory, and the user approved each rule. It is not a set of defaults:

```markdown
## Reading rules
- Before changing application code, read the relevant module procedure in docs/agents/verification.md.

## Operation routes
- After changing code: update README to reflect the changed behavior, then run `npm run check` and `npm test` from the repository root; both must exit zero and all selected tests must pass.
- Before a user-requested commit: verify README matches the current behavior and the required checks passed for the current changes, then commit only the authorized changes.
- After documentation-only changes: run `npm run check:docs` from the repository root; it must exit zero with no broken links.
- If a prerequisite fails or cannot run, report why and stop its dependent actions.
- Merge compatible matching routes without repeating identical checks; ask about unresolved order conflicts. Do not restart a route recursively for its own generated edits; validate the final relevant inputs.

## Boundaries
- Do not commit automatically without explicit authorization covering that operation and scope.
```

Long guides should contain a scoped procedure, not a second copy of the root rules. Manual checks must have concrete expected observations; "verify the UI" is insufficient. Keep execution history in the delivery report.

## Case 1: Existing checks and request-only commits

**Input:** "Ask me how code changes should update README and pass tests before committing."

**Facts:** Repository already defines a finite test command and a validator; an existing rule forbids unrequested commits.

**Decisions:** User confirms documentation-update criteria, validator/test order, acceptance, and request-only commits.

**Interview:** Ask independent documentation criteria and check-order decisions together, with a recommendation for each. Reuse the existing no-unrequested-commit rule; do not ask for authorization already settled by it.

**Output:** Minimal AGENTS.md with the selected route and existing authorization boundary. No new script or procedure file if the inline commands suffice. Run authorized checks and report actual evidence; do not create a commit to demonstrate the route.

## Case 2: Missing configuration validation

**Input:** "When configuration changes, check required fields and types. Build the missing validator after asking me."

**Facts:** Existing tools can parse the configuration; no suitable validator exists. The valid schema is partly undocumented.

**Decisions:** Ask required fields, accepted types, affected paths, invocation, failure output, and location. Present the concrete script plan and obtain agreement.

**Interview:** Settle affected configuration paths before asking about their undocumented required fields, then ask field-specific type and failure-case questions after those fields are known. Discover existing script locations and invocation conventions yourself.

**Output:** Implement the agreed validator in the project's script location, exercise valid and invalid isolated fixtures, and add the exact conditional command to AGENTS.md. Do not invent the schema or use an always-successful placeholder script.

## Case 3: Environment-dependent manual verification

**Input:** "Before packaging the desktop app, run automated checks and complete a save/reopen GUI test."

**Facts:** Automated commands exist; the required desktop environment is unavailable here.

**Decisions:** Set the manual steps and expected reopened state, who provides evidence, and whether packaging must wait. User chooses to block packaging until manual verification passes.

**Interview:** Report the unavailable environment as an observed fact and recommend a manual verification gate. If a later check reveals another missing prerequisite, reopen only that branch using the same question-and-recommendation format.

**Output:** Compact packaging route in AGENTS.md and, if lengthy, a linked `docs/agents/verification.md` procedure. Report automated evidence and GUI verification as not run; do not package or claim the GUI check passed. The agreed instructions can be delivered without claiming end-to-end execution.
