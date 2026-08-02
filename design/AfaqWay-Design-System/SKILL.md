---
name: afaqway-design
description: Use this skill to generate well-branded interfaces and assets for AfaqWay — the guided study-abroad platform — either for production or throwaway prototypes/mocks. Contains the essential design guidelines, colours, type, fonts, assets, and UI-kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, social posts, etc), copy assets out of `assets/` and create static HTML files for the user to view — link `styles.css` for the real tokens and match the brand foundations in the readme. If working on production code, copy assets and read the rules here to become an expert in designing with the AfaqWay brand: calm, credible, quietly institutional; Poppins; indigo `#162E8C`; floating white cards on a pale blue-grey field; Lucide outline icons; the status word always renders.

Key files: `styles.css` (link this), `tokens/*` (colours, type, spacing), `base.css` (component classes), `components/*` (React primitives — Button, Pill, Status, Card, Cards, Controls, MetricCard, Accordion, Loader, Divider), `ui_kits/*` (workspace + marketing recreations), `assets/*` (logos, illustrations, imagery).

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few focused questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
