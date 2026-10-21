# Deliverable Quality

Load this in Step 5 for an existing target or when choosing the primary artifact's structure.

## Existing documents

- Default to a scoped update. Apply the structures below only where they fit the agreed changes; do not rebuild an existing document from a template and drop unrelated sections.
- State which sections change and which remain. Preserve unrelated prose, metadata, links, examples, and user edits; do not tidy them as a side effect.
- Explicit full-replacement authorization for a named ordinary document permits replacing its old contents within the agreed new scope. Do not ask again for an already clear authorization; glossary updates still follow the root merge rule.
- Re-read just before editing. Merge unrelated intervening edits; if they conflict with the agreed content, describe the conflict and wait for its resolution. If a target appeared after being planned as new, treat it as existing and preserve its content unless replacement is explicitly authorized.
- Verify the resulting diff and final contents. On an identical repeat, make no change rather than reformatting or adding duplicate sections.

## Spec / design doc (`docs/specs/…` or similar)

Include only settled content:

1. **Context** — problem and why now (2–4 sentences)
2. **Goals / non-goals** — explicit lists
3. **Canonical terms** — link to the project root `GLOSSARY.md` entries using paths relative to the deliverable; do not redefine at length
4. **Decisions** — what was chosen; link ADR paths when they exist
5. **Behavior** — scenarios and boundaries that were grilled
6. **Open items** — only items the user deferred; never silent assumptions

## Brief (`docs/briefs/…`)

Shorter than a spec: audience, problem, proposed approach, constraints, next step. No implementation checklist unless grilled.

## GLOSSARY.md as primary deliverable

Only when Step 1 locked `<project-root>/GLOSSARY.md`. Write in Step 5 after shared understanding is confirmed; update the existing file in place and preserve unrelated entries. Create it only if absent and there are settled terms. Follow domain-modeling format strictly: glossary only, `_Avoid_` synonyms, no implementation dump or second context file.

## ADR as primary deliverable

Only when Step 1 locked an ADR path **and** all three domain-modeling gates passed. Prefer the short ADR template (1–3 sentences) unless optional sections add real value.

## Hard rules

- No `TODO` / `TBD` for questions already answered in grilling
- No copying the full interview transcript into the file
- Prefer links to ADRs / root GLOSSARY terms over restating them
- Match the repo's existing doc tone if sibling files exist
