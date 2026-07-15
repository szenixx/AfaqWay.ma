# Vartai — Theme & Design System

> **Scope:** colour, type, icons, top-bar chrome, flags, and reusable components only.
> **Not in this file:** page layout, sidebar, or any per-page structure — that comes with each request.
> Domain: a study-abroad agency for students applying to universities overseas (documents, deadlines, applications, visas, university programs).

Use this file as the single reference for *how anything looks* on any Vartai page. When a new page is requested, its structure will be described separately — style every element in it using the tokens and components below.

---

## 1. Design DNA

1. **Document dossier, not an app.** Cool official paper background, white cards, hairline borders. Calm, credible, a little formal — this is a platform handling passports and university admissions, not a consumer toy.
2. **One accent: indigo.** Marks the active/primary thing only — primary button, active state, links, focus ring.
3. **Strict traffic light for status.** Grey → Indigo → Amber → Red → Green is the *only* status vocabulary on the platform. Every application, document, and step state maps to one of these five.
4. **Circle-housed status icons.** Every status icon lives inside the same circular badge; only the interior glyph changes. This is the platform's one recognizable icon signature — keep it everywhere a state is shown.
5. **Thin outline icons, confident type.** 1.75px stroke, rounded caps, no fills except inside filled/selected surfaces.

---

## 2. Colour tokens

### 2.1 Neutrals — paper & ink

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#ECEFF3` | Page background |
| `--card` | `#FFFFFF` | Cards, top bar, dropdowns, any raised surface |
| `--subtle` | `#F3F5F9` | Input fill, hover wash, skeletons |
| `--ink` | `#17233A` | Primary text |
| `--ink-soft` | `#5A6B85` | Secondary text, icons at rest, descriptions |
| `--ink-faint` | `#8695AB` | Hints, placeholders, meta labels, disabled |
| `--line` | `#DCE2EA` | Default 1px border |
| `--line-soft` | `#E7ECF1` | Inner dividers |
| `--shadow-card` | `0 2px 10px rgba(23,35,58,.04)` | Optional whisper of depth on cards |

### 2.2 Accent — indigo

| Token | Hex | Use |
|---|---|---|
| `--indigo-700` | `#22407F` | Pressed / active state of any primary control |
| `--indigo-600` | `#2B4C9B` | **Primary.** Buttons, links, focus border, selected states |
| `--indigo-500` | `#3D63B4` | Hover of primary |
| `--indigo-100` | `#EAEFFA` | Tint — ghost fill, selected-row wash, focus ring glow |

### 2.3 Status — the only status language on the platform

Every status has **three tones**: text, tint (background), line (border). Text on a tint always uses the dark tone from its own family — never plain black.

| Status | Text | Tint | Line | Meaning |
|---|---|---|---|---|
| **Grey** | `#8695AB` | `#F1F4F7` | `#DCE2EA` | Not started / locked |
| **Indigo** | `#2B4C9B` | `#EAEFFA` | `#BFCDEB` | Applied / submitted |
| **Amber** | `#8A5A0C` | `#FBF0DA` | `#E7C583` | Under review / pending / deadline |
| **Red** | `#B23B27` | `#FBE7E2` | `#EDB3A6` | Needs changes / rejected / error |
| **Green** | `#256B49` | `#E3F0E9` | `#9CCBB2` | Approved / done |

This is a closed set. No other colour represents state anywhere on the platform.

---

## 3. Typography

Single font, every role: **Poppins.** (Confirmed platform choice — weight and size carry hierarchy instead of a font pairing.)

```css
--font-sans: 'Poppins', system-ui, sans-serif;
```

| Role | Size / Line | Weight | Colour | Example |
|---|---|---|---|---|
| Page title | 26–28 / 34 | 700 | `--ink` | "Tell us about you" |
| Section title | 17–19 / 24 | 600 | `--ink` | "Personal details" |
| Body | 14.5–15.5 / 24 | 400 | `--ink` / `--ink-soft` | Descriptions, paragraphs |
| Label | 13 / 20 | 500 | `--ink` | Field labels |
| Eyebrow | 11.5 / 16, `.1em` caps | 600 | `--indigo-600` | "Step 2 of 4" |
| Section eyebrow | 10.5 / 14, `.08em` caps | 600 | `--ink-faint` | "PERSONAL DETAILS" divider label |
| Button | 14–15 / 20 | 600 | per variant | "Continue", "Upload document" |
| Status pill | 10.5 / 14, `.05em` caps | 600 | per status | "Under review" |
| Hint / caption | 12 / 17 | 400 | `--ink-faint` | Helper text under a field |
| Meta / micro | 10 / 14, `.05em` caps | 600 | `--ink-soft` | Card meta, timestamps |

---

## 4. Iconography

### 4.1 System rules

- Style: **outline only**, `stroke-width: 1.75`, `stroke-linecap: round`, `stroke-linejoin: round`, no fill except white glyphs on filled/coloured surfaces.
- Canvas: 20×20 native grid (scale the `viewBox`, never the stroke — re-draw at 1.5px stroke for anything rendered ≤16px so it doesn't look heavier than the rest of the UI).
- Size scale: **14** inline-with-text · **16** hints/list rows · **18** buttons · **20** top bar / status glyph · **28–32** status badge housing.
- Colour: `--ink-soft` at rest, `--ink` on hover/active text pairing, `--indigo-600` when the icon itself is the active/selected marker, white when sitting on a filled colour surface. **Status icons always take their status colour**, never the neutral default.

### 4.2 Status icon set — the core of the platform

Five states, one shared shape language: a **circle housing** (the badge) with a distinct glyph inside. Use the badge at 28–32px wherever a status needs a standalone marker (document rows, application steps, checklists); use just the glyph at 16–20px inline next to a pill label.

**① Not started — grey**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="10" cy="10" r="7"/>
</svg>
```
Empty ring — deliberately the quietest glyph in the set.

**② Applied / submitted — indigo**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.5 2.5 2 9.6l6 2.3 2.3 6L17.5 2.5Z"/>
  <path d="M10.3 11.9 13.7 8.5"/>
</svg>
```
A paper plane — something was sent and is in flight.

**③ Under review / pending — amber**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="10" cy="10" r="7"/>
  <path d="M10 6.5v3.7l2.6 1.7"/>
</svg>
```
A clock — someone else is looking at it now.

**④ Needs changes / rejected — red**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="10" cy="10" r="7"/>
  <path d="M10 6.7v4M10 13.6h.01"/>
</svg>
```
Alert-in-a-circle — matches the pending-notice glyph already used in the profile form, kept consistent platform-wide.

**⑤ Approved / done — green**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="10" cy="10" r="7"/>
  <path d="M7 10.3 9.2 12.5 13.3 7.8"/>
</svg>
```
Checkmark-in-a-circle — same check path already used for the completed step in the progress rail.

**Badge wrapper (any size):**
```css
.status-badge{
  width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:var(--tint); color:var(--text); border:1.5px solid var(--line);
}
```
Swap `--tint` / `--text` / `--line` for the status's three tokens from §2.3.

### 4.3 Domain icon library

Same stroke rules as §4.1. This is the recurring vocabulary for a study-abroad product — reach for these before inventing new glyphs.

**Document**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 2.5h6l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"/>
  <path d="M12 2.5V6h3.5"/>
</svg>
```

**Upload**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5"/>
  <path d="M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"/>
</svg>
```

**Passport / ID**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2.5" width="10" height="15" rx="2"/>
  <circle cx="10" cy="8" r="2"/>
  <path d="M8 13h4"/>
</svg>
```

**Diploma / academic**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 8l8-4 8 4-8 4-8-4Z"/>
  <path d="M6 10v4c0 1 1.8 2 4 2s4-1 4-2v-4"/>
</svg>
```

**Deadline / calendar**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="14" height="13" rx="2"/>
  <path d="M3 8h14M7 2.5v3M13 2.5v3"/>
  <circle cx="10" cy="12.5" r="1.3"/>
</svg>
```

**Chat / support**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 4.5h14v9H8l-4 3.5v-3.5H3Z"/>
</svg>
```

**Phone / WhatsApp**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 3.5c0-.6.4-1 1-1h2.3c.5 0 .9.3 1 .8l.7 2.6c.1.4 0 .8-.3 1.1L7.4 8.3a11 11 0 0 0 4.3 4.3l1.3-1.3c.3-.3.7-.4 1.1-.3l2.6.7c.5.1.8.5.8 1V15c0 .6-.4 1-1 1h-1C9.8 16 4 10.2 4 4.5Z"/>
</svg>
```

**Email**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/>
  <path d="M3 5.5 10 11l7-5.5"/>
</svg>
```

**Payment**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2.5" y="5" width="15" height="10" rx="2"/>
  <path d="M2.5 8.5h15"/>
</svg>
```

### 4.4 Top-bar icons

**Search**
```svg
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
  <circle cx="9" cy="9" r="6"/><path d="M17.5 17.5 14 14"/>
</svg>
```

**Notification bell**
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2.5a5 5 0 0 0-5 5v3l-1.5 3h13L15 10.5v-3a5 5 0 0 0-5-5Z"/>
  <path d="M8 16.5a2 2 0 0 0 4 0"/>
</svg>
```

**Messages** — reuse the Email icon (§4.3).

**Settings / gear**
```svg
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="10" cy="10" r="2.6"/>
  <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 12.6l-1.4 1.4M15.4 15.4l-1.4-1.4M6 7.4 4.6 6"/>
</svg>
```

**Dropdown chevron**
```svg
<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 8l5 5 5-5"/>
</svg>
```

**Log out**
```svg
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 3H4.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H8M12 6l4 4-4 4M16 10H8"/>
</svg>
```

---

## 5. Top bar

*(Chrome only — the icon cluster, font, and profile module. Navigation/sidebar is defined per page, not here.)*

- Height **60px**, background `--card`, 1px `--line` bottom border, no shadow — flat and quiet.
- Font throughout: Poppins, per the scale in §3.

**Right-hand icon cluster, left to right:**

| Element | Spec |
|---|---|
| Search | 320–380px, `--subtle` fill, no border, radius `10px`, magnifier 16px + placeholder "Search" 13px `--ink-faint` |
| Notification bell | 20px, `--ink-soft`. Unread → 6px solid `--indigo-600` dot, top-right of the glyph |
| Messages | 20px, `--ink-soft`, same unread-dot convention |
| Divider | 1px `--line`, 24px tall, 12px margin either side |
| **Profile module** | see below |

**Profile module (right-most):**

```
[avatar 36px circle, 2px --card ring] [name 13/600 --ink] [role 11/500 --ink-soft] [chevron 12px --ink-faint]
                                        stacked, left-aligned
```

Clicking it opens a dropdown panel:
- `--card` surface, 1px `--line` border, `--shadow-card`, radius `12px`, min-width 200px, 6px offset below.
- Menu rows: 36px tall, `icon 16px + label 13/500 --ink-soft`, padding `0 12px`, radius `8px`.
  - Hover → `--indigo-100` wash, label colour `--ink`.
  - Typical rows: **My profile**, **Settings** (gear icon), **Language** (flag chip, §6), a 1px `--line-soft` divider, then **Log out** in `--red` text + red logout icon — the one red item in the whole menu, deliberately, since it's the one destructive action there.

---

## 6. Country flags

Flags appear in three contexts: destination picker, phone country code, language switch. One component, three sizes.

| Size | Where | Render |
|---|---|---|
| **42×30** | Destination picker cards | Real flag asset (SVG/PNG), `border-radius:5px`, `1px solid rgba(0,0,0,.08)`, `overflow:hidden` |
| **24×18** | Top bar language switch, list rows | Same asset, `border-radius:3px` |
| **16×12** | Native `<select>` options (phone country code) | Emoji flag glyph — native selects can't render custom SVGs inside `<option>`, so emoji is the correct fallback here, not a compromise |

**Rendering fallback (only for flags without an asset on hand):** stack thin `<i>` bars in a flex column to approximate the flag's stripes, e.g. Lithuania's yellow/green/red tricolor as three horizontal `<i>` divs inside the flag container. Use this only as a stopgap — prefer a real flag asset once available.

**States:**
- Default: full colour, no filter.
- Unavailable / "coming soon" destination: `filter: grayscale(.55)`, container `opacity:.72`.
- Selected: flag container gets a `1.5px solid var(--indigo-600)` outer card border (the flag image itself is never tinted).

**Rule:** flags are the one place actual national colours override the closed palette in §2 — same exception as any other real-world brand mark. They must never be recoloured to fit the indigo theme.

---

## 7. Buttons

| Variant | Fill | Text | Border | Typical use |
|---|---|---|---|---|
| **Primary** | `--indigo-600` | `#FFFFFF` | none | Continue, Submit application, Upload |
| **Ghost** | transparent → `--indigo-100` hover | `--indigo-600` | 1.5px `--indigo-600` | Back, Save draft |
| **Neutral** | `--subtle` | `--ink-soft` | 1px `--line` | Cancel, Skip for now |
| **Destructive** | `--red` | `#FFFFFF` | none | Delete draft, Withdraw application |

Height **40–44px** (form-flow CTAs run slightly larger than compact UI buttons), radius **12px**, label 14–15/600, padding `0 20px`.
Hover: Primary → `--indigo-500`. Pressed: Primary → `--indigo-700`. Disabled: 40% opacity, no pointer.

---

## 8. Status pill / badge

Text form (inline in a list or table):
```css
.pill{
  font: 600 10.5px/1 var(--font-sans); letter-spacing:.05em; text-transform:uppercase;
  padding:5px 12px; border-radius:999px; border:1px solid;
  color:var(--text); background:var(--tint); border-color:var(--line);
}
```
`Not started` (grey) · `Applied` (indigo) · `Under review` (amber) · `Needs changes` (red) · `Approved` (green).

Icon+text form (checklist rows, document lists): the 28–32px circle badge from §4.2 on the left, label to its right at 13.5/500 `--ink`, optional caption below at 12/400 `--ink-faint`.

---

## 9. Form fields

```css
input, select, textarea{
  font-family: var(--font-sans); font-size:14.5px; color:var(--ink);
  background:var(--subtle); border:1px solid var(--line); border-radius:12px;
  padding:12px 14px;
}
input:focus, select:focus, textarea:focus{
  outline:none; border-color:var(--indigo-600); background:var(--card);
  box-shadow:0 0 0 3px var(--indigo-100);
}
```
Label: 13/500 `--ink`, 6px above the field. Hint: 12/400 `--ink-faint`, 6px below. Optional-field marker: `(— optional context)` in `--ink-faint` appended to the label, same pattern used for "exactly as written in your passport".

---

## 10. Cards & surfaces

```css
.card{
  background:var(--card); border:1px solid var(--line);
  border-radius:16px; box-shadow:var(--shadow-card); padding:24–28px;
}
```
That's the entire surface language: one radius, one border colour, one whisper shadow. Nesting a card inside a card is avoided — use a `--line-soft` divider instead.

---

## 11. Spacing & radius

Base unit **4px** → `4·8·12·16·20·24·32·40`.

| Token | Value |
|---|---|
| `--radius-sm` | `8px` — small chips, dividers |
| `--radius-md` | `12px` — inputs, buttons, selection cards |
| `--radius-lg` | `16px` — page-level cards |
| `--radius-pill` | `999px` — status pills, avatars |

---

## 12. Motion & states

| State | Rule |
|---|---|
| Hover | `--indigo-100` wash or `filter:brightness(1.05)`, 120ms ease-out |
| Focus-visible | `2.5px solid var(--indigo-600)` outline, 2px offset — required on every interactive element |
| Disabled | 40–45% opacity, `cursor:not-allowed` |
| Loading | `--subtle` skeleton block, matching radius, 1.4s shimmer |
| Transition | 120–200ms `cubic-bezier(.4,0,.2,1)`. Respect `prefers-reduced-motion`. |

---

## 13. Copy voice — canonical status vocabulary

Use these five words exactly, everywhere, for every application/document/step. Never invent a synonym mid-product ("Pending" one place and "In progress" another breaks the system):

**Not started · Applied · Under review · Needs changes · Approved**

Buttons: single active verbs — *Continue, Upload, Save draft, Withdraw*. Hints explain what happens next, not what the system did internally. Sentence case everywhere except pills and eyebrows, which are uppercase with letter-spacing.

---

## 14. Drop-in tokens

```css
:root{
  --paper:#ECEFF3; --card:#FFFFFF; --subtle:#F3F5F9;
  --ink:#17233A; --ink-soft:#5A6B85; --ink-faint:#8695AB;
  --line:#DCE2EA; --line-soft:#E7ECF1;
  --shadow-card:0 2px 10px rgba(23,35,58,.04);

  --indigo-700:#22407F; --indigo-600:#2B4C9B; --indigo-500:#3D63B4; --indigo-100:#EAEFFA;

  --grey:#8695AB;  --grey-tint:#F1F4F7;  --grey-line:#DCE2EA;
  --indigo-text:#2B4C9B; --indigo-tint:#EAEFFA; --indigo-line:#BFCDEB;
  --amber:#8A5A0C; --amber-tint:#FBF0DA; --amber-line:#E7C583;
  --red:#B23B27;   --red-tint:#FBE7E2;   --red-line:#EDB3A6;
  --green:#256B49; --green-tint:#E3F0E9; --green-line:#9CCBB2;

  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-pill:999px;
  --font-sans:'Poppins', system-ui, sans-serif;
}
```

Font import:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 15. Checklist before styling any new page

- [ ] Only colours from §2 appear — flags (§6) are the sole exception.
- [ ] Every status uses exactly one of the five canonical words and its matching icon + colour trio.
- [ ] Status icons keep the circle-housing convention; never a bare unhoused glyph for a state.
- [ ] All icons are outline, 1.75px stroke (or 1.5px below 16px), rounded caps.
- [ ] Top bar stays flat, 60px, no shadow; profile dropdown is the only place a red "Log out" appears.
- [ ] Radius comes from the 4-value scale — no invented corner sizes.
- [ ] Focus ring visible on every interactive element.
