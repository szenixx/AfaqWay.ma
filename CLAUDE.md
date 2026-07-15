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
