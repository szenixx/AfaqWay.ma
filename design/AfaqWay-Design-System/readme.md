# AfaqWay Design System

The brand and UI system for **AfaqWay** — a digital platform that walks an
international student through the entire journey of studying abroad as a guided,
step-by-step system instead of a costly agency. It handles passports, diplomas,
visas and residence permits for eighteen-year-olds moving country alone, so the
interface is built to feel like *a competent adult is on the other side of it*.

This folder is the source of truth for that look and feel: tokens, fonts, brand
assets, reusable React components, and full-screen UI-kit recreations. An
automated compiler bundles the components (`_ds_bundle.js`) and indexes the
tokens; you consume everything through the single stylesheet `styles.css`.

---

## Sources this was built from

- **Codebase** (primary): the AfaqWay Next.js app — `src/app/ds.css` (the token
  contract), `src/app/globals.css`, `src/components/ds/*` (the component
  library), `src/components/home/*` (marketing), `src/components/student/*`
  (workspace). Explore it to build higher-fidelity screens.
- **`uploads/design.md`** — the authoritative *User Workspace Design System*
  document (30 sections). Every value here is traceable to it.
- **GitHub:** https://github.com/szenixx/AfaqWay.ma — explore for the latest
  product source.
- **Brand assets:** copied from the codebase `public/assets/brand/` plus the
  user-provided logo PNGs. See `assets/`.

> Scope: the **student-facing** surfaces only. The `/admin` console uses a
> separate design language (`.adm-*`, `.dash-*`) and is deliberately excluded.

---

## Content fundamentals — how AfaqWay writes

- **Voice:** calm, credible, quietly institutional. Never playful, never
  alarming, never salesy. The product is reassuring precisely because it is
  plain.
- **Person:** addresses the student as **you** ("Your journey", "Start your
  roadmap", "Message your advisor"). The platform refers to itself as *AfaqWay*
  or "we", sparingly.
- **Casing:** sentence case for titles and buttons ("Start your roadmap", not
  "Start Your Roadmap"). UPPERCASE only for micro-labels: eyebrows, pills,
  section kickers (`letter-spacing .05–.07em`).
- **The word always appears.** Status is never colour alone — "Approved",
  "Under review", "Pending" render as text beside the dot. Meaning survives
  greyscale.
- **Never invent a fact.** With no source for a number the UI says *"Not tracked
  yet"* rather than showing a plausible figure. Placeholders are deleted when
  real data lands.
- **No dead ends, no hype.** Copy states what happens next ("3 documents are
  waiting before your visa stage"), not adjectives. Verbs over exclamation.
- **Bilingual reminders** appear in English + Arabic on a slim amber banner —
  text only, no icon, no emoji.
- **Emoji:** never. **Positioning line, used verbatim:** *"AfaqWay is built for
  students, not agencies."*

Example copy — hero: *"Study abroad, guided every step of the way."* /
*"One clear plan from application to arrival, human-reviewed documents, a live
tracker, and real people behind every step."*

---

## Visual foundations

- **Concept:** *floating paper on a soft field.* The page is a pale blue-grey
  135° gradient (`#E7ECF7 → #EDF1F9 → #E8EEF9`) with two enormous blurred indigo
  blobs. Content sits on it as white cards. **Hierarchy comes from elevation and
  whitespace, not borders and rules.**
- **Colour:** one brand family, **Indigo** — `--indigo-600 #3B41C9` default,
  `500` hover, `700` pressed, `100`/`50` tints. Five status tones (green, amber,
  red, indigo-info, grey), each a text + tint + line triplet. Max 1–2 background
  colours per surface. No purple-blue hero gradients, no invented colours — add
  to `tokens/colors.css` first.
- **Type:** **Poppins** only, weights 400/500/600/700, `display=swap`. Composite
  `--text-*` tokens carry the full `font` shorthand. Body is never letter-spaced;
  only uppercase micro-type is tracked.
- **Spacing:** 4px base scale (`--space-1..10`). Cards pad 24px; sidebar
  14px/10px; form field→label 6px.
- **Radii:** anything that reads as a **control** is a capsule (`999px` — buttons,
  selects, chips, toggles, pills). Surfaces are 12–28px; the page card is 28px
  (`--radius-card`), inputs 16px, checkbox 7px.
- **Borders:** 1px default (`--line`); 1.5px checkbox/ghost button; 2.5px
  focus-visible; 3px active conversation rail. The floating-card hairline is
  `1px solid rgba(23,35,58,.05)`.
- **Shadows:** ink-hued (`rgba(23,35,58,…)`) — `--shadow-card` resting → `--elev-2`
  default card → `--elev-3` prominent. The **one exception**: hover on
  interactive brand elements uses an indigo hue (`rgba(59,65,201,…)`).
- **Backgrounds:** flat white cards; recessed rows `--subtle`; glass appears in
  exactly two places (the sidebar and modal scrims — `blur(22px) saturate(1.5)`).
  Marketing hero adds an animated masked grid. No textures, no patterns on
  content surfaces.
- **Motion:** `--ease: cubic-bezier(.4,0,.2,1)`; 120–140ms colour, 160–180ms
  hover/menu, 200–260ms toggle/card/bubble. **Card hover lifts `translateY(-3px)`;
  button press `scale(.97)`; chip hover `translateY(-1px)`.** Every animation
  maps to a state change and every one is disabled under `prefers-reduced-motion`.
- **Hover / press:** primary buttons darken (600→500→700); ghost fills with
  `--indigo-100`; borders shift to `--indigo-line`. Fields get a 3px `--indigo-100`
  focus glow.
- **Imagery:** photography only for place (Lithuania) and ambience — always
  `.webp`, radius 12–14px, warm-neutral, lazy-loaded below the fold.
  Illustrations are flat vector, on-palette, no text inside the art.

---

## Iconography

- **Library:** **Lucide** (outline, `strokeWidth` default, `currentColor`). It is
  the only icon dependency. Sizes are contextual: 12–13px inline meta, 14px
  buttons/rows, 15–16px card headers, 17px stage icons, **20px sidebar nav**,
  26–28px empty states. Colour: `--indigo-600` active/branded, `--ink-faint`
  passive, `--ink-soft` body-level, the status token when carrying status.
- In this design system the React components take icons as `ReactNode` **props**,
  so you pass whatever glyph you like. The specimen cards and UI kits use inline
  lucide-shaped SVGs (self-contained). When building production screens, install
  `lucide-react` or link Lucide from CDN and pass `<IconName size={…} />`.
- **The brand mark** is a downward **double-chevron** — the "way down / the path
  forward". It ships as an app-icon squircle (`assets/logo-mark.svg` indigo,
  `logo-mark-tint.svg` light, `logo-glyph.svg`) plus PNGs. The wordmark is the
  glyph + "AfaqWay" set in Poppins 700; there is **no separate wordmark vector** —
  render the word in type. Never recolour, stretch, rotate or reconstruct the
  lockup.
- **Emoji / unicode as icons:** never. Every decorative icon is `aria-hidden`;
  icon-only buttons carry an `aria-label`.

---

## Components

React primitives (bundled to `window.AfaqWayDesignSystem_898d90`). Import via
`const { Button } = window.AfaqWayDesignSystem_898d90` in card HTML, or copy the
`.jsx` into production and `import` it.

**Core** (`components/core/`)
- **Button** — the capsule button; primary / ghost / neutral / destructive.
- **Pill** — the one label / badge / tag / chip; five tones, optional delta.
- **Status** — the 24-state status vocabulary → five tones; live states animate.
- **Card** — the generic 28px floating surface.
- **Cards** — the five card roles: **FeatureCard, InfoCard, CompactCard,
  StatCard, ActionCard**. Use one; do not invent a sixth.
- **Divider** — hairline separator, optional centred label.
- **Loader** — the one spinner (a swirling indigo arc).
- **BentoGrid** / **BentoCard** — asymmetric white-card highlight grid (indigo
  icon tile, title, description, col/rowSpan), hover-lifts like other cards.

**Forms** (`components/forms/`)
- **Controls** — the one control set: **Input, TextArea, Select, Toggle,
  Checkbox**. Every field carries a leading icon; the error slot is reserved.

**Feedback** (`components/feedback/`)
- **MetricCard** — the one statistics tile (pastel header, watermark, trend).
- **Accordion** — the FAQ / support expander (measured-height animation).
- **AlertDialog** — the platform's default dialog shell (media + title +
  description + footer, built on `<Button>`), used for every confirmation and
  destructive action.
- **Dialog** — the general-purpose modal (settings, forms, previews):
  header/title/description/footer, a bordered tinted footer bar, and a corner
  close (X). Same overlay shell as `AlertDialog`; use `AlertDialog` instead for
  confirmations/destructive actions.
- **Toast** — the one push notification. `toast({ type, title, description })`
  fires from anywhere (success/info/warning/error/loading tones); mount
  `<Toaster/>` once to render the bottom-right stack. No provider needed.
- **EmptyState** — icon (swappable per call site) + title + description +
  `EmptyState.Actions`; the one empty-frame pattern (no documents, no results,
  no messages).
- **Skeleton** — shimmer loading placeholder for text/avatar (`circle` for
  avatars); disabled under reduced motion.
- **MorphingDialog** — `MorphingDialogTrigger`/`Content`/`Close`: a card that
  expands in place into a full dialog (FLIP from the trigger's own rect). For
  dashboard cards (university, program, document…) that open into detail.
  Applied to every document row in the Workspace Documents screen.
- **GooeyStack** — collapsible notification card stack (peeking-edge collapse ↔
  spread-with-gap expand); sits atop the notification tray.

**Navigation** (`components/navigation/`)
- **MegaMenu** — top-bar nav with expandable dropdown panels (Product/
  Resources-style: heading + icon/label/description links) or plain links.
  For the marketing site header; more tabs/pages to follow.
- **FloatingToolbar** — a floating group of icon actions (rich-text formatting,
  selection toolbars); equal spacing, minimal separators, one active state.

**Communication** (`components/communication/`)
- **Bubble family** — `BubbleGroup`, `Bubble`, `BubbleContent` (7 tones:
  default/secondary/muted/tinted/outline/ghost/destructive), `BubbleReactions`.
  The advisor ↔ student chat bubble, on a white thread background.
- **Message family** — `MessageGroup`, `Message`, `MessageAvatar`,
  `MessageContent`, `MessageHeader`, `MessageFooter` — the row wrapper around
  `Bubble` (avatar, sender/timestamp meta). Used by the Workspace kit's
  Messages screen.

Each component directory has a `<Name>.d.ts` props contract and a
`@dsCard`-tagged specimen HTML. Buttons, cards and the control set carry
`@startingPoint` tags.

---

## UI kits

Full-screen, interactive recreations that **compose** the primitives above.

- **`ui_kits/workspace/`** — the **Student Workspace**: glass sidebar, Overview
  (stat tiles + journey progress + tasks), My Journey (stage navigator + step
  timeline), Documents (requirement rows), and a live advisor chat. Click the nav
  and the message icon to move between screens.
- **`ui_kits/marketing/`** — the **marketing homepage** hero: pill nav, floating
  glass status widgets, the animated double-chevron, headline + CTAs, and the
  university trust marquee.

---

## Expanded foundation scales

The token layer now carries full SaaS-grade ramps alongside the original
component-facing tokens (nothing already built changed colour/size — the old
names are unchanged; the new ones extend them):

- **Colour:** `tokens/colors.css` adds 50→950 scales for **Primary** (indigo),
  **Secondary** (a desaturated slate-blue — deliberately not a second brand
  hue), **Neutral**, **Success**, **Warning**, **Danger**; **Info** and
  **Accent** alias the Primary ramp (one brand hue, two roles).
- **Surfaces:** `tokens/surfaces.css` — surface-0/1/2/3, floating, modal,
  popover, dropdown, sidebar (glass), header, footer, highlight.
- **Type:** `tokens/typography.css` adds Display XL/Display, H1–H6, Title,
  Subtitle, Body Lg/Body/Body Sm, Caption, Overline, Helper, Code (system mono —
  no brand mono font supplied).
- **Radius:** `tokens/radius.css` — xs/sm/md/lg/xl/2xl/3xl/pill/circle.
- **Shadows:** `tokens/shadows.css` — xs/sm/md/lg/xl/floating/modal/popover/
  hover/pressed, still one ink hue (+ the one brand-hued hover exception).
- **Effects:** `tokens/effects.css` — border strengths, opacity, blur, named
  motion durations, z-index scale.

Specimen cards: `guidelines/colors-primary.html` (tabbed, all scales),
`guidelines/surfaces.html`, `guidelines/typography-scale.html`,
`guidelines/motion-effects.html`, updated `radius.html` / `elevation.html`.

**Scope note:** a from-scratch request asked for the full Linear/Stripe/Notion-
grade system — every input/nav/feedback/data-display/media/communication/auth
component, every layout, every pattern, full a11y + responsive docs. This pass
covers the **foundation token layer** at that fidelity. The **component
library** stays scoped to what the actual AfaqWay codebase defines (Button,
Pill, Status, the 5 card roles, Controls, MetricCard, Accordion, Loader,
Divider) — building the full 100+ component wishlist would mean inventing
components with no counterpart in the real product. Tell me which families to
add next (e.g. Tabs, Dialog, Tooltip, DataTable, Command Palette) and I'll
build them against these same tokens.

## Surface system v2 — mandatory global redesign (supersedes "Floating Paper on a Soft Field")

A later, explicit brief mandated a **complete replacement** of the original
codebase-grounded surface system with a calmer, matte "premium operating
system" language (Apple HIG / Arc / Linear-inspired), applied globally rather
than as an opt-in variant. Because every component and the two UI kits consume
the same named tokens, this was done **by redefining the token values**, not
rewriting each screen — the whole system migrated in one place:

- **Background:** `--paper` and the workspace `--sw-gradient` are now flat matte
  (`#F5F6F8`, no gradient) and `--blob-1`/`--blob-2` are transparent — the
  ambient indigo blobs are gone.
- **Borders:** `--line`, `--line-soft`, `--card-border` all moved to
  near-invisible, low-contrast values.
- **Shadows:** `--shadow-card`/`--elev-1..3`/`--elev-hover` are now atmospheric —
  larger blur, lower opacity, no hard edge (`tokens/shadows.css`).
- **Buttons:** a new `--radius-control` (18px) replaces the capsule as the
  default — the `<Button>` component and the five Card roles' inline action
  buttons all moved to it. **Pill (`--radius-pill`, 999px) is now reserved** for
  chips, status/Pill badges, segmented tracks and the chat composer capsule
  (the last one is a deliberate, documented exception in the original
  design.md and stays that way).
- **Sidebar:** now reads its glass/blur/shadow from tokens
  (`--surface-sidebar`, `--blur-lg`, `--shadow-lg`) instead of hard-coded
  literals, and its radius moved to `--radius-2xl` (24px) per the new
  navigation spec.
- **Cards:** the five card roles' base radius moved from 16px to 24px
  (`--radius-2xl`); the page card stays 28px; dialogs get a new 32px
  (`--radius-dialog`).

**This explicitly supersedes the earlier "ground truth wins, keep capsule
buttons" decision** — the user's later brief was an explicit mandatory
override, stated as a complete replacement, not an addition.

**Scope note:** the brief named the whole product surface (Admin, Auth,
Settings, Calendar, Payments, Document Center, Learning Modules, Email
Builder…) — none of those exist as built screens in this system (only the
Student Workspace and Marketing kits were ever built, matching what the real
codebase defines). The token migration applies everywhere automatically, and
both existing kits were re-pointed at the new tokens; the screens that don't
exist yet would need to be built new against this same v2 foundation when
there's real source or content for them.

## Surface & visual language — reconciling the aspirational spec

A second brief asked for an Apple/Linear/Notion-grade surface language (flat
matte background, floating white cards, near-invisible borders, elevation-led
hierarchy, generous whitespace, one geometric shape language). Most of it
**already matches** what's grounded in the real product and needed no change:
the paper background, `--card-border` hairline, ink-hued soft shadows,
elevation-led hierarchy, reduced-motion-safe subtle motion, and the empty-state
pattern (illustration + headline + description + action) are all already how
AfaqWay is built.

What was genuinely new got added as tokens: `--radius-dialog` (32px, one step
past the 28px card, for dialogs/floating panels — see
`guidelines/radius-map.html`), `--shadow-dialog`/`--shadow-small/medium/large`
aliases, and `tokens/icons.css` (icon sizes 16–32px + 32/40/48/56px containers).

**One deliberate non-adoption:** the spec suggests 16px rounded-rect buttons and
12px chips. The real AfaqWay product already committed to **capsule controls**
(`--radius-pill`, 999px) for buttons, chips, selects and toggles — ground truth
wins over a generic suggestion, so controls stay capsules. The 14 "card
variants" it lists (Profile, Timeline, Message, Payment, University, Program,
Document, Notification…) all fit inside the product's real **five card roles**
(Feature/Info/Compact/Stat/Action) by content, not shape — use those, don't add
new card components for each noun.

## Foundations (Design System tab)

Specimen cards live in `guidelines/` (Colors, Type, Spacing) and the brand cards.
They render live from the real tokens.

---

## Index / manifest

```
styles.css              global entry — @imports fonts + tokens + base.css
base.css                class layer the components render against (.af-*, .ds-*, .mc-*, .acc-*, .card)
tokens/
  fonts.css             Poppins @import
  colors.css            surfaces, text, brand indigo, status, overlays, gradient
  typography.css        Poppins + composite --text-* tokens
  spacing.css           spacing scale, radii, elevation, motion, layout widths
components/
  core/                 Button, Pill, Status, Card, Cards, Divider, Loader
  forms/                Controls (Input, TextArea, Select, Toggle, Checkbox)
  feedback/             MetricCard, Accordion
guidelines/             foundation specimen cards
ui_kits/
  workspace/            student workspace recreation
  marketing/            marketing homepage recreation
assets/                 logos (svg + png), illustrations, Lithuania + ambience imagery
thumbnail.html          homepage tile
SKILL.md                Agent-Skill entry point
```

---

## Intentional additions & substitutions

- **Poppins is Google-hosted** (via `@import` in `tokens/fonts.css`) — the
  codebase loads it the same way, so no binary font files are shipped. If you
  need self-hosted Poppins, drop the `.woff2` files in `assets/` and add
  `@font-face` rules.
- **Icons** are passed as props (not baked in) so the system stays lucide-native
  without bundling an icon library; specimen cards/kits use inline SVGs.
- The `Controls` and `Cards` files each export several primitives — the compiler
  exposes every capitalised export, so `Input`, `Select`, `FeatureCard`, etc. are
  all directly available on the namespace.
