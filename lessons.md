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

## RLS grants rows; it never grants columns (profiles, 27 Jul 2026)
The production audit found any student could rewrite their own profile row:
plan -> full_service, plan_status -> active (the paid plan, without paying),
banned -> false (un-ban themselves), plus user_number and email. The UPDATE
policy was right — you may edit your own row — but "which columns" is not
something a policy can say. Migration 15 pins the commercial and identity
fields in a BEFORE UPDATE/INSERT trigger.
Rule of thumb: any table where the row owner is also the person the business
rules constrain needs a column guard beside its policy. profiles, journey
progress, stage approvals, documents and schedule events all needed one.

## Prefix checks need a safe-key check beside them
`key.startsWith(ownerPrefix(id))` passed for "users/<me>/../../secret.pdf".
R2 keys are literal so it was not exploitable, but ownership by prefix is only
meaningful once the key cannot climb out of its prefix. Reject "..", leading and
double slashes, backslashes and control characters before comparing.

## Two components, one Supabase channel topic (28 Jul 2026)
Second occurrence of this bug class, after the presence one. supabase-js returns
the SAME channel object for a repeated topic, so a second `.on()` after the
first `.subscribe()` throws "cannot add postgres_changes callbacks after
subscribe()" and takes the page down. It appeared the moment `useNotifications`
was mounted twice at once — the sidebar badge and the Overview card.
Rule: a per-user realtime subscription inside a hook must be shared and
reference-counted at module level, never created per component. Assume any hook
that subscribes will one day be mounted twice, because a count shown in two
places is normal, not exotic.

## A badge that never reaches zero is reading sample data
The notification badge showed 3 on every account forever. The count came from
the demo NOTIFICATIONS array, while the Notifications module itself already read
the real table — so the two disagreed and nobody noticed.
Rule: when placeholder data is replaced by a real source, grep for every
importer of the placeholder and delete the export. Leaving it exported is what
lets a second component keep rendering fiction next to the truth.

## A spreadsheet has more than one header (Journey import, 28 Jul 2026)
`buildModel` read `rows[0]` as THE header. The Excel actually carries three, one
per section of the journey, and they do not agree: the Stage 3 header swaps the
`learn` and `upload req` columns. The importer therefore read Stage 3's prose as
a yes/no upload flag, dropped the 21 continuation rows that list each step's
required documents, and turned the two repeated header rows into phantom stages
called "Stage" containing a step called "Steps". Result: 16 steps imported out
of 36, and a whole stage published empty.
- Detect header rows anywhere in the sheet, not just at the top, and re-map the
  columns from each one.
- Do not trust the header alone. Classify each row by its own CONTENT — a cell
  matching `yes|no|required documents|no upload required` IS the upload column,
  whichever position it sits in. Two Stage 3 rows ignore their own section
  header and revert to the original order; only the content reveals that.
- A row with no title in the key column is usually a CONTINUATION of the row
  above, not a blank to skip. Skipping them is silent data loss: nothing errors,
  the import just quietly carries less.
- Print a per-step summary with counts on every run. "36 steps · 32 documents"
  is what catches this; "wrote the file" is not.

## Decode numeric XML entities, not just the one you saw (28 Jul 2026)
The xlsx reader handled `&#10;` but the file writes newlines as the HEX form
`&#xA;`. The entity survived decoding, so a URL regex ran straight through it
into the next line and produced a dead link:
`…watch?v=…&t=35s&#xA;Apply:`. It looked like a valid URL in the JSON and only
failed when clicked.
- Decode `&#\d+;` and `&#x[0-9a-f]+;` generically, and `&amp;` LAST so an
  escaped entity cannot become a live one.
- A Python `xml.etree` dump showed the newline correctly while the hand-rolled
  reader did not. When two parsers disagree about the same file, the hand-rolled
  one is wrong.

## Generate data, not statements (28 Jul 2026)
The generated migration emitted an INSERT/UPDATE pair per step and one INSERT
per block. The same rules payload appeared twice per step, the file was 112KB
for ~50KB of content, and there were four places for an edit to reach three of.
Emitting the journey as ONE jsonb document and looping over it in PL/pgSQL
halved the file and left one copy of every value.
- Idempotency belongs in the loop (`select … if null then insert else update`),
  not in repeated text.
- Same rule as components: if the generator writes it twice, extract it.

## "Who may complete this" is data, and needs enforcing twice (28 Jul 2026)
The engine's rule was "a student never completes their own step", enforced by
`journey_progress_guard`. The Excel names exceptions — "Display a prominent Mark
as Completed button … Do not require admin approval" — because nobody but the
student can know whether they attended their VFS appointment.
- Do not special-case titles in the UI. Put the mode on the step
  (`rules.completion` = review | self | decision) and read it in both places.
- The guard must read the same rule. A UI that hides a button is not a
  permission; the trigger is. It also stamps `completed_at` itself, so a client
  can never back-date a completion.
- `decision` additionally checks the caller's PLAN inside the trigger, because
  the Excel gives the outcome to Self Service students and to administrators
  only — that is authorisation, so it cannot live in a component.

## Queue the message even when nothing can send it (28 Jul 2026)
WhatsApp has no transport yet, and the temptation was to leave those events out
until it does. Instead every channel writes a row to `journey_outbox`; the sweep
delivers platform and chat, and parks whatsapp/email as `state = 'ready'`.
- Switching a channel on later is then draining a queue, not finding every
  caller. Nothing is lost and nothing is silently dropped.
- The caller names an EVENT, never a message. `journey_emit` is SECURITY DEFINER
  and reads the wording from `journey_templates`, so a student's browser can
  schedule its own reminders without being able to choose the words — and
  without a client-side "send a chat message as admin" hole.
- Reminders must fire with nobody looking, so the sweep is a pg_cron job. A
  client-side sweep would never send the 7-day reminder to the student who does
  not log in that week — exactly the student who needs it.

## Placeholder data, second occurrence (28 Jul 2026)
After the notification badge, the same class again: `JourneySnapshotCard` and
`DocumentsOverviewCard` read the `JOURNEY` / `REQUIRED_DOCS` demo constants, so
the sidebar quoted an invented 62% beside a Journey page showing the truth, and
the Overview showed a real percentage in a tile and a fake one in the panel
directly below it.
- When a real source lands, grep every importer of the placeholder and DELETE
  the export in the same change. Leaving it exported is what lets the next
  component render fiction.
- Deleting by line index is how a file gets corrupted; `git checkout` and cut on
  verified boundaries instead.

## Ask before building, when the source is silent (28 Jul 2026)
Stage 4 of the Excel says "Unlock Stage 5" four times. There are no Stage 5 rows
anywhere in the file. Inventing them would have been worse than the gap.
- Stopping to ask cost one question and settled three decisions at once.
- The answer became a DRAFT stage with no steps: the roadmap has somewhere to
  unlock into, and a student never reaches a blank page.

## Illustration placement is a layout decision, not a decoration (19 Aug 2026)
Three of the four corrections on the dashboard illustrations were about where an
image sits, never about the image itself: the student belonged between the copy
and the CTA rather than pinned to the right edge, cropped to face and upper body
rather than a full standing figure; the university facts wanted tuition above
duration, in slimmer frames.
- A generated asset is approved for its content, not its placement. Propose the
  placement in words BEFORE cutting and installing the file, because the crop
  and the export size follow from where it lands.
- A tall full-body figure in a 200px-high card is always going to read thin. If
  the maths says the visual will be ~70px wide, say so up front instead of
  shipping it and waiting for the correction.
- Facts that a student weighs hardest go on top. Cost before length.

## Generated visuals: never bake in what CSS must own (19 Aug 2026)
The support card needs a live "online" indicator. Prompting for a green status
light in the image would have made it a dead pixel, since the brief calls for a
real animated HTML element.
- Prompt the generator to LEAVE ROOM for anything that has to move, and say so
  when presenting the result.

## When a brief lists the sections, ask what gets dropped (19 Aug 2026)
The mobile dashboard brief named exactly four frames. I kept the utility panel
and Next Steps below them on the assumption that "do not add sections between
them" allowed extra sections after them. Two corrections followed: the panel is
not displayed on mobile, and Next Steps is hidden too.
- A brief that enumerates the sections is also telling you what is NOT there.
  When existing sections are missing from that list, ask in one line which are
  dropped instead of silently keeping them.
- Hiding is still the right mechanism: `display: none` inside the mobile query,
  never deleting the component, so desktop keeps every feature.

## A breakpoint is an architecture decision, not a number (19 Aug 2026)
The platform switched from desktop to mobile at 1023px, so every tablet, and a
half-size desktop window, got the phone build: sidebar hidden, mobile pill nav,
panels stacked. That was invisible for months because nobody resized a laptop
window below 1024.
- Grep the breakpoint census before touching responsive CSS:
  `grep -rhoE "max-width: ?[0-9]+px" src/app/*.css | sort | uniq -c | sort -rn`
  The counts tell you which numbers are load-bearing.
- Separate MODE switches (nav disappears, page restructures) from COMPONENT
  adjustments (a 2-col row becomes 1-col). Only mode switches belong on the
  one global boundary; component adjustments can sit anywhere.
- After moving a boundary, re-audit every query that now lands on the OTHER
  side of it. Rules written for "mobile" at 820/860/900px suddenly fire while
  the desktop shell is on screen.

## vw/vh in chrome is a slow leak (19 Aug 2026)
`clamp(300px, 23vw, 372px)` looks disciplined and is not: it grows the panel
continuously from 1304px to 1617px of viewport, so a 1366 laptop and a 1920
monitor render different products.
- Fix by pinning to the value the clamp already produced at the design
  baseline, so the baseline is untouched and only the growth stops.
- `vw`/`vh` are legitimate for the app shell and inside `max-width`/`min()`
  overflow guards. They are not legitimate for type, padding, control heights
  or panel widths.
