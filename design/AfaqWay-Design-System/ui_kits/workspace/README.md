# Workspace UI kit — Student Workspace

An interactive recreation of the AfaqWay **student User Workspace** (design.md
§18). Open `index.html`.

## What it shows
- **Glass sidebar** — 256px, `blur(22px) saturate(1.5)`, sliding active pill,
  collapse toggle. Nav: Overview · My Journey · Documents · Schedule · Explore.
- **Overview** — four `StatCard` tiles, the journey progress panel (stage rows
  with `Status` dots + progress bars), upcoming tasks, plan card, `ActionCard`.
- **My Journey** — stage navigator (equal cards) + step timeline with numbered
  status icons and per-step `Button` actions.
- **Documents** — requirement rows scoped to the active stage, each with a
  `Status` and an upload/replace `Button`.
- **Messages** — the advisor chat: header with online `Status`, bubble thread
  (mine = indigo fill), and the composer capsule. Type and send to append.

## How it's built
`afw-workspace.jsx` composes the DS primitives from
`window.AfaqWayDesignSystem_898d90` and exports `AfwShell` to `window`;
`index.html` loads React + Babel + the bundle and mounts it. Icons are inline
lucide-shaped SVGs. Chat uses the `.chat-*` / `.af-composer` classes from
`base.css`. It is a cosmetic recreation — no real data or network.
