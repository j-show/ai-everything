# Spec Artifacts (`designs/specs`)

Formal design brief — **single source of truth (SSOT)** for all later steps (previews, implementation, delivery).

## Directory

```text
designs/specs/
  {slug}.md              # merged formal brief (Step 1 + Step 2 + detemplating Q&A)
  {slug}-implementation.md   # optional — component list, CTA strings, non-goals (when page is complex)
```

**`{slug}`** — kebab-case from project/page name (e.g. `serenity-spa-home`, `dashboard-analytics`).

## When to write

At **Step 3 completion** (before user gate), after Step 2 Revised Direction is final for this iteration.

## `{slug}.md` required sections

Load `design-brief-output.md` for field definitions. The spec file must include:

1. Header (user brief summary, stack, slug, iteration timestamp)
2. § Base System (condensed from Step 1)
3. § Revised Direction (full Step 2 output + detemplating answers)
4. § Token table (final)
5. § Layout concept (+ wireframe if used)
6. § Copy tone
7. § Preview index — table linking each preview filename → `designs/images/{name}.md`

## SSOT rule

After Step 3 writes specs:

- Previews, image prompt docs, and Step 4 code **must** match `designs/specs/{slug}.md`
- On conflict, **spec wins** unless user explicitly overrides in chat

## Option 2 — delete brief artifacts

When user chooses **重新调整样式**, delete **all spec files for this slug** created in the current Step 3 round:

- `designs/specs/{slug}.md`
- `designs/specs/{slug}-implementation.md` (if exists)

Then return to **Step 1** (new style pass). Do not proceed to Step 4.

Also delete paired preview artifacts for the same slug (stale otherwise):

- `designs/previews/{slug}-*`
- `designs/images/{slug}-*.md`

## Option 3 — detail adjustments

When user chooses **调整设计图细节**:

- Update affected rows in § Preview index inside `{slug}.md` if scope changed
- Regenerate or edit paired files under `designs/previews/` and `designs/images/` (see `design-preview.md`)
- Do **not** delete `{slug}.md` unless user asks to restart style (Option 2)
