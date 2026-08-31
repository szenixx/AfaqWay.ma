# AfaqWay.com — Security Audit Report

**Scope:** Full application — Next.js 16 / React 19 frontend, Next.js API routes, Supabase (Postgres + Auth + Edge Functions), Cloudflare R2 storage, Resend email, Meta WhatsApp webhook.
**Method:** Static review of every API route, storage/auth library, and RLS-adjacent code, cross-checked against the **live production database** (Supabase project `AfaqWay.com`, ref `velotyulddiyjkruvlbk`) — actual RLS policies, actual trigger/function bodies, and Supabase's own security linter were pulled and read directly, not inferred from migration files alone.
**Not done:** no active exploitation/penetration testing against production, no dependency deep-dive beyond `npm audit`, no infra-layer testing (WAF, DNS, TLS config, hosting provider settings).

This is the audit-only phase. **No code has been changed.** Findings are ordered by severity; each has a concrete fix recommendation. Two items (SEC-01, SEC-02) need your decision before I touch anything, because "fixing" them changes real user-facing behavior.

---

## Overall Risk: **MEDIUM**

The headline finding (SEC-01) is genuinely High severity. Past that, the authorization architecture is unusually solid for what it protects — I went in expecting to find self-approval/privilege-escalation bugs in the payment and admin systems (the classic AI-assisted-app failure mode this brief warns about) and, after checking the *live* RLS policies rather than trusting the code's own comments, **did not find one**. That's worth taking at face value rather than either over- or under-stating.

---

## Findings

### SEC-01 — Every signup silently bypasses email confirmation
```
Severity: HIGH
Category: Authentication
Affected: Postgres trigger `trg_auto_confirm` → function `public.auto_confirm_user()`,
          fires BEFORE INSERT on auth.users (live DB — not in any repo migration)
```
**Problem:** A database trigger unconditionally sets `email_confirmed_at := now()` on every new `auth.users` row, before Supabase's own email-confirmation flow ever runs. Confirmed live:
```sql
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers where action_statement ilike '%auto_confirm_user%';
-- trg_auto_confirm | INSERT | BEFORE | EXECUTE FUNCTION auto_confirm_user()
```
**Why it matters:** Anyone can sign up using an email address they don't own or control and get a fully active account instantly — no confirmation link, no proof of ownership. That account then receives payment receipts, journey decisions, and password-reset flows addressed to that email, and can be used to mass-create accounts with zero friction. This directly contradicts the documented intent elsewhere in this project ("email-confirm ON").
**I'm not fixing this without your say-so** because dropping the trigger is a real behavior change: if Resend isn't fully verified for every environment, or if the confirmation-email template/flow was never finished, removing this could lock every new signup out. Tell me which of these it is:
- (a) This was a deliberate, temporary bypass (e.g., email wasn't reliably delivering yet) → I'll drop the trigger and verify the real confirmation flow works end-to-end first.
- (b) This was never supposed to exist → same fix, plus I'll check whether any already-created "confirmed" accounts need re-verification.
- (c) It's intentional and staying → I'll leave it, but recommend at minimum verifying the email address through some other channel before it's trusted for anything sensitive.

---

### SEC-02 — Dependency: Next.js 16.2.10 carries 6 High-severity advisories
```
Severity: HIGH
Category: Dependencies
Affected: package.json (next, and its own postcss/sharp)
```
**Problem:** `npm audit` reports, on the pinned `next@16.2.10`:
- Unauthenticated disclosure of internal Server Function endpoints
- Denial of Service in App Router Server Actions (and an unbounded payload variant on Edge runtime)
- SSRF in Server Actions on custom servers, and SSRF via rewrites with an attacker-controlled hostname
- Cache confusion of response bodies (two related CVEs)
- Middleware/Proxy bypass under Turbopack with a single locale
- (transitively) a PostCSS XSS/arbitrary-file-read cluster and a `sharp`/`libvips` cluster

**Fix:** `npm audit fix --force` resolves all 6 by moving to `next@16.3.3` — a patch-level bump within the same major, not the "mass dependency upgrade" this brief warns against. I have **not** run this yet. Recommend: run it, then `tsc`/`eslint`/a full click-through, since Next patch releases occasionally touch build output subtly.
**Lower priority, same command:** `brace-expansion`, `js-yaml`, `nanoid` also have High advisories, but they're dev/build tooling (eslint's own dependency tree), not shipped in the served app. `npm audit fix` (no `--force`) should clear these without touching `next`.

---

### SEC-03 — Hand-rolled, single-pass regex HTML sanitizer for admin-authored journey content
```
Severity: MEDIUM–HIGH (impact is high — reaches every student; likelihood is bounded by needing a valid admin account)
Category: XSS
Affected: src/lib/journeyBlocks.ts:245 sanitizeRichText()
Consumed by: src/components/student/workspace/journey/StepBlocks.tsx:165,295
```
**Problem:** `sanitizeRichText` strips dangerous HTML via five chained `.replace()` regex passes (strip `<script>`/`<style>`/etc., strip disallowed tags, strip event-handler attributes, neutralize `javascript:`/`data:` hrefs) rather than parsing the HTML and applying a real allow-list. This is a well-known fragile pattern — regex cannot correctly model HTML's actual (browser-specific, error-correcting) parsing behavior, and single-pass regex replacement is specifically vulnerable to nested-tag reconstruction tricks (e.g. a crafted `<scr<script>ipt>` can reassemble into a live tag after one pass strips the inner piece). I did not find a working bypass by hand, but "I couldn't break it in an hour" is a much weaker guarantee than "this is a parser-based allow-list," which is exactly why this class of hand-rolled sanitizer is what security guidance consistently tells people not to write themselves.

Contrast with `src/lib/markdown.ts` in the *same codebase*, which gets this right: it HTML-escapes the input **first**, then builds markup only from the escaped text, so no tag in its output can ever have come from unescaped user input. `sanitizeRichText` does the reverse (build, then sanitize).

**Why it matters:** `journey_blocks` write access is `is_admin()`-gated by RLS (verified live) — a student cannot write this content directly. So the realistic threat is a **compromised or malicious admin account** injecting a payload that executes in **every student's** browser when they view that step. Given Supabase sessions are stored in `localStorage` (see SEC-13), a successful hit here is a session-token theft vector, not just a defacement.
**Recommended fix:** replace `sanitizeRichText` with a real allow-list sanitizer (`isomorphic-dompurify` works both server- and client-side) configured to the same tag/attribute set it already targets. Small, contained change — one function, one new dependency already battle-tested for exactly this.

---

### SEC-04 — `community_members` is a SECURITY DEFINER view with dead but overly-broad grants
```
Severity: MEDIUM
Category: Database security
Affected: public.community_members (live DB, not in repo migrations)
```
**Problem:** Flagged by Supabase's own linter as an ERROR-level finding. The view unions non-banned `profiles` and `admins` rows (id, display name, avatar, created_at only — no email/plan/role) and runs as its creator's privileges, bypassing the underlying tables' RLS by design. Separately, `authenticated` (and `postgres`) have been granted **INSERT/UPDATE/DELETE/TRUNCATE** on this view — I checked, there's no `INSTEAD OF` trigger, so Postgres would refuse any of those operations on a compound `UNION ALL` view; **these grants are currently inert**, not exploitable.
**Why it matters:** The SECURITY DEFINER pattern itself is probably intentional here (it's the standard, correct way to expose a narrow public-facing slice of otherwise-private tables — the field list is already appropriately minimal), so I'm not flagging the view's *existence* as wrong. But (a) the linter wants a human to confirm that's deliberate, and (b) a read-only directory view should never carry write/truncate grants — if this view's definition is ever simplified later (dropping the `UNION`) those dead grants would suddenly become live.
**Recommended fix:** `revoke insert, update, delete, truncate on public.community_members from authenticated;` — leaves `SELECT` in place, zero behavior change, closes the door before it could ever open.

---

### SEC-05 — `admins`, `payments`, `payment_methods`, `profiles`, `messages` schemas/policies live only in the dashboard, not in version control
```
Severity: MEDIUM (process/governance, not a live exploit — see verification below)
Category: Database security / Git security
Affected: supabase/migrations/** (absence, not presence)
```
**Problem:** Every `CREATE TABLE`/RLS policy actually referenced by the app for these tables is missing from this repo's migrations — they were created directly in the Supabase dashboard/SQL editor. I confirmed this by diffing every table the app code queries against every table any migration file creates.

**I verified the live policies directly rather than leaving this as a guess**, since this is exactly the kind of gap this audit exists to catch:
```sql
-- payments: a student can only insert as under_review, and can only ever
-- move their own row to 'cancelled' or 'under_review' — never 'approved'.
payments_self_insert  (insert, check: auth.uid() = user_id AND status = 'under_review')
payments_self_cancel  (update, check: auth.uid() = user_id AND status IN ('cancelled','under_review'))
payments_admin_update (update, using/check: current_is_admin())   -- only path to 'approved'

-- admins: only an existing superadmin can write a row — no self-promotion path.
admins_super_write (all, using/check: current_is_superadmin())

-- messages: a student can only read/insert their own conversation, and can
-- never insert as sender='admin'.
messages_user_insert (insert, check: auth.uid() = user_id AND sender = 'user')

-- platform_updates: insert (which fans out a notification to EVERY user via
-- trigger) is superadmin-only.
platform_updates_write (all, using/check: is_superadmin())
```
**These are correctly designed.** The specific bypasses I went looking for — self-approving a payment, self-promoting to admin, spoofing a message as an advisor, mass-notification spam via `platform_updates` — are all properly blocked at the database level, independent of the frontend.

**Why it's still a finding:** none of this is reviewable, diffable, or reproducible from the codebase. A future "reset the database from migrations" only gets you `journey_*`/`notifications`/`schedule_events`/`platform_updates`/`revenue_goals` — the rest silently wouldn't exist, and any policy change made in the dashboard from here on leaves no audit trail.
**Recommended fix:** `supabase db dump --schema-only` (or Studio → Database → export) and commit the result for these 8 tables so they're under the same review process as everything else. No behavior change — pure documentation of what already exists.

---

### SEC-06 — No security headers configured anywhere
```
Severity: MEDIUM
Category: Security Headers
Affected: next.config.ts (currently an empty config object)
```
**Problem:** No `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, or `Permissions-Policy` anywhere in the app. This doesn't cause a vulnerability by itself, but it removes every layer of defense-in-depth against clickjacking, MIME-sniffing, and (most relevantly, given SEC-03) makes a CSP unavailable as a backstop against any XSS that does land.
**Recommended fix:** add a tailored header set via `next.config.ts`'s `headers()` — I'd want to enumerate every external origin the app actually loads from first (Supabase realtime websocket, R2/Cloudflare storage domain, any fonts/CDNs) before writing a CSP, exactly as the brief warns: a copy-pasted CSP would likely break Supabase's realtime connection or R2-hosted previews. This is a "do carefully, with testing" item, not a one-line fix.

---

### SEC-07 — SVG uploads allowed and served inline without forced download
```
Severity: MEDIUM (severity depends on the R2 bucket's public domain configuration, which I can't see from code)
Category: File Upload Security
Affected: src/lib/storage/validation.ts (ALLOWED_TYPES includes svg)
          src/services/storage.service.ts generatePublicUrl() — only sets
          Content-Disposition: attachment when `download` is explicitly requested
```
**Problem:** An uploaded `.svg` can contain an embedded `<script>` or event handlers. "Preview" (as opposed to "Download") requests a signed URL with no `download` param, so the object is served with its native `Content-Type: image/svg+xml` and no forced attachment — opening it in a new tab renders it as a live document.
**Why it matters:** Whether this is exploitable depends on the R2 bucket's public domain — if it's on the app's own domain or a domain that shares any trust boundary with it, this is a stored-XSS vector on receipts/documents (which any authenticated user can upload). If it's on an unrelated `*.r2.cloudflarestorage.com`-style domain, the blast radius is much smaller (still a phishing/redirect vector, not session theft).
**Recommended fix (pick one, both are small):** drop `svg` from `ALLOWED_TYPES` (documents/receipts/avatars have no real need for vector graphics), or always force `Content-Disposition: attachment` for `image/svg+xml` regardless of whether "download" was requested.

---

### SEC-08 — Several SECURITY DEFINER functions are directly callable via PostgREST RPC by `anon`/`authenticated`
```
Severity: LOW–MEDIUM (verified: none of the parameterized ones are actually exploitable — see below)
Category: Database security
```
**Problem:** Supabase's linter flags ~25 functions (every guard/trigger function, plus `advisor_reminder_sweep`, `journey_outbox_sweep`, `fanout_platform_update`) as callable via `/rest/v1/rpc/<name>` by roles that shouldn't need direct access to them.

**I pulled the live source of every one that takes parameters or does real (non-trigger) work, specifically looking for the classic "pass someone else's user id" bug:**
- `journey_cancel(p_cancel_key, p_user)` and `journey_emit(..., p_user, ...)` — both correctly ignore `p_user` unless the caller is already privileged (`journey_privileged()`); a normal caller always operates on `auth.uid()`. **No IDOR.**
- `mark_messages_seen(p_user_id)` — checks `is_admin() OR auth.uid() = p_user_id`, else returns `forbidden`. **No IDOR.**
- `react_to_message(p_message_id, p_emoji)` — checks the message's `owner_id = auth.uid()` OR `is_admin()`. **No cross-tenant access.**
- `send_user_message(...)` — always inserts with `user_id := auth.uid(), sender := 'user'`; cannot spoof sender or target. **No spoofing.**
- `advisor_reminder_sweep()` / `journey_outbox_sweep()` — take no parameters, process all due rows; idempotent by design (de-dupe checks), so repeated calls don't duplicate sends. Worst case if called by `anon` repeatedly is wasted compute (a mild availability concern), not data exposure.
- `fanout_platform_update()` — only fires as a trigger on `platform_updates` INSERT, which is itself superadmin-gated (SEC-05's verified policy) — an outside caller invoking the bare function directly has no `NEW` row to act on and errors out.

**Why it's still worth doing:** correct-by-luck (self-guarded internal logic) is weaker than correct-by-design (can't be called at all). This is the one item on this list that's pure hardening with zero behavior risk.
**Recommended fix:** `revoke execute on function public.<name> from anon, authenticated;` for the sweep/trigger functions, leaving `service_role`/`postgres` untouched. I'd batch this as one migration once you approve it — it's mechanical and low-risk, but I'd rather list every function once and run it as a single reviewed change than do it function-by-function live.

---

### SEC-09 — WhatsApp webhook accepts unverified payloads when `META_APP_SECRET` isn't set
```
Severity: LOW–MEDIUM
Category: API Security
Affected: supabase/functions/whatsapp-webhook/index.ts:111-121
```
**Problem:** Unlike the Resend webhook (`/api/email/webhook`, which fails closed — rejects everything if `RESEND_WEBHOOK_SECRET` is unset), the WhatsApp webhook logs a warning and **processes the payload anyway** if `META_APP_SECRET` isn't configured. If it's genuinely unset in production right now, anyone who finds the URL can inject fake inbound-message/status rows.
**Recommended fix:** mirror the Resend webhook's fail-closed pattern — reject with 401 rather than warn-and-proceed when the secret is missing. (First confirm `META_APP_SECRET` is actually set in the live environment; if it is, this is already inert.)

---

### SEC-10 — Supabase Auth's leaked-password protection is off
```
Severity: LOW
Category: Authentication
```
Flagged directly by Supabase's advisor. This checks new passwords against HaveIBeenPwned without ever sending the password itself (k-anonymity). It's a dashboard toggle (Auth → Policies), not a code change — the easiest fix on this whole list.

---

### SEC-11 — `storage-sign` edge function is deployed but unused
```
Severity: LOW
Category: Attack surface / dependencies
```
A second, complete presigned-upload/download implementation exists as a live edge function, superseded by the Next.js `/api/upload` + `/api/file-url` routes this app actually calls (confirmed: nothing in `src/` invokes `functions.invoke("storage-sign", ...)`). It authenticates correctly and isn't itself broken, but it's unnecessary attack surface — dead code that still runs. Recommend removing it, or documenting why it's kept if something outside this repo (a future mobile client?) depends on it.

---

### SEC-12 — Signed URL TTL is client-suppliable (clamped, not authorization-bypassing)
```
Severity: LOW
Category: API Security
Affected: src/app/api/file-url/route.ts, src/services/storage.service.ts
```
Any caller can request a signed URL valid for up to 7 days for a file they're already authorized to see (`assertCanAccess` still applies). Not an authorization bug — just means a leaked link stays usable longer than the 5-minute default. Consider capping the caller-suppliable TTL lower for anything except the specific admin/email flows that need the long window.

---

### SEC-13 — Session tokens live in `localStorage`, not an httpOnly cookie
```
Severity: LOW (informational — raises the stakes of SEC-03/SEC-07, not a bug on its own)
Category: Cookies and Sessions
Affected: src/lib/supabase/client.ts
```
This is Supabase's standard default for a client-only SPA (and is explicitly documented as such in this file's own comment), not a mistake. Flagging it only because it means any XSS that does land is a full session-theft vector, which is why SEC-03/SEC-07 are worth taking seriously even though each individually has a narrow precondition. Migrating to httpOnly-cookie-based sessions (`@supabase/ssr` + middleware) is a legitimate hardening path but a real architectural change — not something to do as a "smallest safe fix."

---

### Confirmed secure — verified, not assumed
Worth stating plainly, since this brief is right that "it works" isn't evidence of "it's secure": these are the exact bypass patterns I went in expecting to find, checked directly against the live database, and ruled out.
- **A student cannot self-approve their own payment or bypass the review queue** (`payments` RLS `with_check`, verified above).
- **A student cannot self-promote to admin or superadmin** (`admins` RLS, superadmin-write-only).
- **A student cannot spoof messages as an advisor, or read another student's conversation** (`messages` RLS).
- **A student cannot self-approve a journey step/stage or forge an advisor's review comment** — enforced by both RLS *and* a second layer of PL/pgSQL triggers (`journey_progress_guard`, `journey_documents_guard`, `journey_stage_approvals_guard`) that strip privileged fields back to their prior value on any non-privileged write. Genuine defense-in-depth, not just RLS alone.
- **A previously-real vulnerability was already found and fixed**: `supabase/migrations/journey/15_profile_guard.sql`'s own header documents a prior audit finding students could rewrite `plan`, `plan_status`, `banned`, `user_number`, and `email` on their own profile — confirmed the fix (`profiles_guard` trigger) is live and correctly pins those fields.
- **File access control** (`assertCanAccess`, `resolveOwner`, path-traversal rejection in `src/lib/storage/auth.ts`) is sound — prefix-scoped ownership, admin override explicitly scoped to `users/`, UUID validation on any admin-specified owner.
- **The Resend webhook** (`/api/email/webhook`) is exemplary: HMAC-SHA256 with timing-safe comparison, a timestamp-tolerance replay window, fails closed if unconfigured.
- **No secrets in git** — `.env*` correctly gitignored, confirmed never committed historically; the service-role key and R2 credentials are `import "server-only"`-guarded (a Next.js build-time enforcement, not just convention) and referenced only from API routes/server libs.
- **CORS defaults are safe** — no permissive `Access-Control-Allow-Origin` anywhere in the Next.js API surface (same-origin only, the secure default).
- **Every API route I read** independently re-verifies `caller.isAdmin`/`isSuperAdmin`/`isTester` server-side via a JWT-derived database lookup (`src/lib/apiAuth.ts`) — none trust a client-supplied role/id.

---

## Severity Summary

| ID | Severity | One-line |
|----|----------|----------|
| SEC-01 | HIGH | Every signup auto-confirms email — needs your decision |
| SEC-02 | HIGH | Next.js 16.2.10 has 6 High CVEs, patch fix available |
| SEC-03 | MED-HIGH | Regex HTML sanitizer for admin content, reaches every student |
| SEC-04 | MEDIUM | `community_members` SECURITY DEFINER view + dead broad grants |
| SEC-05 | MEDIUM | Critical tables' RLS lives only in the dashboard (verified good, not versioned) |
| SEC-06 | MEDIUM | No security headers anywhere |
| SEC-07 | MEDIUM | SVG upload + inline preview |
| SEC-08 | LOW-MED | SECURITY DEFINER functions over-exposed to RPC (verified not exploitable) |
| SEC-09 | LOW-MED | WhatsApp webhook fails open, not closed, when unconfigured |
| SEC-10 | LOW | Leaked-password protection off (dashboard toggle) |
| SEC-11 | LOW | Unused edge function still deployed |
| SEC-12 | LOW | Signed URL TTL client-suppliable |
| SEC-13 | LOW/info | Session in localStorage (context for SEC-03/07) |

---

## Baseline (for comparison after any fix)
```
Build:          not run yet — will run before/after any change
TypeScript:     PASS (last checked this session)
Lint:           PASS (last checked this session)
Tests:          no test suite exists in this project (no "test" script in package.json) — noting per instructions rather than reporting a false PASS
npm audit:      6 High (SEC-02), 0 Critical
```

## Next Steps

Per the brief's own instructions, I'm stopping here rather than fixing anything. My recommended order, once you tell me how to proceed:

1. **SEC-01** — needs your answer on intent before I touch it.
2. **SEC-02** — `npm audit fix --force` to `next@16.3.3`, then full regression check. Low risk, high value, quick.
3. **SEC-10** — a dashboard toggle, zero code risk. Can do alongside #2.
4. **SEC-03** — swap in a real sanitizer. Contained, one file.
5. **SEC-04, SEC-08** — one migration each, mechanical, no behavior change (revoke unused grants/EXECUTE).
6. **SEC-07** — pick SVG-drop or forced-attachment; either is a few lines.
7. **SEC-05** — dump and commit the missing schema/policies (documentation, not a fix).
8. **SEC-06, SEC-09, SEC-11, SEC-12** — lower priority, do when convenient.

Tell me which to proceed with — all of them, a subset, or just the HIGHs for now.
