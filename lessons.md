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
