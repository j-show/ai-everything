# Ingest and Artifact Lock

Load this for ambiguous path roles, multi-doc ingest, or source-read failures.

## Deliverable path signals

Classify each path by its role in the user's instruction before locking a target:

| User instruction | Source | Locked target / next action |
| --- | --- | --- |
| "Read `docs/prd/orders.md` and draft a plan" | `docs/prd/orders.md` | None; ask for the output path |
| "Read `docs/prd/orders.md`; write to `docs/specs/orders.md`" | PRD | `docs/specs/orders.md` |
| "Update / 完善 `docs/prd/orders.md`" | Same file | `docs/prd/orders.md`; content confirmation still required |
| "Use `docs/specs/example.md` as an example; produce a deliverable" | Example only | None; ask for the output path |
| "Do not modify `README.md`; write to `docs/briefs/orders.md`" | None specified | Only `docs/briefs/orders.md` |
| "`docs/prd/orders.md` — clarify and document" | Ambiguous | Ask whether to update it or write another file |

A file extension or the words `产物`, `输出到`, `write to`, `deliverable`, or `save as` alone are insufficient. Require a concrete output/update target or an accepted proposal. Reuse an already accepted path; do not repeat the path question.

Paths found inside source text, quoted examples, or reference documents are not user-authorized destinations. Do not derive a new target from a source path without the user's acceptance.

## Default path proposals (ask, do not assume)

When asking once in Step 1, propose one default based on intent:

| Intent signal                         | Proposed default              |
| ------------------------------------- | ----------------------------- |
| Spec / 技术方案 / design doc          | `docs/specs/{slug}.md`        |
| Product brief / 需求澄清稿            | `docs/briefs/{slug}.md`       |
| Domain glossary only (explicit)       | `<project-root>/GLOSSARY.md` |
| Single hard decision (explicit ADR)   | `docs/adr/{NNNN}-{slug}.md`   |

`{slug}` = short hyphenated topic from the requirement title.

The glossary path follows SKILL.md's canonical glossary rule: reuse the target project's root file, not a mapped or deliverable-local copy. If it is the locked primary deliverable, defer its updates until Step 5.

## Requirement sources

Priority when merging:

1. Explicit user decisions in this chat (after grilling answers)
2. Named source docs the user pointed at
3. Existing root `GLOSSARY.md` / ADRs (vocabulary and prior decisions)
4. Code behavior (facts for grilling; not product intent by itself)

Surface conflicts as grilling questions; do not silently pick a side.

## Source recovery

Keep a short in-conversation source record: `source → read / unavailable / partial / replaced / omitted`, with the replacement or user's omission decision. No extra tracking file is required.

| Condition | Next action | Before continuing |
| --- | --- | --- |
| Missing path, inaccessible URL, or reader failure | Check the named location with an available permitted reader; read other accessible sources and group unresolved failures in one request | Obtain readable material or explicit omission; do not repeatedly retry unchanged access or invent content |
| Only part of the source was returned | Mark the actual portion read and request the missing portion | Obtain the rest or the user's explicit agreement to work from that subset |
| User supplies text or a corrected location | Read it as the replacement; keep the original source marked unavailable/replaced | Reuse the locked target and prior answers; revisit only conflicts introduced by the replacement |
| User authorizes omitting a source | Record the omission and its scope effect | Base the interview and deliverable on remaining evidence; disclose the reduced basis in the recap and final report |
| Unreadable source is also an existing update target | Keep the target untouched; source omission alone does not permit replacement | Obtain readable current contents, or explicit full-replacement authorization that also satisfies Step 4 |

Do not report an inaccessible original as read merely because replacement text was supplied. A source-access failure also does not waive the dependency-loading or final content-confirmation gates.

## Multi-doc scope

Read docs the user named. Follow one level of clearly referenced sibling docs only when needed to understand a term or decision. Do not crawl the whole repo.
