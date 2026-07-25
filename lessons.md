-  Review lessons /lessons.md at session start for relevant project.


## /admin has its own design system (2026-07-20)
- /admin uses a SEPARATE "floating dashboard" design language, NOT the student/marketing DS.
  Scoped `.adm-*` classes in globals.css: `.adm-root` (light #EBEEF4 canvas + blurred
  oversized LogoMark in `.adm-bg`), `.adm-shell` (one big rounded floating container),
  `.adm-sidebar` (floating rounded panel: workspace switcher card, grouped nav, active item
  = its own white selection card `.adm-item.active`, footer groups for Reports/Messages and
  account/logout), `.adm-main` (gap-separated floating modules, whitespace not dividers).
- Do NOT revert /admin to the flat sidebar. Every /admin page renders inside this shell.

## Notification sound is shared + deliberately long (2026-07-20)
- All platform notification sounds go through `src/lib/notify.ts` → `playChime()` (a loud,
  clear 3-note ascending chime, ~1s) and `notify(title, body)` (chime + browser Notification).
  Do not reintroduce a short single beep. Used by admin reports + both sides of chat.

## Zoho email: bound the SMTP attempt (2026-07-20)
- `send-update` must make ONE SMTP attempt with a hard timeout (Promise.race). Looping over
  multiple hosts/ports made hanging TCP connects stack and blow the function time budget →
  client saw "Failed to send a request to the Edge Function". Always return HTTP 200 with
  {ok,error} so the chat shows the real SMTP reason. Actual delivery depends on Zoho account
  SMTP settings (app-specific password / region), which is outside the code.

## Email provider = ZeptoMail (2026-07-20)
- `send-update` sends via **ZeptoMail** (Zoho transactional): host smtp.zeptomail.com, port 587
  (STARTTLS) / 465 (SSL), username is the LITERAL string `emailapikey`, password = the ZeptoMail
  API token, From = a verified afaqway.com sender (noreply@afaqway.com). Verified working ({ok,sent:1}).
  Plain Zoho SMTP (smtp/smtppro.zoho.com) returned 535 — do not use it; use ZeptoMail.
- Auth emails (signup verification / invitation) should ALSO use this ZeptoMail SMTP with
  noreply@afaqway.com, set in Supabase Dashboard → Authentication → SMTP Settings (removes the
  built-in "email rate limit exceeded"). That's a dashboard setting — not changeable via tools.
- Edge-function boot: import mailer via `npm:nodemailer`, NOT `deno.land/x/denomailer` (the
  deno.land import is flaky at cold start → 503 "Failed to send a request to the Edge Function").

## Design system directive (2026-07-20)
- From now on, ALL new UI follows the **/admin floating design system** (scoped `.adm-*`: rounded
  floating modules, soft elevation, blurred logo canvas, generous whitespace, pill controls) — even
  outside /admin. E.g. the dashboard desktop-advice banner is a floating rounded module (phone-only).

## /admin/dashboard uses iOS-26 Liquid Glass (2026-07-20)
- Dashboard cards/sidebar/header are translucent "Liquid Glass" (rgba white ~.5 + backdrop-blur
  ~26px saturate + inset highlight + soft shadow) floating over a refractive backdrop (gradient +
  two blurred colour blobs on .dash-root). This is the dashboard-only system; do not flatten it.
- Admin sidebar "Dashboard" is an expandable group → Overview + Wallet (routes /admin/dashboard/*).

## Storage: one gateway, server-side R2 (2026-07-25)
- ALL uploads go through `uploadUserFile` (`src/lib/storage/client`) → `POST /api/upload`
  → `src/services/storage.service.ts` → Cloudflare R2. Never call `supabase.storage.upload`
  again, never write files into the project, never presign in the browser.
- `src/lib/r2.ts` is server-only (S3 client + credentials). Browser code must import
  `@/lib/storage/client` instead — importing `@/lib/r2` from a component is a build error.
- Keys are `users/<ownerId>/<folder>/<uuid>.<ext>`; access control is a prefix check, so an
  admin sending a file to a student must upload with `ownerId: <studentId>` or the student
  cannot read it back. See docs/storage.md.

## One control set for the whole platform (2026-07-25)
- Inputs, dropdowns, toggles and checkboxes come from `@/components/ds`
  (`Input`, `TextArea`, `Select`, `Toggle`, `Checkbox`) and are styled once in
  `src/app/ds.css` (`.af`, `.af-select`, `.af-toggle`, `.af-check`). Never hand-roll
  a field, a `<select>`, a switch or a checkbox again — and never add a second variant.
- Every field carries a leading icon from `fieldIcon(name)` / `iconForLabel(label)`.
  One concept = one glyph, 17px, platform indigo.
- Cards have five roles (`FeatureCard`, `InfoCard`, `CompactCard`, `StatCard`,
  `ActionCard`). Metric tiles everywhere render `StatCard`.
- Deliberate exceptions, do not "fix" them: the chat composer (`.af-composer`, the
  capsule IS the field) and the admin dashboard glass system (`.dash-*`).
- Reference: docs/design-system.md.

## Chat = one shared component set (2026-07-25)
- Admin and student chats share `src/components/chat/parts.tsx` and the `.chat-*` CSS.
  Never restyle one side alone, change the shared part.
- `/admin` already zooms 110% via `.adm-root`; do NOT add `.chat-zoom` there (it compounds
  to 121%). `.chat-zoom` is for the student workspace chat only.
- `StudentProfileModal` shows only real profile data. Where the platform has no source
  (offers received, deadlines), it says "Not tracked yet" instead of inventing a number.

## Student sidebar mirrors the admin one (2026-07-25)
- The workspace sidebar follows the shadcn "sidebar" geometry ported onto our tokens:
  256px expanded / 60px icon-only, 34px rows, 8px radius, flat tint on hover+active,
  group label fades out when collapsed, tooltips on the right. Toggle = PanelLeft button
  or ⌘/Ctrl+B; state persists in the `sidebar_state` cookie.
  the brand row — the same control and placement as `/admin`. It no longer hides entirely,
  so there is no "reopen" button in the top bar.
- Nav states: default transparent/neutral · hover light indigo wash + indigo ink + 1px lift ·
  active = the single `.sw-navpill` element that SLIDES between items (measured from the
  active button) with a left accent bar, indigo ink and 600 weight. Never two active items.
- Sidebar illustrations live at `public/document/{1,2,3}.png` (cache-busted with `?v=`).
  Bump the `?v=` in SidebarCarousel whenever they are replaced.
