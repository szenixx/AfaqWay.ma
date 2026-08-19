/* iOS-style emoji assets for the onboarding.

   The onboarding renders emoji as IMAGES, not as text: a platform glyph would
   be Segoe on Windows, Noto on Android and Apple's on a Mac, so the same
   screen would carry three different illustration styles. One image set means
   one style everywhere.

   Source: the `emoji-datasource-apple` package (Apple's emoji artwork, the set
   emoji-mart ships). It unpacks to ~100 MB, so it is NOT a dependency of this
   app — this script pulls the tarball on demand, copies only the emoji listed
   in src/lib/onboarding/emojiMap.json into public/emoji/, and throws the rest
   away. Re-run it after adding a name to that map:

     node scripts/build-emoji.mjs

   Files are named after the MAP KEY (public/emoji/graduation.png), never the
   codepoint, so <Emoji name="graduation" /> needs no second lookup table. */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "emoji");
const MAP = JSON.parse(readFileSync(path.join(ROOT, "src/lib/onboarding/emojiMap.json"), "utf8"));
const PKG = "emoji-datasource-apple@16.0.0";

/* emoji.json keys artwork by "unified" codepoints (1f393, 1f1f1-1f1f9). Build
   the reverse index from the file itself rather than deriving codepoints by
   hand: the dataset drops some variation selectors (FE0F) and keeps others, so
   a hand-rolled rule silently misses a handful of glyphs. */
function indexByChar(dataset) {
  const toChar = (u) => u.split("-").map((h) => String.fromCodePoint(parseInt(h, 16))).join("");
  const index = new Map();
  for (const e of dataset) {
    if (!e.has_img_apple) continue;
    index.set(toChar(e.unified), e.image);
    // the same glyph typed with a trailing variation selector must resolve too
    index.set(toChar(e.unified) + "️", e.image);
    for (const alt of e.non_qualified ? [e.non_qualified] : []) index.set(toChar(alt), e.image);
  }
  return index;
}

const work = mkdtempSync(path.join(tmpdir(), "afq-emoji-"));
try {
  console.log(`Fetching ${PKG} …`);
  const tgz = execFileSync("npm", ["pack", PKG, "--silent"], { cwd: work, encoding: "utf8" }).trim();
  execFileSync("tar", ["-xzf", tgz], { cwd: work });

  const src = path.join(work, "package");
  const index = indexByChar(JSON.parse(readFileSync(path.join(src, "emoji.json"), "utf8")));

  mkdirSync(OUT, { recursive: true });
  const missing = [];
  for (const [name, char] of Object.entries(MAP)) {
    const file = index.get(char);
    if (!file || !existsSync(path.join(src, "img/apple/64", file))) { missing.push(`${name} ${char}`); continue; }
    copyFileSync(path.join(src, "img/apple/64", file), path.join(OUT, `${name}.png`));
  }

  console.log(`Wrote ${Object.keys(MAP).length - missing.length} emoji to public/emoji/`);
  if (missing.length) { console.error("Not found in the dataset:\n  " + missing.join("\n  ")); process.exit(1); }
} finally {
  rmSync(work, { recursive: true, force: true });
}
