# AfaqWay — User Workspace Design System

**Status:** current production implementation
**Scope:** the student-facing User Workspace only. The `/admin` console is a
separate design language (`.adm-*`, `.dash-*`) and is deliberately excluded.
**Extracted from:** `src/app/ds.css`, `src/app/globals.css`, `src/components/ds/`,
`src/components/student/`, `src/app/dashboard/`, `public/`.

---

## Read this first — three facts that change how you use this document

**1. There is no Tailwind.** This project has no `tailwind.config`, no
`postcss.config`, and no Tailwind dependency. Every "Tailwind token" column you
might expect is therefore absent, and that is a deliberate decision, not an
omission: installing a Tailwind-first component library would have initialised a
second styling system beside `ds.css`. Styling is **CSS custom properties +
semantic class names**, with inline `style` used only for one-off layout.

**2. There are two token files, and they are not peers.**

| File | Role | Rule |
| --- | --- | --- |
| `src/app/ds.css` | The **token contract**. Colours, type, spacing, radii, controls. | Copied verbatim from `design/AfaqWay-Design-System/tokens/`. Never invent a value here. |
| `src/app/globals.css` | **Component styles** built from those tokens. | May add classes; must not add raw colour values. |

`globals.css` imports `ds.css`. A screen that needs a colour not in `ds.css` is a
screen that needs the design system updated first.

**3. Some numbers below are literal, not tokenised.** Where the code hard-codes a
value (`#E8F7EE`, `20px` radius on chat bubbles) this document records the literal
and flags it. Do not treat a flagged literal as a licence to add more.

---

# 1. Design Philosophy

## Brand personality

Calm, credible, and quietly institutional. The product handles passports,
diplomas and residence permits for eighteen-year-olds moving country alone. The
interface is built to feel like a competent adult is on the other side of it —
never playful, never alarming, never salesy.

## Visual direction

**Floating paper on a soft field.** The page is a pale blue-grey gradient with two
enormous blurred indigo blobs. Content sits on it as white cards with 28px radii
and diffuse shadows. Hierarchy comes from **elevation and whitespace**, not from
borders and rules.

## UX principles

1. **The word always appears.** Status is never colour alone — every `Status`
   renders its label, so meaning survives colour blindness and greyscale.
2. **One control set.** One input, one dropdown, one toggle, one checkbox, one
   button, platform-wide. A second variant is a bug.
3. **Never invent a fact.** If the platform has no source for a number, the UI
   says "Not tracked yet" rather than showing a plausible figure.
4. **Placeholders die when real data arrives.** When a real source lands, the
   demo constant is deleted, not left exported.
5. **Motion explains, never decorates.** Every animation maps to a state change,
   and all of it is disabled under `prefers-reduced-motion`.
6. **No dead ends.** Every button navigates somewhere real.

## Consistency rules

- Colour comes from `ds.css`. No literals in new code.
- Cards have five roles (§16). Metric tiles are always `StatCard`.
- Status uses `Status`; labels use `Pill`. Neither is hand-rolled.
- Every form field carries a leading icon from `fieldIcon()`.
- Deliberate exceptions, documented and not to be "fixed": the **chat composer**
  (`.af-composer` — the capsule *is* the field) and `.chat-zoom` (workspace chat
  renders at 110%).

---

# 2. Brand Identity

## Logo

`src/components/ds/BrandLogo.tsx` — `variant`, `size`, `className`, `alt`.

| Asset | File | Use |
| --- | --- | --- |
| Glyph | `/assets/brand/logo-glyph.svg` (+ `.png`) | Compact mark, sidebar collapsed, favicons |
| Mark | `/assets/brand/logo-mark.svg` (+ `.png`) | Full lockup |
| Mark, ink | `/assets/brand/logo-mark-ink.svg` | On light surfaces |
| Mark, tint | `/assets/brand/logo-mark-tint.svg` | On indigo / dark surfaces |

**Sizing:** `size` is a pixel number, default `32`. Sidebar brand row uses the
glyph at 32; collapsed rail keeps the glyph and drops the wordmark.

**Safe spacing:** minimum clear space = the glyph's own cap height on all sides.
Never place the logo on a busy photo — use the ink or tint variant on a flat
surface.

**Never:** recolour, stretch, rotate, add effects, or reconstruct the lockup from
the glyph plus type.

## Favicon

Emitted by the Next App Router from filenames beside `layout.tsx` — `favicon.ico`
(16/32/48), `icon.png` (512), `apple-icon.png` (180). There is deliberately **no
`icons` field in `metadata`**; declaring both would duplicate the tags.

## Icon style

**Lucide React**, outline, `strokeWidth` default. Sizes are contextual (§9).
Icons take `currentColor` or an explicit token.

## Illustration style

Flat vector, generous white space, on-palette (indigo / green / amber), no text
inside the artwork, rounded geometric forms.

- `/illustrations/empty-documents.png`, `/illustrations/empty-pinned.png`
- `/journey/trp-approved.webp` — the residence-permit celebration
- `/document/{1,2,3}.png` — sidebar carousel

**Generation:** per project policy, illustrations are produced with Higgsfield AI
and committed as static assets. Convert to `.webp` before committing.

## Image style

Photography is used only for place (`/lithuania/lithuania-{1..7}.webp`) and
ambience (`/hero-ambient.webp`, `/europe-map.webp`). Always `.webp`, always
`border-radius: 12–14px`, always `loading="lazy"` below the fold.

---

# 3. Colour System

Every value below is live in `src/app/ds.css`. RGB is given for the base palette.

## Surfaces

| Token | HEX | RGB | Use |
| --- | --- | --- | --- |
| `--paper` | `#ECEFF3` | 236 239 243 | Page base |
| `--card` | `#FFFFFF` | 255 255 255 | Every card, input, menu, bubble |
| `--subtle` | `#F3F5F9` | 243 245 249 | Recessed rows, disabled fields, code blocks |
| `--divider` | `#F1F5F9` | 241 245 249 | In-card row separation |

Aliases: `--surface-page`, `--surface-card`, `--surface-input`.

## Text

| Token | HEX | RGB | Use |
| --- | --- | --- | --- |
| `--ink` | `#17233A` | 23 35 58 | Headings, primary body, values |
| `--ink-soft` | `#5A6B85` | 90 107 133 | Secondary body, descriptions |
| `--ink-faint` | `#8695AB` | 134 149 171 | Labels, placeholders, metadata |

Aliases: `--text-body`, `--text-secondary`, `--text-hint`.

## Borders

| Token | HEX | Use |
| --- | --- | --- |
| `--line` | `#DCE2EA` | Default border |
| `--line-soft` | `#E7ECF1` | Dividers, internal separators |
| `--card-border` | `1px solid rgba(23,35,58,.05)` | The floating-card hairline |

Aliases: `--border-default`, `--border-divider`.

## Brand — Indigo (primary)

| Token | HEX | RGB | Use |
| --- | --- | --- | --- |
| `--indigo-700` | `#202CA9` | 15 37 111 | **Pressed** |
| `--indigo-600` | `#2E3BC7` | 22 46 140 | **Primary / default** — buttons, links, active icons |
| `--indigo-500` | `#424ED4` | 18 48 166 | **Hover** |
| `--indigo-100` | `#E1E3F9` | 232 238 255 | Focus glow, ghost hover |
| `--indigo-50` | `#F5F5FD` | 246 248 255 | Palest surface |
| `--indigo-tint` | `#E1E3F9` | 232 238 255 | Pill / callout background |
| `--indigo-line` | `#B3B8ED` | 196 206 238 | Pill / callout border, hover border |
| `--indigo-text` | `#2E3BC7` | 22 46 140 | Text on indigo tint |

Aliases: `--accent`, `--accent-hover`, `--accent-pressed`, `--accent-tint`.

## Status

Each family is a **text colour**, a **tint**, and a **line**.

| Family | Text | Tint | Line | Meaning |
| --- | --- | --- | --- | --- |
| Success | `--green` `#256B49` | `--green-tint` `#E3F0E9` | `--green-line` `#9CCBB2` | Completed, approved, paid, online |
| Warning | `--amber` `#8A5A0C` | `--amber-tint` `#FBF0DA` | `--amber-line` `#E7C583` | Pending, waiting, away |
| Danger | `--red` `#B23B27` | `--red-tint` `#FBE7E2` | `--red-line` `#EDB3A6` | Rejected, failed, destructive |
| Info | `--indigo-text` `#2E3BC7` | `--indigo-tint` | `--indigo-line` | Processing, submitted, refunded |
| Neutral | `--grey` `#8695AB` | `--grey-tint` `#F1F4F7` | `--grey-line` `#DCE2EA` | Draft, cancelled, offline |

### Softened variants — graphics only

| Token | HEX | Use |
| --- | --- | --- |
| `--green-soft` | `#3F8C63` | Secondary icons, sparkline strokes |
| `--amber-soft` | `#A8741B` | Secondary icons, sparkline strokes |
| `--red-soft` | `#C25A44` | Secondary icons, sparkline strokes |

> **Contrast rule.** The soft variants clear **3.6:1** — the AA threshold for
> *graphics and UI components*. They are **not** for text. Text uses the darker
> values, which clear **5.3:1**.

## Interaction

| State | Value |
| --- | --- |
| Hover (primary) | `--indigo-500` |
| Hover (border) | `--indigo-line` |
| Hover (ghost bg) | `--indigo-100` |
| Pressed | `--indigo-700`; buttons also `transform: scale(.97)` |
| Focus ring | `--focus-ring` `rgba(46, 59, 199,.25)`; fields use `0 0 0 3px var(--indigo-100)` |
| Focus visible | `2.5px solid var(--indigo-600)`, `outline-offset: 2px` |
| Disabled | `background: var(--subtle)`, `color: var(--ink-faint)`, `opacity: .7` (controls) / `.45` (toggle, checkbox) |
| Invalid | border `--red-line`; focus ring `0 0 0 3px var(--red-tint)` |

## Overlays and shadows

| Purpose | Value |
| --- | --- |
| Modal scrim | `rgba(23,35,58,.42)` + `backdrop-filter: blur(6px)` |
| Celebration scrim | `rgba(23,35,58,.55)` + `blur(6px)` |
| Shadow ink | `rgba(23,35,58,…)` — the single shadow hue |
| Brand shadow | `rgba(46, 59, 199,…)` — hover lifts on indigo elements |

## Workspace background gradient

```css
.sw-root { background: linear-gradient(135deg, #E7ECF7 0%, #EDF1F9 52%, #E8EEF9 100%); }
```
Plus two fixed blurred blobs: `rgba(46, 59, 199,.10)` top-left, `rgba(61,99,180,.08)`
bottom-right, both `filter: blur(64px)`, `z-index: 0`.

> ⚠️ **Flagged literals.** `#E8F7EE` / `#1E7A4E` (completed step icon),
> `#EBEEF4` / `#E3E8F0` (neutral button hover/press), `#C04834` / `#9E3322`
> (destructive hover/press), and the four gradient stops above are hard-coded.
> Tokenise them before reuse; do not add more.

## Chart colours

No charting library. Data visualisation is limited to `ContributionGraph`
(indigo ramp), `ProgressBar` / `ProgressLine`, and inline SVG sparklines using
the `-soft` triplet. **If you add charts, define a categorical palette here
first.**

---

# 4. Typography

## Family

```css
--font-sans: 'Poppins', system-ui, sans-serif;
```
**Poppins**, loaded from Google Fonts at the top of `ds.css`, weights
**400, 500, 600, 700** only. `display=swap`. No second family anywhere.

## Composite tokens

Declared as full `font` shorthand — `weight size/line-height family`.

| Token | Value | Use |
| --- | --- | --- |
| `--text-page-title` | `700 27px/34px` | Page H1 |
| `--text-section-title` | `600 18px/24px` | Section H2 |
| `--text-body-md` | `400 15px/24px` | Body copy |
| `--text-label` | `500 13px/20px` | Field and row labels |
| `--text-eyebrow` | `600 11.5px/16px` | Above a title |
| `--text-section-eyebrow` | `600 10.5px/14px` | Small section kicker |
| `--text-button` | `600 14.5px/20px` | Buttons |
| `--text-pill` | `600 10.5px/1` | Pills (+ `letter-spacing: .05em`, uppercase) |
| `--text-hint-sm` | `400 12px/17px` | Helper text |
| `--text-micro` | `600 10px/14px` | Micro labels |

## Hierarchy as rendered

| Role | Style | Colour |
| --- | --- | --- |
| Page title | `700 27px/34px` | `--ink` |
| Journey title (`.jr-title`) | `700 27px/34px` | `--ink` |
| Section title | `600 18px/24px` | `--ink` |
| Learn module title | `700 16px/23px` | `--ink` |
| Card title | `700 14–14.5px/20px` | `--ink` |
| Step title | `700 14px/20px` | `--ink` |
| Body | `400 13.5–15px/20–24px` | `--ink-soft` |
| Description | `400 13px/21px` | `--ink-soft` |
| Label (uppercase) | `700 9.5–11px/14–16px`, `letter-spacing .05–.07em` | `--ink-faint` |
| Caption / meta | `400 10.5–12px/14–17px` | `--ink-faint` |
| Button | `600 13.5–15px/1–20px` | contextual |
| Field input | `400 14.5px` | `--ink` |
| Field label (`.af-label`) | `600 11.5px/16px` | `--ink-soft` |
| Field error (`.af-error`) | `500 11.5px/16px` | `--red` |
| Nav item | `600 12.5–13px` | contextual |

## Letter spacing

Only two uses, both on uppercase micro-type: `.05em` (pills) and `.06–.07em`
(section kickers, uppercase labels). Body text is never tracked.

---

# 5. Spacing System

## Scale

```css
--space-1:4px  --space-2:8px   --space-3:12px  --space-4:16px
--space-5:20px --space-6:24px  --space-8:32px  --space-10:40px
```
A 4px base. Values in between (6, 10, 14, 18) appear where an optical adjustment
is genuinely needed — prefer the scale.

## Applied

| Context | Value |
| --- | --- |
| Workspace shell padding | `18px` (desktop), `12px` (≤1023px) |
| Shell gap (sidebar ↔ main) | `18px` / `12px` |
| Sidebar padding | `14px 10px` |
| `.card` padding | `24px` |
| Dialog card padding | `20–22px` |
| Learn block gap | `11px` |
| Module list gap | `10–12px` |
| Right-panel card gap | `12–16px` |
| Section stack gap | `16px` |
| Form field → label | `6px` |
| Field → error | `5px` |

## Widths

| Constraint | Value |
| --- | --- |
| Sidebar expanded | `--sw-side: 256px` |
| Sidebar collapsed | `--sw-side-icon: 60px` |
| Mobile header height | `--sw-head: 56px` |
| Chat bubble | `min(78%, 560px)` |
| Student profile modal | `max-width: 720px`, `max-height: min(86vh, 760px)` |
| Celebration card | `max-width: 520px` |
| Prose measure | `max-width: 60ch` |
| Right panel | fixed column in `.sw-withpanel` grid |

---

# 6. Border Radius System

```css
--radius-sm:8px  --radius-md:12px  --radius-lg:16px
--radius-pill:999px  --radius-card:28px
```

| Element | Radius |
| --- | --- |
| Page cards (`.card`) | `28px` (`--radius-card`) |
| Sidebar | `26px` |
| Chat columns | `20px` |
| Modal / dialog | `24px` |
| Optional-module offer | `18px` |
| Learn callout, banner, review card | `14–16px` |
| Inputs, textareas | `16px` (`--radius-lg`) |
| **Selects, chips, pills, toggles, send button** | `999px` (`--radius-pill`) |
| Menus, popovers | `14–16px` |
| Menu items | `10px` |
| Buttons (`Button`) | `999px` |
| Journey buttons (`JrButton`) | pill |
| Checkbox | `7px` |
| Icon tiles | `9–10px` |
| Images, figures | `12–14px` |
| Avatars, presence dots, badges | `999px` |
| Code blocks | `12px` |

**Rule:** anything that reads as a *control* is a capsule. Anything that reads as
a *surface* is 12–28px.

---

# 7. Shadow System

## Elevation tokens

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-card` | `0 2px 10px rgba(23,35,58,.04)` | Flattest resting card |
| `--elev-1` | `0 6px 20px rgba(23,35,58,.04)` | Subtle lift |
| `--elev-2` | `0 10px 30px rgba(23,35,58,.05)` | **Default card** |
| `--elev-3` | `0 20px 60px rgba(23,35,58,.08)` | Prominent |
| `--elev-hover` | `0 20px 45px rgba(23,35,58,.08)` | Card hover |

## In context

| Element | Shadow |
| --- | --- |
| Sidebar | `0 20px 54px rgba(23,35,58,.12)` |
| Chat column | `0 12px 34px -24px rgba(23,35,58,.35)` |
| Dropdown menu | `0 18px 44px rgba(23,35,58,.16)` |
| Overflow menu | `0 16px 40px rgba(23,35,58,.2)` |
| Modal | `0 30px 80px rgba(23,35,58,.3)` |
| Chat bubble | `0 2px 10px rgba(23,35,58,.05)` → hover `0 6px 18px rgba(23,35,58,.09)` |
| Composer | `0 6px 18px rgba(23,35,58,.06)` |
| Card-role hover | `0 10px 26px -18px rgba(46, 59, 199,.5)` — *brand*-hued |
| Send button hover | `0 8px 20px -10px rgba(46, 59, 199,.8)` |
| Toggle thumb | `0 2px 6px rgba(23,35,58,.22)` |

**Rule:** shadows are `rgba(23,35,58,…)` (ink) except *hover* on interactive
brand elements, which uses `rgba(46, 59, 199,…)` (indigo).

---

# 8. Border System

| Width | Where |
| --- | --- |
| `1px` | Default — cards, inputs, menus, chips |
| `1.5px` | Checkbox, ghost button |
| `2px` | Presence dot ring, pinned bubble, active step icon (inset) |
| `2.5px` | `:focus-visible` outline |
| `3px` | Active conversation rail (`::before`) |

| Kind | Value |
| --- | --- |
| Default | `1px solid var(--line)` |
| Divider | `1px solid var(--line-soft)` |
| Floating card | `var(--card-border)` = `1px solid rgba(23,35,58,.05)` |
| Sidebar | `1px solid rgba(255,255,255,.9)` — a *light* border on glass |
| Hover | `--indigo-line` |
| Focus | `--indigo-600` + 3px `--indigo-100` glow |
| Invalid | `--red-line`, focus `--red` + `--red-tint` glow |
| Dashed | Optional-module offer only (`1px dashed var(--indigo-line)`), Example block (`1px dashed var(--line)`) |

---

# 9. Icon System

**Library:** `lucide-react` (only icon dependency).

| Size | Use |
| --- | --- |
| `12–13px` | Inline meta, chip icons, trend markers |
| `14px` | Buttons, menu items, list rows |
| `15–16px` | Card headers, status glyphs |
| `17px` | Stage icons, module headers |
| `20px` | **Sidebar nav** (`NAV_ICON = 20`) |
| `26–28px` | Empty states, loaders |
| `132px` | Optional-module watermark (`opacity: .09`) |

**Colour:** `--indigo-600` for active/branded, `--ink-faint` for passive,
`--ink-soft` for body-level, status token when carrying status.

**Spacing:** `gap: 5–10px` between icon and label; icons are `flex: none`.

**Rules:** decorative icons take `aria-hidden`; icon-only buttons require
`aria-label`; every form field gets a leading icon from `fieldIcon(name)` —
one concept, one glyph, 17px, indigo.

---

# 10. Animation System

## Tokens

```css
--ease: cubic-bezier(.4,0,.2,1);
--dur-fast: 120ms;
--dur-slow: 200ms;
```

## Durations in use

| Duration | Use |
| --- | --- |
| `120–140ms` | Colour, background, border-colour |
| `160–180ms` | Hover lift, menu open, opacity |
| `200–220ms` | Toggle thumb, sidebar width, modal panel |
| `250–260ms` | Card hover, chat bubble entry |
| `320ms` | Empty-state fade-up |

## Named keyframes (39 total)

**Entry:** `afFade`, `afFadeIn`, `afFadeUp`, `afPop`, `afDropIn`, `afMenuIn`,
`afBubbleIn`, `amOverlayIn`, `amPanelIn`, `dsToastIn`, `rvbIn`, `jr-cheer-in`
**Exit:** `amOverlayOut`, `amPanelOut`, `dsToastOut`
**Loading:** `afLoaderSpin`, `afLoaderDash`, `afLoaderFade`, `afSpin`,
`afShimmer`, `dsSkel`, `dsTyping`
**Status:** `dsStatusPing`, `dsStatusPulse`, `afPulse`, `afPulseScale`,
`afBadgePop`, `afNodePop`, `afNodePulse`
**Motion:** `afMarquee`, `mqScrollX`, `mqScrollY`, `afFloatY`, `afStripeMove`,
`afDashFlow`, `afChev`, `afChevGo`, `afGridCell`, `afStepFade`, `afVideoFade`

## Micro-interactions

| Interaction | Effect |
| --- | --- |
| Card hover | `translateY(-3px)` + `--elev-hover` |
| Card-role hover | `translateY(-1px)` + indigo border + brand shadow |
| Button press | `scale(.97)` |
| Chip hover | `translateY(-1px)` |
| Chevron open | `rotate(180deg)`, 180ms |
| Toggle | thumb `translateX(22px)`, icon crossfade |
| Chat action | fades in on row hover / focus-within |

## Reduced motion

**13 `prefers-reduced-motion` blocks in `globals.css` + 10 in `ds.css`.**
Under the query: toggle, select chevron, menu, chat rows, empty states, loaders,
marquee, celebration and smooth scroll are all disabled or made instant.
`Confetti` **does not run at all**. Any new animation must be covered.

---

# 11. Layout System

## Shell

```
.sw-root                       full-viewport gradient + 2 blurred blobs
└── .sw-shell                  flex, gap 18px, padding 18px, height 100dvh
    ├── .sw-sidebar            256px | 60px collapsed, glass
    └── main                   flex 1, min-width 0
        └── .sw-withpanel      grid: content | right panel
```

## Sidebar

Glass: `rgba(255,255,255,.8)` + `backdrop-filter: blur(22px) saturate(1.5)`,
`1px solid rgba(255,255,255,.9)`, radius `26px`, shadow `0 20px 54px rgba(23,35,58,.12)`.

- Expanded **256px**, collapsed **60px**, `transition: width 200ms linear`
- Collapsed hides labels, badges, carousel and wordmark; nav items centre
- Group labels fade out (`margin-top: -32px; opacity: 0`)
- Toggle: PanelLeft button **or ⌘/Ctrl+B**; persisted in the `sidebar_state` cookie
- Active item is a **single sliding pill** (`.sw-navpill`) measured from the
  active button, with a left accent bar, indigo ink and 600 weight. Never two.

## Navigation model

`type Nav = "overview" | "journey" | "documents" | "explore" | "messages" |
"notifications" | "support" | "subscription" | "profile" | "settings" | "schedule"`

Primary rail: **Overview · My Journey · Documents · Schedule · Explore Lithuania**.
The rest are reached from the top bar, the user menu, or in-app links.

## Breakpoints

No named scale — max-width queries at natural breaking points:

| Query | Effect |
| --- | --- |
| `≥1024px` | Full desktop |
| `≤1279px` / `≤1199px` | Grid reflow |
| `≤1100px` | Chat drops to one column; `.chat-zoom` → 1 |
| `≤1023px` | **Sidebar hidden**, shell becomes column, padding 12px, page scrolls |
| `≤900px` / `≤860px` / `≤820px` | Two-column → one |
| `≤768px` / `≤760px` / `≤720px` / `≤700px` | Stat rows and panels stack |
| `≤640px` | Reminder banner unpills; dialog fields stack |

## Header / footer

The workspace has **no application footer**. Mobile gets a `56px` header
(`--sw-head`) with the brand and a menu trigger (`MobileNavigationHeader`).

---

# 12. Background System

| Surface | Treatment |
| --- | --- |
| Workspace root | 135° gradient `#E7ECF7 → #EDF1F9 → #E8EEF9` + two fixed blurred blobs |
| Sidebar | White glass 80% + `blur(22px) saturate(1.5)` |
| Cards | Flat `--card` |
| Recessed rows | `--subtle` |
| Modal scrim | `rgba(23,35,58,.42)` + `blur(6px)` |
| Celebration scrim | `rgba(23,35,58,.55)` + `blur(6px)` |
| Plan-locked stage | Content blurred `2px`, `opacity .55`, `pointer-events: none` |
| Optional-module offer | `--indigo-tint` + dashed indigo border + 132px watermark at `.09` |
| Callouts | Status tint + status line |

Glass appears in exactly **two** places: the sidebar and modal scrims. It is not
a general surface treatment.

---

# 13. Component Library

Barrel: `src/components/ds/index.ts`.

## Controls

### `Input`
`{ icon, label, error, hint, trailing, containerStyle, className, ...inputProps }`
Shell `.af-field` + `input.af`. `min-height: 44px`, padding `12px 16px`, radius
16px. With icon → `padding-left: 44px`. Error sets `aria-invalid` and renders
`.af-error`, which reserves `min-height: 16px` **so showing an error never shifts
the layout**.

### `TextArea`
Same contract; icon pins to `top: 22px` rather than centring.

### `Select`
Custom capsule (`.af-select`), **portalled to `<body>`** (`.af-menu-float`,
`z-index: 1200`) so no `overflow: hidden` ancestor can clip it. Position is
measured from the trigger and kept in sync while the page moves. Menu:
`max-height: 264px`, `afMenuIn` 160ms. Options `.af-opt`; selected is indigo-tinted
and 600 weight with a check.

### `Toggle`
52×30 pill track, 22px thumb, X when off / check when on, thumb travels 22px in
220ms. Disabled `opacity: .45`.

### `Checkbox`
20×20, radius 7px, 1.5px border, fills indigo on check. `.af-check-row` aligns
label to `flex-start` for multi-line.

### `FileDrop`
Drag-and-drop upload target. All uploads route through `uploadUserFile` →
`/api/upload` → R2. **Never call `supabase.storage.upload`.**

## Surfaces

- **`Card`** — the generic 28px floating card.
- **`Cards`** — the five roles (§16): `FeatureCard`, `InfoCard`, `CompactCard`,
  `StatCard`, `ActionCard`.
- **`MetricCard`** — `{ title, subtitle, value, icon, tone, badge, control, menu, loading }`.
- **`DialogCard` / `DialogHead` / `DialogFoot`** — every dialog is built from
  these three, so all dialogs share one width, radius, shadow and footer.

## Feedback

- **`Status`** — 24 states (§21). `variant`: `outline | plain`; `size`; `dotOnly`;
  `pulse`; `ping`. Live states animate by default.
- **`Pill`** — `PillTone = grey | indigo | amber | red | green`, `PillSize = sm | md`.
- **`Toast` / `Toaster`** — `toast()`, `dismissToast()`. Kinds: `update`,
  `journey`, `document`, `message`, `payment`, `system`. Driven by the
  notifications table, so any insert raises one.
- **`Loader`** — `{ size, label, block, onDark }`. A swirling arc; the platform's
  only spinner.
- **`Confetti`** — canvas, fixed burst count, **disabled under reduced motion**.

## Overlay

- **`AnimatedModal`** — `{ open, onClose, children, className, overlayClassName, labelledBy, ariaLabel }`.
  Scrim + panel with paired in/out keyframes.
- **`ImageZoom`**, **`HeroVideoDialog`** — the video mounts its iframe **only when
  the dialog opens**, so no third-party frame or cookie loads on arrival.

## Content

- **`Accordion`** — `{ items, defaultOpen, multiple }`. Animates a *measured*
  height then returns to `auto` so long answers reflow. Collapsed panel gets
  `inert` to stay out of tab order.
- **`DataTable`** — `{ columns, ... }`, the one table.
- **`Divider`** — optional centred `label`.
- **`Marquee`** — two identical runs translated by exactly one run length, pure
  CSS, off main thread. Axis switches by media query.
- **`ContributionGraph`** — `{ days, best, loading }`.

## Identity

- **`UserAvatar`** / **`DefaultAvatar`** — `{ size, src, verified, user }`.
  Verified badge is driven by an approved payment.
- **`UniversityBrand`** — resolves a logo from `/assets/universities/manifest.json`.
- **`BrandLogo`**, **`Flag`**, **`GoogleIcon`**, **`Icon`** (named registry).

## Journey-local shared parts (`journey/parts.tsx`)

- **`JrButton`** — `tone: primary | quiet | outline | danger | success`,
  `size: sm | md`. Every journey action uses it.
- **`JrMenu`** — the three-dot overflow menu. Closes on outside click, scroll
  **and Escape**.
- **`InfoCard`** — tinted explanatory card, `tone: blue | grey | amber | green | red`.

---

# 14. Button System

## `Button` (design system)

| Variant | Background | Hover | Pressed | Text | Border |
| --- | --- | --- | --- | --- | --- |
| `primary` | `--indigo-600` | `--indigo-500` | `--indigo-700` | `#FFFFFF` | none |
| `ghost` | transparent | `--indigo-100` | `--indigo-100` | `--indigo-600` | `1.5px solid --indigo-600` |
| `neutral` | `--subtle` | `#EBEEF4` ⚠️ | `#E3E8F0` ⚠️ | `--ink-soft` | `1px solid --line` |
| `destructive` | `--red` | `#C04834` ⚠️ | `#9E3322` ⚠️ | `#FFFFFF` | none |

**Sizes:** `md` → height 40, `600 14px/20px` · `lg` → height 44, `600 15px/20px`.
**Radius:** `999px`. **Loading:** swaps content for `Loader size={16}`.
**Disabled:** reduced opacity, `cursor: not-allowed`.

## `JrButton` (journey)

Tones `primary | quiet | outline | danger | success`, sizes `sm | md`, optional
`icon`, `fullWidth`, `title`. Exists so every journey action shares one height,
radius and weight.

## Purpose-built buttons

| Class | Use |
| --- | --- |
| `.chat-send` | 40px pill, indigo; `.danger` variant is the same shape in red |
| `.chat-chip` | 34px pill filter chip; `.on` = indigo tint |
| `.chat-act` | 28px circular row action, fades in on hover |
| `.chat-tab` | 30px segmented tab inside a pill track |
| `.jr-menu-btn` | 30px square-ish icon trigger, radius 9px |
| `.rp-iconbtn` | Right-panel icon button |
| `.rp-textbtn` | Text link + arrow ("View journey →") |

---

# 15. Form System

## Anatomy

```
.af-label            600 11.5px/16px, --ink-soft, margin-bottom 6px
.af-field            relative flex shell
  .af-field-ico      absolute left 16px, indigo, pointer-events none
  input.af           min-height 44, padding 12/16, radius 16
  .af-field-trail    absolute right 10px
.af-error            min-height 16px (reserved), 500 11.5px, --red
```

## States

| State | Border | Extra |
| --- | --- | --- |
| Rest | `--line` | `background: --card` |
| Hover | `--indigo-line` | |
| Focus | `--indigo-600` | `box-shadow: 0 0 0 3px var(--indigo-100)` |
| Invalid | `--red-line` | `aria-invalid="true"` |
| Invalid + focus | `--red` | `box-shadow: 0 0 0 3px var(--red-tint)` |
| Disabled | `--line` | `--subtle` bg, `--ink-faint` text, `opacity .7`, icon greys |

## Field types

- **Text / email / number** — `Input`
- **Password** — `Input` with a trailing reveal in `.af-field-trail`
- **Search** — `Input` with the search `fieldIcon`
- **Date / time** — native `type="date"` / `type="time"` through `Input`, so the
  platform inherits the OS picker and its accessibility
- **Select** — custom capsule, portalled menu
- **Checkbox / Toggle** — as §13
- **Textarea** — `rows`, icon top-aligned
- **Markdown** — `textarea.be-md`, monospace, `min-height: 320px`

## Rules

- Every field gets a leading icon from `fieldIcon(name)` / `iconForLabel(label)`.
- Required is conveyed by the `required` attribute and validation copy, **not** by
  a bare asterisk.
- Helper text uses `hint`; errors use `error` and set `aria-invalid`.
- The error slot is always reserved — validation never reflows the form.

---

# 16. Card System

## The five roles — use one, do not invent a sixth

| Role | Purpose | Shape |
| --- | --- | --- |
| `FeatureCard` | Rich item with image, badge, action, bookmark | Image, body, footer action |
| `InfoCard` | Thumbnail + title + supporting + meta + action | Horizontal |
| `CompactCard` | Dense list row | Single line, icon + text + action |
| `StatCard` | **Every metric tile on the platform** | Value, label, icon, trend |
| `ActionCard` | Prompts a decision | Title, body, primary action |

Shared hover (`.af-card-*`): `border-color: --indigo-line`,
`box-shadow: 0 10px 26px -18px rgba(46, 59, 199,.5)`, `translateY(-1px)`.

## Base `.card`

`background: --card` · `border: --card-border` · `radius: 28px` ·
`box-shadow: --elev-2` · `padding: 24px` · hover `translateY(-3px)` + `--elev-hover`.

## Workspace panels

- `Panel` (`workspace/parts.tsx`) — the Overview's section frame
- `.rp-card` — right-panel card: header (icon + title + text action), then body
- `.jm-block` — admin/editor block frame, reused by journey settings cards

---

# 17. Navigation System

| Surface | Behaviour |
| --- | --- |
| **Sidebar** | 256/60px, glass, sliding active pill, ⌘/Ctrl+B, cookie-persisted, hidden ≤1023px |
| **Mobile header** | 56px, brand + menu trigger |
| **Top bar** | Page title, notification bell with count badge, user avatar menu |
| **User menu** | Profile, subscription, settings, sign out |
| **Notifications** | Bell badge → notifications page; toasts for live arrivals |
| **Segmented tabs** | `.chat-tabs` / `.chat-tab` — pill track, active is a white raised chip |
| **Overflow menu** | `JrMenu` |
| **Right panel** | Contextual cards; hides its own module's card (`hide="journey" \| "documents"`) |

**Badge rule:** one circular red count badge. A badge that never reaches zero is
reading sample data — wire it to the real table.

---

# 18. User Workspace Architecture

Entry: `src/app/dashboard/page.tsx` → `WorkspaceShell` → module by `Nav`.
The profile is built once in `buildProfile()` and passed down as `WsProfile`.

### Overview
Purpose: where am I, what next.
Layout: 4 stat tiles (`StatTile`) → `1.6fr | 1fr` two-column.
Left: **Your journey** (progress line + stage chips), **Upcoming tasks**,
**Recent documents**. Right: plan card, activity, FAQ.
All journey and document figures come from `useJourneySummary` — the single
source every screen quotes. Stacks below 900px.

### My Journey
Purpose: the roadmap from application to arrival.
Layout: header (title, subtitle, overall %) → stage navigator (equal cards with
status, progress bar, count) → expandable stage sections → step timeline.
Each step row: number/due/document count, title + `Status`, description,
prerequisites, action buttons, **View Details**.
Detail modal: two tabs — **Required Documents** and **Learn**. (There is no
Overview tab; it was removed.)
Special renderers: plan-locked overlay, optional-module card, VFS appointment
dialog, TRP decision dialog, celebration.

### Documents
Purpose: the single upload location.
Layout: stage header → requirement rows (icon, name, description, `Status`,
actions). Scoped to the **active stage** by design — finished stages are history,
future ones are not yet theirs. Journey hands over the exact step via
`sessionStorage`.

### Schedule
Purpose: calendar of deadlines, appointments and reminders.
Layout: month/list view + right rail with `JourneySnapshotCard`. Events are
DB-backed (`schedule_events`); a student may only edit what they created.

### Explore Lithuania
Purpose: destination content. Sectioned cards with `/lithuania/*.webp` imagery.

### Messages
Purpose: the advisor conversation.
Layout: two columns (no conversation list), `.chat-zoom` at 110%. Bubbles,
composer capsule, presence from a real Supabase presence channel.

### Notifications
Purpose: history of everything that happened. Reads the `notifications` table;
supports priority and pinning.

### Profile / Settings / Subscription / Support
Profile: identity, academic and study fields with inline save.
Subscription: plan, verified badge, payment history, invoice download.
Support: FAQ accordion + contact routes.

---

# 19. Section Library

| Section | Where | Notes |
| --- | --- | --- |
| Stat row | Overview | 4 × `StatTile`, stacks ≤720px |
| Journey progress panel | Overview | Progress line + stage chips with `Status` dots |
| Stage navigator | Journey | Equal cards, disabled when locked |
| Step timeline | Journey | `.jr-timeline` / `.jr-step` — the mini-step used everywhere |
| Learn page | Journey modal | Documentation-style blocks |
| Document requirement list | Documents | Row per requirement |
| Right panel | Journey, Documents, Schedule | University, Mini calendar, Journey snapshot, Documents overview |
| Empty state | Everywhere | Illustration + title + explanation + optional action |
| FAQ | Support | `Accordion` |
| Celebration | Journey | Full-screen confetti + illustration + message |

---

# 20. Frame System

| Frame | Class | Shape |
| --- | --- | --- |
| Page card | `.card` | 28px, `--elev-2`, 24px padding |
| Right-panel card | `.rp-card` | Header + body |
| Info card | `.jr-info` | Tinted, leading icon, 5 tones |
| Callout | `.lrn-note-*` | 2px left rule; `important` is a filled red card |
| Preparation banner | `.lrn-banner` | Red tint, heading + list |
| Under-review card | `.lrn-review` | Indigo tint + `Loader` |
| Example block | `.lrn-example` | Dashed border, `--subtle` |
| Learn module | `.lrn-module` | Title, summary, rendered Markdown |
| Optional module offer | `.jr-optional` | Indigo tint, dashed, 132px watermark |
| Optional module container | `.jr-modstep` | Expandable, count, overflow menu |
| Prerequisite box | `.jr-prereq` | `--subtle`, uppercase head, list |
| Chat bubble | `.chat-bubble` | 20px; mine = indigo fill, white text |
| Editor block | `.jm-block` | Admin/editor frame |
| Outbox row | `.jm-outbox-row` | Icon, body, `Status`, action |

---

# 21. Status System

`Status` is the **only** status vocabulary. 24 states, five tones.

| Group | States |
| --- | --- |
| Generic | `success` `error` `warning` `info` `neutral` |
| Presence | `online` `offline` `busy` `away` `typing` |
| Progress | `pending` `processing` `waiting` `submitted` `draft` |
| Outcome | `completed` `approved` `rejected` `cancelled` |
| Payment | `paid` `failed` `refunded` |
| Message | `read` `delivered` |

| State | Tone | Colours |
| --- | --- | --- |
| `success` `online` `completed` `approved` `paid` `read` | Green | `--green` / `--green-tint` / `--green-line` |
| `warning` `away` `pending` `waiting` | Amber | `--amber` / `--amber-tint` / `--amber-line` |
| `error` `busy` `rejected` `failed` | Red | `--red` / `--red-tint` / `--red-line` |
| `info` `typing` `processing` `submitted` `refunded` | Indigo | `--indigo-text` / `--indigo-tint` / `--indigo-line` |
| `neutral` `offline` `draft` `cancelled` `delivered` | Grey | `--grey` / `--grey-tint` / `--grey-line` |

**Props:** `variant: outline | plain`, `size`, `dotOnly`, `pulse`, `ping`.
Live states (`online`, `typing`, `processing`) animate by default.

**Domain mappings** live in `src/lib/journey.ts` (`STATE_STATUS`, `STATE_BADGE`,
`DOC_STATUS`) — one table each, so "approved" cannot read *Approved* on one
screen and *Verified* on another.

**Rule:** the label always renders. `dotOnly` is only for dense lists where the
adjacent text already carries the meaning, and it still exposes the label to
screen readers.

---

# 22. Data Display

| Display | Component | Notes |
| --- | --- | --- |
| Table | `DataTable` | The only table |
| List | `.chat-panel-item`, `.stp-docs`, `.jm-outbox` | Icon + body + status + actions |
| Progress bar | `ProgressBar` (right panel), `ProgressLine` (Overview) | `role="progressbar"` with aria values |
| Metric tile | `StatCard` / `StatTile` / `MetricCard` | Value, label, icon, optional trend |
| Sparkline | Inline SVG in `RightPanel` | 26×16, `-soft` colours |
| Contribution graph | `ContributionGraph` | Indigo ramp |
| Timeline | `.jr-timeline`, `.usr-timeline`, `.spm-timeline` | Vertical step lists |
| Counter | `.chat-unread`, notification badge | Circular, indigo or red |
| Skeleton | `dsSkel` / `afShimmer` | Shimmer placeholders |

---

# 23. Responsive Design

| Width | Behaviour |
| --- | --- |
| **≥1280px** | Full: sidebar + content + right panel |
| **1024–1279px** | Grids reflow; right panel may drop |
| **≤1100px** | Chat one column; `.chat-zoom` → 1 |
| **≤1023px** | **Sidebar hidden**, mobile header shown, shell becomes a column, padding 12px, `height: auto` and the page scrolls |
| **≤900px** | Two-column sections stack |
| **≤720px** | Stat rows stack; dialogs near-full-width |
| **≤640px** | Reminder banner unpills; paired dialog fields stack |

**Hidden on mobile:** sidebar, sidebar carousel, some table columns, the desktop
right panel.
**Touch:** controls are `min-height: 44px`; icon buttons 28–30px sit inside
larger tap rows.
**Zoom quirk:** a high-min-width block applies `zoom: 1.1` to `.sw-root` on very
large screens; chat carries its own `.chat-zoom: 1.1`.

---

# 24. Accessibility

## Contrast

| Pair | Ratio |
| --- | --- |
| `--ink` on `--card` | ~13:1 |
| `--ink-soft` on `--card` | ~7:1 |
| `--ink-faint` on `--card` | ~4.6:1 — meta only, never body |
| Status text on its tint | ≥5.3:1 |
| `-soft` variants | ≥3.6:1 — **graphics only, never text** |

## Keyboard

- `:focus-visible` → `2.5px solid var(--indigo-600)`, offset 2px, globally.
- ⌘/Ctrl+B toggles the sidebar.
- `JrMenu` closes on Escape; `AnimatedModal` closes on Escape and scrim click.
- Collapsed `Accordion` panels are `inert`, so they leave the tab order.
- `Select` is a real button with `aria-expanded`; options are keyboard reachable.

## ARIA in use

`role="progressbar"` + `aria-valuenow/min/max` · `role="tablist"` / `tab` +
`aria-selected` · `role="menu"` / `menuitem` + `aria-haspopup` / `aria-expanded` ·
`role="radiogroup"` / `radio` + `aria-checked` · `role="checkbox"` +
`aria-checked` · `role="dialog"` + `aria-modal` + `aria-label` ·
`aria-invalid` on fields · `aria-hidden` on decorative icons · `aria-label` on
every icon-only control.

## Reduced motion

23 `prefers-reduced-motion` blocks. Confetti does not run. Smooth scroll becomes
auto. **Any new animation must be added to a reduced-motion block.**

---

# 25. Design Tokens — complete index

```css
/* Surfaces */
--paper:#ECEFF3; --card:#FFFFFF; --subtle:#F3F5F9; --divider:#F1F5F9;
/* Text */
--ink:#17233A; --ink-soft:#5A6B85; --ink-faint:#8695AB;
/* Borders */
--line:#DCE2EA; --line-soft:#E7ECF1; --card-border:1px solid rgba(23,35,58,.05);
/* Brand */
--indigo-700:#202CA9; --indigo-600:#2E3BC7; --indigo-500:#424ED4;
--indigo-100:#E1E3F9; --indigo-50:#F5F5FD;
--indigo-text:#2E3BC7; --indigo-tint:#E1E3F9; --indigo-line:#B3B8ED;
--focus-ring:rgba(46, 59, 199,.25);
/* Status */
--amber:#8A5A0C; --amber-tint:#FBF0DA; --amber-line:#E7C583;
--red:#B23B27;   --red-tint:#FBE7E2;   --red-line:#EDB3A6;
--green:#256B49; --green-tint:#E3F0E9; --green-line:#9CCBB2;
--grey:#8695AB;  --grey-tint:#F1F4F7;  --grey-line:#DCE2EA;
--green-soft:#3F8C63; --amber-soft:#A8741B; --red-soft:#C25A44;
/* Aliases */
--text-body --text-secondary --text-hint
--surface-page --surface-card --surface-input
--border-default --border-divider
--accent --accent-hover --accent-pressed --accent-tint
/* Typography */
--font-sans:'Poppins', system-ui, sans-serif;
--text-page-title --text-section-title --text-body-md --text-label
--text-eyebrow --text-section-eyebrow --text-button --text-pill
--text-hint-sm --text-micro
/* Spacing */
--space-1:4px --space-2:8px --space-3:12px --space-4:16px
--space-5:20px --space-6:24px --space-8:32px --space-10:40px
/* Radius */
--radius-sm:8px --radius-md:12px --radius-lg:16px
--radius-pill:999px --radius-card:28px
/* Elevation */
--shadow-card:0 2px 10px rgba(23,35,58,.04);
--elev-1:0 6px 20px rgba(23,35,58,.04);
--elev-2:0 10px 30px rgba(23,35,58,.05);
--elev-3:0 20px 60px rgba(23,35,58,.08);
--elev-hover:0 20px 45px rgba(23,35,58,.08);
/* Motion */
--ease:cubic-bezier(.4,0,.2,1); --dur-fast:120ms; --dur-slow:200ms;
/* Layout */
--sw-side:256px; --sw-side-icon:60px; --sw-head:56px;
```

## Opacity

`.09` module watermark · `.45` disabled toggle/checkbox · `.5` disabled button ·
`.55` plan-locked stage · `.7` disabled field · `.82` locked chip · `.92` empty-state art

## Z-index

| Layer | z |
| --- | --- |
| Background blobs | 0 |
| Shell content | 1 |
| Local stacking | 2–5 |
| Menus, popovers | 20–70 |
| Sticky headers | 90 |
| Modal scrim (profile) | 220–240 |
| Portalled select menu | 1200 |
| Document viewer full-screen | 1300 |
| Celebration overlay | 1400 |
| Toasts | 9999 |

---

# 26. Page Inventory

| Page | Route / Nav | Layout | Background | Right panel |
| --- | --- | --- | --- | --- |
| Overview | `overview` | Stat row + 1.6/1 columns | Gradient | Yes |
| My Journey | `journey` | Header + navigator + stages | Gradient | Yes (hides journey card) |
| Documents | `documents` | Stage header + requirement rows | Gradient | Yes (hides documents card) |
| Schedule | `schedule` | Calendar + rail | Gradient | Journey snapshot |
| Explore Lithuania | `explore` | Sectioned content cards | Gradient | No |
| Messages | `messages` | Two-column chat, 110% zoom | Gradient | No |
| Notifications | `notifications` | Chronological list | Gradient | No |
| Profile | `profile` | Field groups, inline save | Gradient | No |
| Subscription | `subscription` | Plan + payments + invoice | Gradient | No |
| Settings | `settings` | Grouped preferences | Gradient | No |
| Support | `support` | FAQ accordion + contact | Gradient | No |

---

# 27. Component Relationships

```
WorkspaceShell
├── sidebar (nav · SidebarCarousel · user)
├── MobileNavigationHeader        ≤1023px
├── module by Nav
│   ├── Overview   → useJourneySummary, useNotifications, StatTile, Panel
│   ├── Journey    → assembleRoadmap → JourneyStepModal → StepBlocks → ProgramBlock
│   │               → CompleteDialog · VfsAppointmentDialog · TrpDecisionDialog
│   │               → OptionalModule → JrMenu
│   ├── Documents  → stepRequirements → FileDrop → uploadUserFile → /api/upload → R2
│   ├── Schedule   → scheduleDb → EventModal
│   └── Messages   → chat/parts (shared with admin)
├── RightPanel     → useJourneySummary
└── Toaster        → useNotificationToasts
```

**Data spine.** `journey.ts` assembles the roadmap; `useJourneySummary` derives
the counters every surface quotes; `journeyEvents.ts` is the one event bus
(notification, chat, email, WhatsApp) and `journey_outbox` its queue. A component
never invents a number — it reads one of these.

**Rules that hold this together**
- One realtime subscription per topic, shared and reference-counted at module
  level. supabase-js returns the *same* channel object for a repeated topic, so a
  second `.on()` after `.subscribe()` throws and takes the page down.
- Uploads only through `uploadUserFile`.
- Block shapes come from `journeyBlocks.ts`, which the editor and the renderer
  both import — so a saved block always renders.

---

# 28. Future Development Rules

1. **Never introduce a colour outside `ds.css`.** Add it to the design system
   first, then this document, then use it.
2. **Reuse before building.** Check `src/components/ds/` and `journey/parts.tsx`.
   If you copy a pattern twice, extract it.
3. **Keep the spacing scale.** 4px base; justify anything off-scale.
4. **Keep the type hierarchy.** Use a `--text-*` token or match an existing role.
5. **Use the button system.** `Button` platform-wide, `JrButton` in the journey.
   No third button.
6. **Status only through `Status`.** Never hand-roll a badge. The label always
   renders.
7. **Metrics are `StatCard`.** Always.
8. **Respect responsive behaviour.** Test 1440 / 1024 / 768 / 375. The sidebar
   must disappear at ≤1023px.
9. **Cover reduced motion.** Every new animation needs a block.
10. **No dead ends.** Every button goes somewhere real.
11. **Never fake data.** No source → say so.
12. **Delete placeholders when real data lands** — including the export.
13. **Modify the page, not the shared component**, to fix one screen.
14. **Do not add a second styling system.** No Tailwind, no shadcn, no UI kit.
    Rebuild the *experience* natively.
15. **Uploads go through `uploadUserFile`.** Never `supabase.storage.upload`.

---

# 29. Design Assets Inventory

**48 files in `public/`.**

| Group | Files |
| --- | --- |
| Brand | `logo-glyph.{svg,png}`, `logo-mark.{svg,png}`, `logo-mark-ink.svg`, `logo-mark-tint.svg` |
| Favicons | `favicon.ico`, `icon.png` (512), `apple-icon.png` (180) — in `src/app/` |
| Universities | 9 `.webp` logos + `manifest.json` (kauko, klaipeda-university, ktu, mruni, smk, vilnius-tech, vilnius-university, vmu, vvk) |
| Illustrations | `empty-documents.png`, `empty-pinned.png`, `journey/trp-approved.webp` |
| Sidebar carousel | `document/{1,2,3}.png` — bump the `?v=` cache-buster when replaced |
| Destination | `lithuania/lithuania-{1..7}.webp` |
| Ambience | `hero-ambient.webp`, `europe-map.webp` |
| Icons (raster) | `icons/ic-{20,calendar,flag,timer}.png` |
| Onboarding video | `onboarding/step-{1..4}.mp4` |

Icons in the interface are **Lucide components**, not files. The raster icons
above are content imagery.

---

# 30. Complete Component Index

## `src/components/ds/` (29 modules)

`Accordion` · `AnimatedModal` · `BrandLogo` · `Button` · `Card` · `Cards`
(`FeatureCard`, `InfoCard`, `CompactCard`, `StatCard`, `ActionCard`) ·
`Confetti` · `ContributionGraph` · `Controls` (`Input`, `TextArea`, `Select`,
`Toggle`, `Checkbox`) · `DataTable` · `DefaultAvatar` · `DialogCard`
(`DialogHead`, `DialogCard`, `DialogFoot`) · `Divider` · `Field` · `fieldIcons`
(`fieldIcon`, `iconForLabel`) · `FileDrop` · `Flag` · `GoogleIcon` ·
`HeroVideoDialog` · `Icon` · `ImageZoom` · `Loader` · `Marquee` · `MetricCard` ·
`Pill` · `Status` · `Toast` (`Toaster`, `toast`, `dismissToast`) ·
`UniversityBrand` · `UserAvatar`

## `src/components/student/workspace/`

`WorkspaceShell` · `Modules` (Overview, Profile, Subscription, Settings,
Support, …) · `RightPanel` (`UniversityCard`, `MiniCalendarCard`,
`JourneySnapshotCard`, `DocumentsOverviewCard`, `ProgressBar`) ·
`MobileNavigationHeader` · `SidebarCarousel` · `parts` (`Panel`, `CardTitle`,
`StatTile`, `ProgressLine`, `EmptyState`, `BtnPrimary`, `BtnGhost`,
`StatusGlyph`, `IconChip`, `CompactCard`, `SectionTitle`, `InlineNote`)

### `journey/`
`JourneyRoadmap` · `JourneyStepModal` · `StepBlocks` (`JourneyBlock`) ·
`ProgramBlock` · `MarkDoneDialog` · `CompleteDialog` · `VfsAppointmentDialog` ·
`TrpDecisionDialog` (`TrpCelebration`, `JourneyCompleteCelebration`) ·
`OptionalModule` (`ModuleDialog`) · `ReviewBanner` · `parts` (`JrButton`,
`JrMenu`, `InfoCard`)

### `documents/` · `schedule/` · `explore/`
`DocumentsModule` · `ReplaceDialog` — `Schedule` · `EventModal` — explore sections

### `src/components/student/`
`StudentChat` — with `components/chat/parts.tsx` shared with admin

---

## Appendix — known debt

These are real and deliberate; fix them properly rather than working around them.

1. **Hard-coded colours** — `#E8F7EE`, `#1E7A4E`, `#EBEEF4`, `#E3E8F0`,
   `#C04834`, `#9E3322`, and the `.sw-root` gradient stops.
2. **No named breakpoint scale** — 14 distinct max-widths. Consolidate to
   `640 / 768 / 1024 / 1280`.
3. **No chart palette** — define one before adding charts.
4. **`Modules.tsx` is ~750 lines** and holds several unrelated pages; it also
   carries the repo's pre-existing lint errors. Split it when you next touch it.
5. **Two zoom mechanisms** (`.sw-root` at very large widths, `.chat-zoom`) —
   they can compound. Do not add a third.

---

*Generated from the codebase as it stands. When you change a token, a component
or a page, update this file in the same commit — it is only a source of truth
while it is accurate.*
