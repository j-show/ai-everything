# Ingest and Artifact Lock

Load this when Step 0–1 parsing is ambiguous.

## Deliverable path signals

Treat as a locked primary path when `{{input}}` contains any of:

- Explicit path with extension: `docs/specs/foo.md`, `./designs/briefs/bar.md`
- Phrases: `产物`, `输出到`, `写到`, `write to`, `deliverable`, `output file`, `save as`
- "update X" / "刷新 X" when X is a concrete file the user wants as the session result

Do **not** invent paths from related docs. Example: reading `docs/prd/orders.md` does **not** imply writing `docs/specs/orders.md` until the user confirms.

## Default path proposals (ask, do not assume)

When asking once in Step 1, propose one default based on intent:

| Intent signal                         | Proposed default              |
| ------------------------------------- | ----------------------------- |
| Spec / 技术方案 / design doc          | `docs/specs/{slug}.md`        |
| Product brief / 需求澄清稿            | `docs/briefs/{slug}.md`       |
| Agent context only (explicit)         | `CONTEXT.md` (root or mapped) |
| Single hard decision (explicit ADR)   | `docs/adr/{NNNN}-{slug}.md`   |

`{slug}` = short hyphenated topic from the requirement title.

## Requirement sources

Priority when merging:

1. Explicit user decisions in this chat (after grilling answers)
2. Named source docs the user pointed at
3. Existing `CONTEXT.md` / ADRs (vocabulary and prior decisions)
4. Code behavior (facts for grilling; not product intent by itself)

Surface conflicts as grilling questions; do not silently pick a side.

## Multi-doc scope

Read docs the user named. Follow one level of clearly referenced sibling docs only when needed to understand a term or decision. Do not crawl the whole repo.
