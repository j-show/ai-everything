# Implementation Guardrails (ui-ux-pro-max)

Load during Step 4. **Visual choices come from the Revised Direction**; these rules constrain **how** they are built.

Invoke **`ui-ux-pro-max`** for stack-specific details. This reference is the minimum bar.

## Spacing & layout

- 4pt/8dp spacing scale; consistent section rhythm
- Mobile-first breakpoints (e.g. 375 / 768 / 1024 / 1440)
- Body text ≥16px on mobile; line length ~35–60 chars mobile, ~60–75 desktop
- No horizontal scroll on small viewports; use `min-h-dvh` over `100vh` where relevant
- Desktop max-width consistent (e.g. max-w-6xl / 7xl); z-index scale defined

## Touch & interaction

- Touch targets ≥44×44pt (iOS) / 48×48dp (Material); ≥8px gap between targets
- Primary interactions on tap/click — not hover-only
- Loading/disabled feedback on async actions
- `cursor-pointer` on clickable web elements; visible press feedback

## Accessibility & contrast

- Text contrast ≥4.5:1 (normal), ≥3:1 large text
- Visible focus rings on interactive elements; tab order matches visual order
- Icon-only controls have accessible names
- Forms: visible labels, errors near fields, not color-only meaning
- `prefers-reduced-motion`: reduce or disable non-essential animation

## Responsive & motion

- Reserve space for async content (avoid CLS)
- Micro-interactions ~150–300ms; prefer transform/opacity over width/height animation
- At most 1–2 animated focal elements per view unless brief demands more

## Tokens & assets

- Semantic color tokens in components — not raw hex scattered in JSX/CSS
- SVG icon set (consistent stroke); no emoji as structural icons
- Dark/light pairs designed together if both ship

## Conflict resolution

When a Revised Direction color fails contrast → adjust shade/saturation or adjacent surface, **not** swap to a generic palette. Preserve signature hue family when possible.
