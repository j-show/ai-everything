# Delivery Checklist

Load during Step 5. Run after implementation; invoke **`ui-ux-pro-max`** for its full pre-delivery checklist in parallel.

## ui-ux-pro-max pass (CRITICAL + HIGH)

Mark pass / fail / fixed:

| Check                                              | Pass? |
| -------------------------------------------------- | ----- |
| Color contrast AA on primary text and CTAs         |       |
| Focus visible on all interactive elements          |       |
| Touch targets ≥44pt; spacing between targets       |       |
| Mobile-first layout at 375px; no horizontal scroll |       |
| `prefers-reduced-motion` respected                 |       |
| Semantic form labels; errors actionable            |       |
| No emoji structural icons                          |       |
| Loading/empty/error states present where needed    |       |

Optional deep pass (when ui-ux-pro-max skill recommends):

```text
--domain ux "animation accessibility z-index loading"
```

Test landscape orientation and largest text scaling if the stack supports it.

## frontend-design pass — remove one accessory

1. List decorative elements (extra dividers, redundant badges, secondary gradients, duplicate CTAs, ornamental animation).
2. Choose **one** that does not serve the brief's single job.
3. Remove or simplify it; note what was cut in the delivery summary.

Chanel rule: if nothing obvious to remove, re-check Step 2 signature — surrounding noise may have crept back in.

## Delivery summary (user-facing)

```markdown
## Delivered

- Spec SSOT: `designs/specs/{slug}.md`
- Previews: `designs/previews/{slug}-*.png` (+ `designs/images/*.md`)
- Signature element: {name}
- Removed accessory: {what and why}
- Checklist: {N}/{total} passed; {list fixes applied}
```

Do not claim complete while any CRITICAL row is fail without fix.
