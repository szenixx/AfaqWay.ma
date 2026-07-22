# Workspace Architecture & User Flow (source of truth)

> The governing rule for the student workspace. Read before building any
> workspace page or adding a new country. **Never duplicate layouts or
> components per country.**

## Core concept
ONE universal workspace. Every user shares the same design system, dashboard,
sidebar, top nav, components, routes, layout, animations, cards, tables, forms,
and UX. The **only** thing that changes is the *content* inside each page,
driven by the user's `country` + `plan`.

Think: one application that dynamically loads different datasets. The rendering
system never changes, only the content source.

## User flow (exact order)
```
Login → Profile Setup / Onboarding → Choose Country → Choose Plan → Enter Workspace
```
- First login → onboarding. Otherwise → straight to Dashboard.
- Once onboarding is done, the user never sees it again unless they
  intentionally reset their workspace.

## Workspace configuration
Each user carries a config that controls what content loads:
```
country = Lithuania
plan    = Full Service   // each country defines its own plans
```

## The one architectural rule
Never create `LithuaniaDashboard`, `HungaryDashboard`, etc. Create ONE
`Dashboard`. Everything inside is dynamic. Same UI, different data.

## Universal sidebar modules (never change)
```
Overview
My Journey
Documents
Explore Country
```
- **Explore Country** stays one route; only its title + content are dynamic
  ("Explore Lithuania", "Explore Hungary", ...).

## Top navigation (identical everywhere)
- Left: `Welcome Back, {User Name}!` + a time-to-start-your-application line
  (design-system fonts).
- Right: Messages icon button, Notifications icon button, User Avatar.

## User menu (avatar dropdown, universal)
```
Profile
Subscription (plan name)
Settings
────────────
Contact Support
Sign Out
```

## Per-module rule
- **Documents** (`/documents`): same layout, country-specific document lists.
- **My Journey**: universal shell; content + data change per country (the most
  important dynamic module).
- **Overview**: same cards / progress widgets / quick actions; only the stats
  inside change.

## Component architecture
All reusable, never duplicated: Dashboard Layout → Sidebar, Top Nav, Page
Header, Cards, Statistics, Timeline, Progress, Tables, Forms, Empty States,
Footer. Every country reuses these.

## Dynamic loading logic
```
Workspace → read user country → read subscription → load matching content → render with universal components
```

## Future expansion
Adding a new country (e.g. France) requires ONLY: France content, documents,
journey, guides. No redesign, no new dashboard, no duplicated pages.

## Design directive
Build the student workspace as the **same workspace style as the admin
workspace** (same shell/pattern). One premium, modular, reusable, scalable,
consistent SaaS product. Switching countries must feel like the same app with
different information, never a different application.
