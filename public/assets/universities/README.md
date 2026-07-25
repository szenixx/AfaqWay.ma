# University logos (manually supplied)

Drop each university's logo into the folder named after its slug. The indexer
picks it up and the logo appears everywhere — Explore university cards, the
dynamic hero, and the Program Information card in the Journey and Documents
modules.

```
public/assets/universities/
├── vilnius-university/
│   ├── logo.png          ← the logo (png, jpg, webp, avif or svg)
│   └── logo-dark.png     ← optional variant for dark surfaces
├── ktu/
│   └── logo.png
└── vmu/
    └── logo.png
```

Only `logo.*` and `logo-dark.*` are used. Nothing else is read.

Slugs: vilnius-university · vilnius-tech · ktu · vmu · lsmu ·
klaipeda-university · mruni · ism · lcc · smk · kauko · lsu · vvk
(defined in `src/lib/universities.ts` — add a university there and create a
folder with the same slug).

## After adding files

```bash
npm run assets:index
```

It also runs automatically before `npm run dev` and `npm run build`, so a normal
start picks up whatever you have added.
