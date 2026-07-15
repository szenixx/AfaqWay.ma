# AfaqWay Design System

AfaqWay is a digital platform that walks an international student through the entire journey of studying abroad — from first decision to enrolled and legally settled — as a guided, step-by-step system instead of a costly agency. The product handles documents, deadlines, applications, visas, and university programs.

**Sources provided:**
- `uploads/design-system.md` — the complete theme & design system spec (titled "Vartai" internally; the company is AfaqWay). This file is the single ground truth for how anything looks. It covers colour, type, icons, top-bar chrome, flags, and reusable components — NOT page layout, which arrives with each request.
- `uploads/photo_2026-07-14_17-51-24.jpg` — The user adopted this double-chevron mark as the AfaqWay logo, recoloured to the system palette (indigo tile, white chevrons). Recreated as SVG in `assets/brand/` — primary, tint, ink, and glyph variants. Lockup: mark + "AfaqWay" in Poppins 700.

## CONTENT FUNDAMENTALS

- **Voice:** calm, credible, a little formal — a platform handling passports and admissions, not a consumer toy. Hints explain *what happens next*, never what the system did internally.
- **Canonical status vocabulary (closed set, use verbatim):** `Not started · Applied · Under review · Needs changes · Approved`. Never invent synonyms ("Pending", "In progress" are forbidden).
- **Buttons:** single active verbs — *Continue, Upload, Save draft, Withdraw*.
- **Casing:** sentence case everywhere, EXCEPT pills and eyebrows which are uppercase with letter-spacing.
- **Person:** speaks to the student as "you" ("Tell us about you"). Optional-field markers appended to labels in faint ink: "(exactly as written in your passport)".
- **Emoji:** never in copy. The one sanctioned use is emoji flag glyphs inside native `<select>` options where custom SVGs can't render.

## VISUAL FOUNDATIONS

- **DNA: document dossier, not an app.** Cool official-paper background `--paper #ECEFF3`, white cards, hairline borders. Calm and formal.
- **Colour:** one accent — indigo `--indigo-600 #2B4C9B` — marks the active/primary thing ONLY (primary button, links, focus, selected). Status is a strict five-colour traffic light (grey/indigo/amber/red/green), each with a text + tint + line trio; text on a tint always uses the family's dark tone. Closed palette; flags are the sole exception.
- **Type:** Poppins only, weights 400/500/600/700. Hierarchy by size/weight, no font pairing. Page title 27/34 700 · section 18/24 600 · body 15/24 400 · label 13/20 500 · eyebrow 11.5 caps 600 indigo · pill 10.5 caps 600.
- **Backgrounds:** flat `--paper`; no gradients, no textures, no imagery system, no illustrations provided.
- **Cards:** `--card` white, 1px `--line` border, radius 16px, whisper shadow `0 2px 10px rgba(23,35,58,.04)`, padding 24–28px. Never nest cards — use a `--line-soft` divider.
- **Borders & dividers:** 1px `--line #DCE2EA` default, `--line-soft #E7ECF1` inner.
- **Radius scale (closed):** 8 / 12 / 16 / 999. Spacing: 4px base → 4·8·12·16·20·24·32·40.
- **Motion:** 120–200ms `cubic-bezier(.4,0,.2,1)`; hover = `--indigo-100` wash or brightness(1.05) 120ms; skeleton shimmer 1.4s. Respect `prefers-reduced-motion`. No bounces.
- **States:** focus-visible = 2.5px indigo outline, 2px offset, on every interactive element. Pressed primary → `--indigo-700`. Disabled → 40% opacity.
- **Transparency/blur:** none. Top bar is flat, 60px, 1px bottom border, no shadow.

## ICONOGRAPHY

- **Outline only**, `stroke-width:1.75`, rounded caps/joins, no fills except white glyphs on filled surfaces. 20×20 native grid; re-draw at 1.5px stroke below 16px. Sizes: 14 inline · 16 rows · 18 buttons · 20 top bar · 28–32 status badge housing.
- **Circle-housed status icons** are the platform's one icon signature: every status glyph lives in the same circular badge (tint bg, 1.5px status-line border); only the interior glyph changes. Never show a bare unhoused glyph for a state.
- All icons are project SVGs in `assets/icons/` (copied verbatim from the spec) — no icon font, no CDN set, no emoji icons. Colour via `currentColor`: `--ink-soft` at rest, `--indigo-600` when active marker, status colour for status icons.
- **Flags:** real flag assets at 42×30 (r5) / 24×18 (r3), `1px solid rgba(0,0,0,.08)`; emoji glyph only inside native `<option>`. Coming-soon → grayscale(.55) + .72 opacity. Never recoloured. No flag assets were provided — the `Flag` component uses emoji + striped fallback until assets arrive.

## Index

- `styles.css` → `tokens/{colors,typography,spacing,base}.css` — all tokens + `.card`, `.pill-*`, `.status-badge`, `input.af` base classes.
- `assets/icons/*.svg` — 19 outline icons (5 status, 9 domain, 5 top-bar).
- `assets/brand/*.svg` — logo mark (primary / tint / ink / glyph).
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/buttons/` Button · `components/status/` StatusBadge, StatusPill · `components/forms/` Field · `components/icons/` Icon · `components/surfaces/` Card · `components/flags/` Flag · `components/chrome/` TopBar.
- `ui_kits/platform/` — sample profile-form screen (illustrative; the spec defines no page layouts).
- `SKILL.md` — agent skill entry point.

**Intentional additions:** `Icon` (name-keyed wrapper over the spec's SVG library — needed so components share one glyph source). No other components beyond the spec were added.
