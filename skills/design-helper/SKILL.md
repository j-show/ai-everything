---
name: design-helper
description: "Orchestrate ui-ux-pro-max + frontend-design for distinctive UI. Writes SSOT brief to designs/specs, generates preview mockups in designs/previews with prompt docs in designs/images, then implements with a11y guardrails. Use when user asks to design, redesign, build UI, landing page, dashboard, component, design system, visual direction, typography, mockup, or prototype. Actions: design, redesign, build UI, create landing page, style guide, design preview, UI prototype. Triggers: 'design-helper', 'frontend design', 'UI design', '设计页面', '做落地页', '设计系统', '视觉方向', '去模板化', 'design brief', 'UI prototype', '设计图'. Requires installed ui-ux-pro-max and frontend-design skills."
---

# Design Helper

IRON LAW: Run the full pipeline through **installed** skills `ui-ux-pro-max` and `frontend-design` — never substitute repo paths, cached markdown, or a freestyle design pass. After Step 3, **`designs/specs/{slug}.md` is SSOT**; previews and code must follow it.

Red flags (stop and restart from Step 1):

- Reading `skills/ui-ux-pro-max/` or `skills/frontend-design/` instead of invoking installed skills
- Implementing before Step 3 user gate (Option 1)
- Writing UI without reading `designs/specs/{slug}.md` and paired preview/image docs
- Default AI palettes (warm cream + terracotta serif, near-black + acid green, broadsheet hairline columns) without subject-specific justification

## Workflow

Copy this checklist and check off items as you complete them:

```
Design Helper Progress:

- [ ] Step 1: Base design system (ui-ux-pro-max) ⚠️ REQUIRED
- [ ] Step 2: De-templating critique (frontend-design) ⚠️ REQUIRED
- [ ] Step 3: Spec, previews & user gate ⚠️ REQUIRED
- [ ] Step 4: Implement UI prototype (conditional — Option 1 only)
- [ ] Step 5: Delivery pass (conditional — Option 1 only)
```

## Step 1: Base Design System ⚠️ REQUIRED

**Input**: Treat the user's entire message as the design brief (`{{input}}`). Do not invent a different product unless the brief is empty — then ask one clarifying question (subject, audience, single page job).

1. Invoke installed skill **`ui-ux-pro-max`**. Follow its workflow for design-system generation (requirements analysis → `--design-system` or equivalent skill steps → supplemental domain searches as needed).
2. Pass the user's brief verbatim as the query context (product type, industry, audience, stack, style keywords).
3. Capture at minimum: industry/product fit, page structure, color tokens, typography pairing, interaction notes, and anti-patterns from ui-ux-pro-max.
4. Format the Step 1 output using `references/design-brief-output.md` § Base System.

⚠️ Do not write spec files, previews, or implementation code in this step.

## Step 2: De-Templating Critique ⚠️ REQUIRED

1. Invoke installed skill **`frontend-design`**. Apply its planning and self-critique lens to the Step 1 base system — not a second unrelated design.
2. Load `references/detemplating-critique.md` and answer every question against the Step 1 output.
3. Revise weak areas (palette, type, layout, signature element, copy tone) until the plan is **subject-grounded** with **one defensible aesthetic risk** and **one memory-point signature**.
4. Merge revisions into the design brief (`references/design-brief-output.md` § Revised Direction).

⚠️ If the plan still matches a generic AI default cluster (see reference), revise again before Step 3.

## Step 3: Spec, Previews & User Gate ⚠️ REQUIRED

Complete **3a → 3b → 3c** in order, then **stop and wait for user choice**.

### 3a — Write formal spec (SSOT)

Load `references/spec-artifacts.md` and `references/design-brief-output.md`.

1. Choose `{slug}` (kebab-case from project/page name).
2. Create `designs/specs/` if missing.
3. Write **`designs/specs/{slug}.md`** — merged Step 1 + Step 2 content per reference format (tokens, layout, signature, detemplating Q&A).
4. Add complex handoff notes to `designs/specs/{slug}-implementation.md` when needed.

All later design work **prioritizes this spec**.

### 3b — Generate design previews

Load `references/design-preview.md`.

1. For each view (default: desktop + mobile), write **`designs/images/{slug}-{view}.md`** (layout, modules, visual details, image prompt).
2. Generate preview images into **`designs/previews/{slug}-{view}.png`**:
   - **Codex** → use **`Image Gen`** capability
   - **Other harnesses** → try **`image-gen` MCP**; if unavailable → `GenerateImage` or model multimodal generation
3. Update § Preview index in `designs/specs/{slug}.md`.

### 3c — User gate ⚠️ REQUIRED

Present spec path, preview paths, and summary. Ask user to pick **one**:

| Option | User intent | Next action |
| ------ | ----------- | ----------- |
| **1** | 按这个方向实现 UI 原型 | → Step 4 (read spec + previews as reference) |
| **2** | 重新调整样式 | Delete this round's `designs/specs/{slug}*` and paired `designs/previews/{slug}-*`, `designs/images/{slug}-*.md` → **Step 1** |
| **3** | 调整设计图细节 | Apply user feedback; sync-update matching files in `designs/images/` & `designs/previews/` per `design-preview.md` → **return to 3c** |

⚠️ Do **not** start Step 4 until user selects **Option 1**.

## Step 4: Implement UI Prototype (conditional)

Run only after Step 3 **Option 1**.

**Read first:** `designs/specs/{slug}.md`, `designs/specs/{slug}-implementation.md` (if any), and paired `designs/images/*.md` / `designs/previews/*.png`.

**Authority split** (non-negotiable):

| Layer                  | Owner             | Apply                                                                                                            |
| ---------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Visual direction       | `frontend-design` | Palette, typography personality, layout concept, signature element, motion intent, copy voice — **from spec**    |
| Engineering guardrails | `ui-ux-pro-max`   | Spacing scale, touch targets, responsive/mobile-first, contrast, keyboard focus, reduced motion, semantic tokens |

Load `references/implementation-guardrails.md` during coding.

Rules:

- Derive every color and type choice from **`designs/specs/{slug}.md`** — not ad-hoc defaults.
- When visual and guardrail conflict, adjust execution while preserving the spec's signature.
- Match stack from spec; invoke ui-ux-pro-max stack guidance when the skill provides it.
- Watch CSS specificity collisions (e.g., `.section` vs element selectors fighting on spacing).

## Step 5: Delivery Pass (conditional)

Run only after Step 4.

1. Invoke **`ui-ux-pro-max`** for pre-delivery checklist. Load `references/delivery-checklist.md` and mark pass/fail.
2. Invoke **`frontend-design`** restraint pass ("remove one accessory") — must not contradict spec signature unless user approved in chat.
3. Fix failed checklist items before claiming done.

## Anti-Patterns

- Treating `design-helper` as a standalone design encyclopedia — it orchestrates dependency skills
- Skipping spec write or previews at Step 3
- Option 3: updating PNG without syncing `designs/images/{same-name}.md`
- Option 2: leaving stale previews/images after deleting spec
- Implementing before Option 1
- Emoji as structural icons; hover-only interactions; placeholder-only form labels

## Pre-Delivery Checklist

- [ ] Both dependency skills invoked via Skill tool (not repo paths)
- [ ] `designs/specs/{slug}.md` written at Step 3a; SSOT honored in Step 4–5
- [ ] Previews paired with `designs/images/*.md`; index table in spec
- [ ] Step 3 user gate completed; Step 4 only after Option 1
- [ ] Step 2 detemplating documented in spec
- [ ] Step 5 checklist passed; one accessory removed
- [ ] No generic default cluster unless user's brief explicitly requested it
