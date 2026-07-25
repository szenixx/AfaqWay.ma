# University Logo Mapping

| File | University | Platform slug |
|------|------------|---------------|
| vmu.webp | Vytautas Magnus University | `vmu` |
| vu.webp | Vilnius University | `vilnius-university` |
| kk.webp | Kauno kolegija Higher Education Institution | `kauko` |
| ktu.webp | Kaunas University of Technology | `ktu` |
| smk.webp | SMK College of Applied Sciences | `smk` |
| ku.webp | Klaipeda University | `klaipeda-university` |
| vbc.webp | Vilnius Business College | `vvk` |
| vilniustech.webp | Vilnius Gediminas Technical University (VILNIUS TECH) | `vilnius-tech` |
| mru.webp | Mykolas Romeris University | `mruni` |

Each WEBP file contains the official logo/icon for its corresponding university.

## Installed into the platform

Each logo is trimmed of its white frame, centred on a transparent square canvas
and written to:

```
public/assets/universities/<slug>/logo.webp
```

The indexer (`npm run assets:index`, also run automatically before `dev` and
`build`) maps them into `public/assets/universities/manifest.json`, which
`UniversityBrand` reads. They appear in the Explore university cards, the
Explore hero, and the Program Information card in the Journey and Documents
modules, matched to the student's selected university.

## Not yet supplied

`lsmu` (Lithuanian University of Health Sciences), `ism` (ISM University of
Management and Economics), `lcc` (LCC International University) and `lsu`
(Lithuanian Sports University) are in the registry but have no logo file yet.
