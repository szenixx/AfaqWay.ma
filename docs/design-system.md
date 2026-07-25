# Platform design system — components

Colour, type, spacing and radius come from
`design/AfaqWay-Design-System` (mirrored verbatim into `src/app/ds.css`).
This file covers the **components** every page must use. There is one of each;
building a second variant anywhere is a bug.

Import everything from `@/components/ds`.

## Controls

| Component | Use for | Shape |
| --- | --- | --- |
| `Input` | every editable text field | rounded rect (16), 44px min height, leading icon |
| `TextArea` | multi-line text | same, icon pinned to the first line |
| `Select` | every selection: country, city, university, degree, program, faculty, intake, language, currency, status, filters, sorting, admin controls | capsule (999), leading icon, chevron far right, animated menu |
| `Toggle` | every boolean: notifications, email/SMS preferences, permissions, feature enable/disable, program visibility | slim pill track, circular thumb, **X** when off, **✓** when on |
| `Checkbox` | terms, privacy, filters, permissions, bulk actions, multi-select, confirmations | rounded square, fills indigo with a centred check |

States are built in: default, hover, focus, filled, error, disabled. Errors
render below the field in a reserved line, so showing one never shifts layout.

```tsx
<Input label="Email" icon={fieldIcon("email")} value={email} onChange={…} error={err} />
<Select label="Country" icon={fieldIcon("country")} value={code} onChange={setCode} options={…} />
<Toggle checked={on} onChange={setOn} label="Email me" />
<Checkbox checked={agreed} onChange={setAgreed} label="I agree to the Terms" />
```

Raw `<input className="af">` still picks up the shared look (`ds.css` styles
`.af` directly), but new code should use the components so it gets the icon,
label and error line too.

## Icons in fields

`fieldIcon(name)` is the single source: name→User, email→Mail, phone→Phone,
password→Lock, nationality→Flag, country→Globe, city→MapPin,
university→Landmark, faculty→Building2, degree→GraduationCap, program→BookOpen,
intake/dob→Calendar, language→Languages, currency→Coins, scholarship→Award,
passport→BookUser, document→FileText, search→Search, filter→Filter,
status→CircleCheck.

For labels that come from data (the onboarding flow registry, admin filters) use
`iconForLabel(label)` — it keyword-matches the same vocabulary. All icons render
at 17px in the platform indigo and stay visible whether the field is empty or
filled.

## Card roles

| Component | Role |
| --- | --- |
| `FeatureCard` | featured country / university / scholarship / program / blog, homepage highlights. Cover, badge, title, description, primary action, optional bookmark |
| `InfoCard` | university, program, country, housing, transport, banking, healthcare, student services. Thumbnail, title, supporting text, metadata, action |
| `CompactCard` | quick tips, notifications, timeline, FAQs, dashboard widgets, recent activity, requirements. Icon, title, short description |
| `StatCard` | metric tiles in both workspaces. Large number, title, trend, icon |
| `ActionCard` | continue application, upload documents, complete profile, contact advisor, explore countries. Icon, title, description, CTA |

The workspace `StatTile` and the admin `Stat` both render `StatCard`, so metric
tiles are identical across the platform.

## Composite exceptions (deliberate)

- **Message composer** (`.af-composer`) — the capsule wrapper *is* the field, so
  its inner input is intentionally bare. One class, shared by the student and
  admin chats.
- **Admin dashboard** (`.dash-*`) — the iOS-26 Liquid Glass surface is its own
  documented system; it consumes the same controls but keeps its glass cards.
- **Onboarding choice chips** — `Segmented` and the multiselect chips are
  radio/multi-select *layouts*, not checkboxes; converting them would change the
  onboarding flow, which is out of scope for a restyle.

## Rules

1. Never introduce a second toggle, dropdown, input or checkbox style.
2. Never hand-roll a tinted button — use `BtnGhost tone=` (workspace) or the
   card/control components.
3. Radius scale is closed: 8 / 12 / 16 / 999.
4. Motion is 120–200ms `var(--ease)`, and every animation is disabled under
   `prefers-reduced-motion`.
5. If a page does not already have one of these controls, do not add one.

## Chat workspace

Both chats are the same product, built from `src/components/chat/parts.tsx`
(`ChatAvatar`, `MessageBubble`, `UploadingBubble`, `PanelCard`, `ChatEmpty`) and
styled by the `.chat-*` block in `ds.css`.

| | Admin (`/admin` → Messages) | Student (`/dashboard` → Messages) |
| --- | --- | --- |
| Columns | conversations · chat · info panel | chat · info panel |
| Header | student avatar/name/email → opens `StudentProfileModal` | AfaqWay Advisor + advisor id + support@afaqway.com |
| Quick actions | Email / Pin / WhatsApp / Question toggles above the thread | none |
| Info panel | Pinned updates + Documents (`PanelCard`) | identical |
| Zoom | inherits `.adm-root`'s 110% | `.chat-zoom` (110%), fills the workspace |

Empty states use the platform illustrations at
`public/illustrations/empty-pinned.png` and `empty-documents.png`.

`StudentProfileModal` is the standard student overview for the admin workspace:
header (avatar, badges, Track journey → the student's plan module, WhatsApp
dropdown with copy/open), then Overview / Academic / Application / Documents
tabs. Everything shown is real profile data; fields the platform does not track
yet say so instead of showing invented numbers.

## Workspace sidebar

One reusable nav item (`navItem` in `WorkspaceShell`): leading icon, label,
optional badge (far right), optional progress bar (My Journey). States:

- **Default** — transparent background, neutral icon and text.
- **Hover** — light indigo wash, indigo icon and text, 1px lift, 240ms.
- **Active** — the shared `.sw-navpill` slides to the item (320ms) carrying the
  tint, soft shadow and left accent bar; icon and label turn indigo at 600
  weight. Exactly one item is ever active.

Collapsed mode (`.sw-sidebar.mini`, and automatically between 1024–1279px) is
icon-only at 84px with labels returning as hover tooltips; the toggle sits in
the brand row, matching `/admin`.

## Workspace right panel

`RightPanel` (`src/components/student/workspace/RightPanel.tsx`) is 28% of the
workspace, sticky while the module scrolls, and shown in **Journey** and
**Documents** only. Its four cards are each exported and reusable on their own:
`UniversityCard`, `MiniCalendarCard`, `JourneySnapshotCard`,
`DocumentsOverviewCard`, plus a shared `ProgressBar`.

All values are real: university/program/tuition/language from the student's
onboarding answers, stage and progress from the journey source, document counts
from the document source, and the calendar's upcoming event from their latest
conversation update. Tablet narrows the panel to 34%; below 1024px it moves
under the main content.
