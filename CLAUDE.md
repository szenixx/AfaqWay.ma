## ⚠️ READ THIS BEFORE BUILDING ANYTHING

**The design source of truth is:**
`/home/szei/Documents/AfaqWay.com/design/AfaqWay-Design-System`

Before you create a page, a component, or write a single line of UI —
**open that folder and read it first.** Every colour, font, spacing rule,
component pattern and layout convention comes from there. Nothing else.

- Do **not** invent colours, fonts, radii, or component styles.
- Do **not** pull styles from another project, a UI kit, or your own defaults.
- If something you need isn't defined in `/AfaqWay-Design-System`, **stop and ask me** —
  do not improvise it.

If you build UI without reading `/AfaqWay-Design-System` first, the work is wrong by
definition and will be thrown away.

## 🚨 SECURITY IS PART OF EVERY CHANGE, NOT A SEPARATE STEP

**Full rules, read before touching auth, APIs, the database, file uploads, admin
functionality, or permissions:**
`/home/szei/Documents/AfaqWay.com/SECURITY_RULES.md`

This applies to every feature, bug fix, API, database change, dependency and
config change from now on — not just when asked for a security review.

- The frontend is never the security boundary. A hidden button, a disabled
  control, a client-side role check — none of it is enforcement. The
  server/database enforces authentication, authorization, resource ownership,
  input validation and business rules, every time, regardless of what the
  client sends.
- Never trust `userId`, `role`, `isAdmin`, `accountId`, or any permission
  claim that comes from the browser. Re-derive it server-side.
- Every new or changed API endpoint: know who can call it, what they can
  access, and confirm it before shipping — never assume a protected page
  means a protected API.
- Every database write: does RLS (or the equivalent guard) actually restrict
  it to the rows and columns this caller should touch? Check the live
  policy, not just the intent in a comment.
- File uploads: never trust a client-supplied extension or MIME type.
  Validate server-side; treat SVG as executable content, not an image.
- User-controlled content rendered as HTML/Markdown/rich text: sanitize with
  a real allow-list (e.g. DOMPurify), never a hand-rolled regex, and never
  `dangerouslySetInnerHTML` unsanitized input.
- Secrets stay server-side only — never in a client component, a git commit,
  a log line, or an API response.
- **Never "fix" a security problem by deleting the feature, disabling a
  check, or making something public.** Find the secure version of the same
  functionality; if that needs an architectural change, explain the
  trade-off before making it.
- Before calling any change done: authentication and authorization still
  work, no user can reach another user's data, admin stays admin-only,
  nothing regressed from before the change — same bar as the functional
  checklist below, run every time, not just when asked.
- Known open findings from the last full audit live in
  `/home/szei/Documents/AfaqWay.com/SECURITY_AUDIT_REPORT.md` — check it
  isn't stale before assuming an area is already fixed.

### While building
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Every button and link must actually navigate. **No dead buttons, no
  `href="#"`.** If the destination isn't built yet, route to a clearly
  marked placeholder and tell me.
- Point at logs, errors, failing tests — then resolve them
- If you copy-paste anything twice, **stop and extract a shared
  component** instead.
- when you need any illustartion , picture , or motion short video , generate it with higgsfiled ai 
  
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

**Never**
  - Never mark a task complete without proving it works
  - Never modify a shared component to fix one page. Fix the page.
  - Never break a page we already finished.
  - Never build a page that breaks a page we already finished.
  
**Self-improvement loop.**
  - After ANY correction from the user: update `/home/szei/Documents/AfaqWay.com/lessons.md` with the pattern
  - Write rules for yourself that prevent the same mistake
  - Ruthlessly iterate on these lessons until mistake rate drops
  - Review lessons /lessons.md at session start for relevant project
  
**Find where this page connects.** List every link in and out of it:
   - Which page sends the user here, and from which button?
   - Where does every button on THIS page go?
   - What data must already exist for this page to work?
Tell me these before you build.


### After building
Give me a short checklist: what you connected, what works, what is a stub
