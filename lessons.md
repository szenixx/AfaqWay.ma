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

## Supabase migrations (Journey engine, 26 Jul 2026)
- Never reference `auth.users` from a public table. The SQL editor role often lacks
  REFERENCES on that schema, and because the editor runs the script as one batch,
  a single failed FK rolls back EVERY table. Store `user_id uuid` plus an index.
- Never wrap `CREATE POLICY` in a `DO $$ … $$` block. One failure aborts the whole
  block and the error gives no location. Use plain `drop policy if exists` +
  `create policy` pairs so each statement is independent and re-runnable.
- Avoid keyword-ish column names: `position`, `repeat`, `next`, `previous`, `comment`.
  Use `sort_order`, `repeat_rule`, `prev_value`/`next_value`, `review_comment`.
- Never put `\i` includes in a file meant for the Supabase SQL editor. `\i` is
  psql-only and does nothing there. Concatenate for real.
- Ship migrations split into numbered sections (01…08 + 99_verify) so a failure can
  be isolated in one run instead of guessing.

## RLS is row-level, not column-level (Journey review, 26 Jul 2026)
Row Level Security answers "may this user touch this row", never "may they set
this value". A student owns their own `journey_progress` row, so the policy that
lets them submit a step also let them set `state = 'completed'` and approve
themselves, defeating the entire review workflow. The same hole existed on
document verification and on stage approvals (INSERT was theirs, so they could
insert an already-approved stage and unlock the roadmap).
- Whenever a row is owned by the person the workflow is meant to constrain, add a
  BEFORE INSERT **and** BEFORE UPDATE trigger that pins the fields they must not
  control. Policies alone are not enough.
- Guard triggers must let privileged roles through (`service_role`, `postgres`),
  or the SQL editor and any server-side task get silently reverted, and the
  revert is invisible: the write "succeeds" and returns 204.
- Test authorisation by ATTEMPTING the forbidden write and re-reading the row.
  A 200/204 response proves nothing.

## One shape, one source (Journey content blocks, 26 Jul 2026)
Admin-authored content vanished for students because a generic editor form wrote
a shape the renderer never read: an accordion saved as `data: {}` and rendered
as nothing. The block "saved successfully" every time, so nothing looked broken.
- When an editor and a renderer exchange free-form JSON, define the shape in ONE
  module that both import (`src/lib/journeyBlocks.ts`), with a normalizer per
  kind. Never let each side guess the field names.
- Give every content type its own editor. A single form covering ten kinds is
  how the mismatch happens in the first place.
- Seed new blocks with starter data so a freshly added block always renders.
- Keep normalizers backward compatible (accept the old string shape) so content
  authored before the change keeps working.
- Skip empty blocks at render time; a blank gap looks like a bug to the user.

## Presence is about the person, not the panel (Chat, 26 Jul 2026)
The green dot was wired to `online={u.id === sel}`, so a student looked "online"
purely because an administrator had opened their conversation. Presence must
come from a real signal (a Supabase presence channel every signed-in workspace
joins), never from local UI state. If an indicator claims a fact about the
outside world, it has to be fed by the outside world.

## Never let two stores own the same data
The Schedule module wrote to localStorage while the admin side expected to read
it, which is unbuildable: an advisor could never see a student's calendar and
nothing survived a new device. When a feature needs to be shared, it needs a
table from the start, not a browser store that gets "upgraded later".

## supabase-js returns ONE channel per topic (presence crash, 26 Jul 2026)
`supabase.channel("same-topic")` hands back the *same* object to every caller.
Two components each doing `.on(...).subscribe()` therefore throws
"cannot add `presence` callbacks after subscribe()", and the second component
crashes the page. Reproduced and fixed by making presence a module-level
singleton: one channel, listeners attached once before subscribe, components
only read from a roster. Any shared realtime topic needs the same treatment.

## Ownership is a column, so RLS alone cannot express it (Schedule, 27 Jul 2026)
A student's calendar holds events created by the advisor, the platform and the
country as well as their own. RLS grants write access per ROW (user_id =
auth.uid()), which would have let a student edit or delete an advisor's event
sitting on their own calendar. The rule "you may only change what you created"
is a column comparison, so it needs a BEFORE INSERT/UPDATE trigger plus a
narrowed DELETE policy. Same shape as the journey guards: policy for the row,
trigger for the field.

## Build native, do not bolt on a second design system (27 Jul 2026)
CLI components (shadcn, Magic UI, Animate UI) are Tailwind-first. Installing one
into this repo would have initialised Tailwind and shadcn beside ds.css, leaving
two styling systems in the same tree. When a prompt names a package, treat it as
a reference for the EXPERIENCE and rebuild it natively:
- Accordion: animate a measured height, then hand it back to `auto` so long
  answers still reflow. `inert` on the collapsed panel keeps it out of tab order.
- Marquee: two identical runs translated by exactly one run length loops with no
  visible seam, in pure CSS, off the main thread. Axis switches by media query.
- Video: show a poster and mount the iframe only when the dialog opens, so no
  third-party frame or cookie loads on arrival.

## The Excel is the source; the importer is the structure (27 Jul 2026)
Journey content now comes from Bachelor-Journey-stages-lt.xlsx via
`scripts/import-journey.mjs`, which emits an idempotent SQL migration.
- Match stages/steps by TITLE and update in place. Never delete-and-reinsert:
  `journey_progress.step_id` cascades, so a re-import would erase every
  student's progress.
- Content blocks are safe to replace wholesale (nothing references a block id);
  they are tagged `data.source = 'xlsx'` so hand-added blocks survive.
- Facts that already exist elsewhere (programme URL, fees, English tests) are
  NOT copied into the Excel. A `program` block names the field and resolves it
  from the programme catalogue at read time, so it cannot go stale.
- Re-run after any Excel change: `node scripts/import-journey.mjs`.

## RequestTimeTooSkewed is a clock problem, not a storage problem (27 Jul 2026)
Uploads worked but every signed URL returned 403 RequestTimeTooSkewed. The host
clock was 36 minutes fast; SigV4 rejects anything beyond 15 minutes.
- Diagnose by comparing `date -u` with a `Date:` response header from the
  service, not by reading storage code.
- The AWS SDK self-corrects for skew only after a live request fails. Presigning
  makes no request, so the bad time is baked into the URL and only fails when
  the link is opened.
- Setting `client.config.systemClockOffset` after construction does NOT reach
  the presigner. Pass `signingDate` to `getSignedUrl` explicitly.
- Verify by reading `X-Amz-Date` out of the generated URL and comparing it with
  real time, not just by checking the response code.

## SECURITY DEFINER makes current_user useless for authorisation (27 Jul 2026)
`journey_privileged()` returned TRUE for an ordinary student, silently disabling
every guard built on it. Cause: the function is SECURITY DEFINER, so
`current_user` is the function's OWNER (postgres), never the caller — the
`current_user in ('postgres', ...)` branch matched for everyone.
- Never authorise on `current_user` inside a SECURITY DEFINER function.
- To tell a web request from a migration or psql session, read
  `current_setting('request.jwt.claims', true)`: PostgREST always sets it, the
  SQL editor never does.
- Test a privilege helper by CALLING IT as an unprivileged user
  (`POST /rest/v1/rpc/<fn>`) and checking the value, not by reading the SQL.
- Migration 11's guard depends on this function; it was applied before 09, so
  its triggers were live but toothless. Note cross-migration dependencies in the
  file header.
