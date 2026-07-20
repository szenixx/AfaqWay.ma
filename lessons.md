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
