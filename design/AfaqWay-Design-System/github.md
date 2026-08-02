repo: szenixx/AfaqWay.ma
branch: main
path: (whole repo — student-facing surfaces)

## Last sync

date: 2026-08-01
note: Design system built from the attached AfaqWay.com codebase + uploads/design.md. Commit sha unknown (built from a local mounted folder, not a fetched ref) — omitted deliberately.

### Updated in this project
- Extracted the ds.css token contract into tokens/ (colours, type, spacing) + base.css component classes.
- Authored React primitives: Button, Pill, Status, Card, Cards, Controls, MetricCard, Accordion, Loader, Divider.
- Recreated the Student Workspace and marketing homepage as UI kits.
- Copied brand logos, illustrations and Lithuania/ambience imagery into assets/.

## Screen map

| Screen / artifact | Built from |
| --- | --- |
| tokens/*.css, base.css | src/app/ds.css, uploads/design.md |
| components/core/Button | src/components/ds/Button.tsx |
| components/core/Pill | src/components/ds/Pill.tsx |
| components/core/Status | src/components/ds/Status.tsx |
| components/core/Cards | src/components/ds/Cards.tsx |
| components/core/Loader | src/components/ds/Loader.tsx |
| components/forms/Controls | src/components/ds/Controls.tsx, ds.css |
| components/feedback/MetricCard | src/app/ds.css (.mc-*) |
| components/feedback/Accordion | src/components/ds/Accordion.tsx |
| ui_kits/workspace | src/components/student/*, design.md §18 |
| ui_kits/marketing | src/components/home/Hero.tsx, SiteHeader.tsx |
