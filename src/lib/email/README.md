# Email system

Resend is the only email provider. There is no ZeptoMail, no SMTP transport, no
second provider to fall back to — one credential (`RESEND_API_KEY`), one HTTP
API, one code path.

## Architecture overview

```
                         ┌─────────────────────┐
 browser (admin action)  │  lib/email/client.ts │  "use client" — never sees RESEND_API_KEY
                         └──────────┬───────────┘
                                    │ fetch, with the caller's Supabase JWT
                                    ▼
                         ┌─────────────────────┐
      API routes         │ app/api/email/*     │  admin-only (requireCaller().isAdmin)
                         └──────────┬───────────┘
                                    ▼
                         ┌─────────────────────┐
   orchestration         │  lib/email/send.ts   │  renders React → html+text, resolves
                         │  lib/email/service.tsx│ sender, writes email_log, retries
                         └──────────┬───────────┘
                        ┌───────────┴───────────┐
                        ▼                       ▼
              ┌──────────────────┐   ┌──────────────────────┐
              │ lib/email/resend/ │   │ lib/email/utils/log.ts│  → public.email_log
              │  Resend HTTP API  │   │  (service-role client) │  (Supabase, RLS admin-only)
              └──────────────────┘   └──────────────────────┘

              ┌──────────────────────────────────────────┐
              │ lib/email/templates/*  (React Email JSX)   │
              │   built from lib/email/components/*        │  ← shared component library
              └──────────────────────────────────────────┘

              ┌──────────────────────────────────────────┐
              │ app/api/email/webhook  ← Resend (Svix-signed)│  delivered/opened/clicked/bounced
              └──────────────────────────────────────────┘

              ┌──────────────────────────────────────────┐
              │ app/dev/emails  (dev-only)                 │  preview every template, no sending
              └──────────────────────────────────────────┘
```

Two contracts hold the whole thing together, both carried over unchanged from
the pre-Resend version of this system:

- **Never throws.** Every send resolves to a typed result
  (`{status:"sent"|"skipped"|"failed"}`). A missing `RESEND_API_KEY` is
  "skipped," a real Resend error is "failed" — neither one ever throws into
  the workflow that triggered the email (a step approval, a payment review),
  and neither is silently swallowed either.
- **The browser never holds the key.** `lib/email/client.ts` is the only
  thing client components import; it posts to an API route with the caller's
  own Supabase access token, and the route decides whether that person may
  send anything at all (`caller.isAdmin`). The actual `RESEND_API_KEY` only
  ever loads in `lib/email/resend/client.ts`, which has `import "server-only"`.

## Folder structure

```
src/lib/email/
  send.ts              the one function templates/routes call to actually send
  service.tsx           channel-based dispatch for the generic /api/email route
                        (channels: "announcement", "advisor" — kept from the
                        old services/email.service.ts so its callers didn't change)
  senders.ts            the 7 sender identities + senderFor()/replyToFor()
  tokens.ts              literal brand colours/font/radius (CSS vars don't work in email)
  types.ts               EmailContent, TemplateMeta, SendEmailInput/Result

  resend/
    client.ts           raw fetch to api.resend.com — the ONLY file that touches the key
    provider.ts          retry policy (429/5xx retried, 4xx isn't), emailConfigured()

  utils/
    serviceClient.ts     service-role Supabase client for email_log writes
    log.ts                logEmailQueued() / updateEmailLog() / lookup by provider id
    paragraphs.tsx        splits free-text message bodies into email-safe <p> blocks

  components/            the shared library every template assembles from:
    Layout, Header, Footer, Button, StatusBanner, AlertBox, InformationCard,
    UserInfoSection, JourneyStatusCard, PaymentSummary, Divider, SocialLinks

  templates/
    auth/                 the 6 Supabase dashboard template types + Welcome
    advisor/               advisor chat email, journey decision email
    notifications/          platform announcements
    billing/                payment receipt
    admin/                  reserved, empty — no admin-facing email exists yet

  i18n/
    locales.ts             Locale type, getDictionary() (falls back to English)
    en.ts / fr.ts / ar.ts / de.ts

  preview/
    registry.ts             every template + mock props, read by /dev/emails

  client.ts                 "use client" — emailAnnouncement/emailAdvisorMessage/
                            emailPaymentReceipt/emailJourneyDecision

src/app/api/email/
  route.ts                  POST (channel-based send) + GET (diagnostics), admin-only
  payment-receipt/route.tsx  structured receipt send, admin-only
  journey-decision/route.tsx  structured decision send, admin-only
  webhook/route.ts            Resend delivery/open/click/bounce events (Svix-signed)

src/app/dev/emails/
  page.tsx / EmailPreviewClient.tsx / [id]/route.tsx   dev-only template browser

docs/email/supabase-templates/*.html   generated exports, see "Supabase auth emails" below
```

## The 7 sender identities

Defined in `senders.ts`, built as `<name>@${NEXT_PUBLIC_EMAIL_DOMAIN}`:

| id | address | repliable | used for |
|---|---|---|---|
| `noreply` | noreply@ | no | — |
| `notifications` | notifications@ | no | platform announcements (journey updates, documents, maintenance) |
| `advisor` | advisor@ | yes | advisor chat emails, journey decision emails |
| `support` | support@ | yes | fallback reply-to for every non-repliable sender |
| `billing` | billing@ | no | payment receipts |
| `security` | security@ | yes | reserved — no trigger uses it yet |
| `admin` | admin@ | no | reserved — no trigger uses it yet |

A non-repliable sender's `Reply-To` still routes to `support@`, so a reply is
never silently dropped even from an unattended address (`replyToFor()`).

**Adding an 8th sender:** add one entry to the `SenderId` union and the object
literal in `SENDERS()` in `senders.ts`. Nothing else needs to change — every
consumer resolves a sender by id, never by hardcoding an address.

## Adding a new template

1. Create `src/lib/email/templates/<category>/<Name>Email.tsx`. Export a
   default component and a `meta: TemplateMeta` (`{id, version, category}`) —
   `id` is what shows up in `email_log.template_version`, `version` should
   bump whenever the rendered output changes in a way worth distinguishing
   later.
2. Build it from `../../components` (`Layout`, `Header`, `Footer`, `Button`,
   ...) and `../../tokens` for any raw color/spacing — never a hex value or a
   `var(--...)` typed by hand, email clients don't resolve CSS custom
   properties.
3. Add it to `src/lib/email/preview/registry.ts` with mock props, so it shows
   up at `/dev/emails`.
4. Call `send()` from wherever the real trigger lives — usually a new small
   API route (see `payment-receipt/route.tsx` for the pattern: admin-only via
   `requireCaller`, structured JSON body, `send({to, sender, subject, react,
   template})`), plus a matching helper in `client.ts` if a browser component
   needs to call it.

## Adding a Supabase auth email

Supabase Auth's 6 template types (Confirm signup, Invite user, Magic Link,
Change Email Address, Reset Password, Reauthentication) live in
`templates/auth/`, but Supabase renders and sends these itself — Resend and
this app's own `send()` never touch them. Getting them branded takes two
manual steps in the Supabase Dashboard (nothing here can reach that
dashboard, so these steps can't be automated):

1. **Authentication → Emails → SMTP Settings** — turn on custom SMTP and
   point it at Resend's SMTP relay, so Supabase's own sends go through the
   verified `afaqway.com` domain instead of Supabase's shared/rate-limited
   default mailer:
   - Host: `smtp.resend.com`, Port: `465` (or `587`)
   - Username: `resend`
   - Password: the `RESEND_API_KEY` value
   - Sender: `AfaqWay <noreply@afaqway.com>`
2. **Authentication → Emails → Templates** — for each of the 6 types, paste
   the matching file from `docs/email/supabase-templates/*.html`. Those files
   are generated output, not hand-written: they're the real
   `VerificationEmail`/`ResetPasswordEmail`/etc. components rendered with
   Supabase's own `{{ .ConfirmationURL }}` / `{{ .Token }}` / `{{ .Email }}` /
   `{{ .NewEmail }}` placeholders left in as literal text, so Supabase fills
   them in at send time exactly like it would its own default template.
   Regenerate a file after editing its component:
   ```
   curl "http://localhost:3000/dev/emails/auth-verification?supabase=1" \
     -o docs/email/supabase-templates/auth-verification.html
   ```
   (dev server must be running; the route 404s outside `NODE_ENV=development`).

`WelcomeEmail` is **not** a Supabase template — it's sent by this app's own
code right after a student's account is confirmed, through the normal
`send()` path like any other template here.

## Testing locally

- **`/dev/emails`** — browse every template with mock data, toggle HTML/plain
  text. Nothing on this page ever calls Resend; it only renders. Dev-only
  (`NODE_ENV !== "development"` → 404), so it's unreachable once deployed.
- **`GET /api/email`** (admin-signed-in) — diagnostics: whether a provider is
  configured, and a live, side-effect-free check that the API key actually
  authenticates against Resend.
- **A real send** — the fastest path is triggering a real workflow action
  (approve a payment, decide a journey step with the email toggle on, send an
  advisor chat message) against a Resend-verified recipient, then checking
  `email_log` for the resulting row.

## Environment variables

See `.env.example` for the authoritative list. Summary:

| var | required | purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | without it, every send resolves `{status:"skipped"}` |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | no (defaults `afaqway.com`) | sender domain |
| `NEXT_PUBLIC_APP_URL` | no (defaults `https://afaqway.com`) | absolute links/images inside emails |
| `SUPABASE_SERVICE_ROLE_KEY` | no | without it, `email_log` writes are skipped (warned once); sending is unaffected |
| `RESEND_WEBHOOK_SECRET` | no | without it, `/api/email/webhook` rejects every event (503) — the safe default for an unverified inbound endpoint |

`RESEND_API_KEY` should be a **Sending access** scoped key, not Full access —
it only ever needs to call `POST /emails`. This is deliberately supported,
not tolerated: `resend/client.ts`'s `resendVerify()` calls `GET /domains` to
confirm the key works, and a Sending-access key correctly gets refused there
with a 401 `restricted_api_key` — that response is treated as a pass (it
proves the key is valid; an actually-dead key gets a different error), not a
failure. If a future change to Resend's error shape ever breaks that check
again, sending itself is unaffected either way: `sendViaResend()` never calls
`verifyProvider()`, so a false "unreachable" from the diagnostics route
(`GET /api/email`) is never a reason mail actually stopped going out — check
`email_log` for real send outcomes before assuming the integration is down.

## Analytics: what's real vs. what's a gap

- **Delivery status, failed-delivery logging** — real. Every `send()` call
  writes a `queued` row to `email_log` before calling Resend, then patches it
  to `sent`/`failed`/`skipped` with the error message if any.
- **Retry handling** — real. `resend/provider.ts` retries once immediately
  and once backed off, only on 429/5xx (never on a 4xx validation error,
  which would just fail identically again).
- **Open/click tracking, delivered/bounced/complained** — real, but requires
  a manual step this app can't do for itself: add a webhook endpoint in the
  Resend dashboard pointing at `/api/email/webhook`, subscribed to
  `email.delivered` / `.opened` / `.clicked` / `.bounced` / `.complained`,
  and copy its signing secret into `RESEND_WEBHOOK_SECRET`.
- **`email_log` needs a service-role key.** Its RLS only grants
  INSERT/UPDATE to `current_is_admin()`, but sends happen from every kind of
  caller context (a student's own action, a Supabase auth hook with no JWT at
  all). Without `SUPABASE_SERVICE_ROLE_KEY`, logging is skipped — silently,
  once, with a console warning — while sending itself keeps working.

## i18n

`getDictionary(locale)` (`i18n/locales.ts`) merges a locale's partial
dictionary over the English base, so a half-translated locale still renders
complete — any missing key falls back to English rather than showing blank.
Only English (`en.ts`) is fully filled in; `fr.ts`/`de.ts`/`ar.ts` carry a
handful of real translations for the shared footer strings, enough to prove
the mechanism renders correctly, not full coverage. Template body copy itself
(the actual subject lines and paragraphs) is still hardcoded English in each
component — wiring a `locale` prop through to swap that is future work, this
just makes sure the plumbing won't need to change shape when it happens.
Arabic is RTL; the dictionary mechanism doesn't solve that by itself — no
shared component currently mirrors its layout under `dir="rtl"`.

## Known gaps (flagged, not silently skipped)

- **Unsubscribe.** `Footer` takes an optional `unsubscribeUrl` and simply
  omits the line when it's not passed, rather than link to a page that
  doesn't exist. There's no preferences/unsubscribe flow in the app yet —
  needed before `AnnouncementEmail` goes to any list beyond individually
  targeted sends.
- **Reset Password's destination page.** `resetPasswordForEmail()` is real
  (wired to the "Forgot password?" button on `/signup`), but there is no
  "set new password" page for its link to land on — worth building before
  relying on the branded Reset Password template end-to-end.
- **Magic Link / Invite / Reauthentication** are branded because Supabase's
  dashboard has a fixed slot for each regardless of app usage, not because
  any current flow calls them — `signInWithOtp`, `admin.inviteUserByEmail`,
  and `reauthenticate` aren't called anywhere in the app today.
