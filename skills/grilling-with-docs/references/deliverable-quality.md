# Deliverable Quality

Load this in Step 5 when choosing structure for the primary artifact.

## Spec / design doc (`docs/specs/…` or similar)

Include only settled content:

1. **Context** — problem and why now (2–4 sentences)
2. **Goals / non-goals** — explicit lists
3. **Canonical terms** — point to `CONTEXT.md` entries; do not redefine at length
4. **Decisions** — what was chosen; link ADR paths when they exist
5. **Behavior** — scenarios and boundaries that were grilled
6. **Open items** — only items the user deferred; never silent assumptions

## Brief (`docs/briefs/…`)

Shorter than a spec: audience, problem, proposed approach, constraints, next step. No implementation checklist unless grilled.

## CONTEXT.md as primary deliverable

Only when Step 1 locked `CONTEXT.md` (or a mapped context file). Follow domain-modeling format strictly: glossary only, `_Avoid_` synonyms, no implementation dump.

## ADR as primary deliverable

Only when Step 1 locked an ADR path **and** all three domain-modeling gates passed. Prefer the short ADR template (1–3 sentences) unless optional sections add real value.

## Hard rules

- No `TODO` / `TBD` for questions already answered in grilling
- No copying the full interview transcript into the file
- Prefer links to ADRs / CONTEXT terms over restating them
- Match the repo's existing doc tone if sibling files exist
