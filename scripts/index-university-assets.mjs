#!/usr/bin/env node
/*
 * University logo indexer.
 *
 * Scans public/assets/universities/<slug>/ for the logo file and writes
 * manifest.json, which the app imports statically. Drop a logo in, run this
 * (it also runs automatically before `npm run dev` and `npm run build`), and
 * every surface picks it up.
 *
 * Recognised names (.png .jpg .jpeg .webp .avif .svg):
 *
 *   logo.*        the university logo
 *   logo-dark.*   optional variant for dark surfaces
 */

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "public", "assets", "universities");
const MANIFEST = path.join(DIR, "manifest.json");
const IMAGE = /\.(png|jpe?g|webp|avif|svg)$/i;

mkdirSync(DIR, { recursive: true });

/** slug → { logo, logoDark } */
const universities = {};

for (const slug of readdirSync(DIR)) {
  const folder = path.join(DIR, slug);
  if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;

  const entry = { logo: null, logoDark: null };
  for (const file of readdirSync(folder).sort()) {
    if (!IMAGE.test(file)) continue;
    const base = file.replace(IMAGE, "").toLowerCase();
    const url = `/assets/universities/${slug}/${file}`;
    if (base === "logo") entry.logo = url;
    else if (base === "logo-dark") entry.logoDark = url;
    // any other file is ignored: this platform only uses university logos
  }
  if (entry.logo || entry.logoDark) universities[slug] = entry;
}

writeFileSync(MANIFEST, JSON.stringify({ universities, indexedAt: new Date().toISOString() }, null, 2) + "\n");

const slugs = Object.keys(universities);
if (!slugs.length) {
  console.log("No university logos found yet.");
  console.log("Add public/assets/universities/<slug>/logo.png then run: npm run assets:index");
} else {
  console.log(`Indexed ${slugs.length} logo${slugs.length === 1 ? "" : "s"}:`);
  for (const s of slugs) {
    const u = universities[s];
    console.log(`  ${s.padEnd(24)} ${[u.logo && "logo", u.logoDark && "logo-dark"].filter(Boolean).join(", ")}`);
  }
}
