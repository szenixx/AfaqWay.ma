# CLAUDE.md — AfaqWay Design System rules

MANDATORY before creating or styling ANY page, screen, mock, or component:

## 1. Read first, build second
1. Read `readme.md` (brand context, content + visual foundations, index).
2. Read `uploads/design-system.md` — the single ground truth for how anything looks.
3. Check `tokens/` (`colors.css`, `typography.css`, `spacing.css`, `base.css`) — every colour, font, radius, and spacing value MUST come from these custom properties. Link `styles.css` in every page.
4. Check `components/` before writing any UI element — if a primitive exists (Button, Field, Card, StatusBadge, StatusPill, Icon, Flag, TopBar), use it; never re-implement or restyle it.
5. Check `assets/icons/` before drawing any icon — use ONLY these 19 glyphs (outline, 1.75px stroke). Never hand-draw new SVGs, never use emoji or another icon set.
6. Look at `ui_kits/platform/index.html` for how pieces compose on a page.

## 2. Hard rules — never violate
- Never introduce a new colour, font, or component style. Poppins only; indigo `--indigo-600` is the sole accent.
- Status is a closed set — exact words `Not started · Applied · Under review · Needs changes · Approved`, each with its text/tint/line trio and circle-housed icon. No synonyms ("Pending", "In progress" are forbidden), no other colour ever represents state.
- Radii only from `--radius-sm/md/lg/pill` (8/12/16/999). Spacing only from the 4px scale (4·8·12·16·20·24·32·40).
- Background `--paper`, white `--card` surfaces, 1px `--line` borders, whisper shadow. No gradients, no textures, no blur. Never nest cards — use a `--line-soft` divider.
- Flags are the ONE palette exception; never recolour them.
- Buttons: single active verbs. Sentence case everywhere except pills/eyebrows (uppercase + letter-spacing).
- Focus-visible ring (2.5px indigo, 2px offset) on every interactive element. Motion 120–200ms `cubic-bezier(.4,0,.2,1)`, respect `prefers-reduced-motion`.

## 3. Before delivering, run the spec's checklist (§15 of `uploads/design-system.md`)
Only palette colours · canonical status words + matching icon/colour trio · circle-housed status icons · outline 1.75px icons · flat 60px top bar · radii from the scale · visible focus rings.
