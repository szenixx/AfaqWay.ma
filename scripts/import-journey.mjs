#!/usr/bin/env node
/* Journey content importer.
 *
 * The Excel file is the source of truth for the student journey. This reads it
 * and writes an idempotent SQL migration that syncs the journey tables.
 *
 *   node scripts/import-journey.mjs [path/to/file.xlsx]
 *
 * Re-running is safe and is the point: stages and steps are matched by title
 * within their country/plan, so a second import UPDATES the existing rows
 * instead of replacing them. That matters because journey_progress references
 * step ids — deleting and re-inserting steps would wipe every student's
 * progress. A renamed step in the Excel is therefore treated as a new step, and
 * the old one is archived rather than dropped.
 *
 * Columns read: Stage · Steps · description · upload req · learn · CLAUDE Prompt
 * Anything the Excel does not say is left alone; nothing is invented here.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const SOURCE = process.argv[2]
  ?? "/home/szei/Documents/Important-AW/Bachelor-Journey-stages-lt.xlsx";
const OUT = resolve("supabase/migrations/journey/12_journey_content_lt_bachelor.sql");

/* This journey applies to every Bachelor student, on every programme, in both
   service plans. Degree is kept in the stage's rules payload so no column had
   to be added for it. */
const COUNTRY = "LT";
const DEGREE = "Bachelor";
const PLANS = ["self_service", "full_service"];

/* ── Minimal xlsx reader (no dependency) ─────────────────────────────────── */

function readSheet(file) {
  const dir = `${tmpdir()}/afaqway-xlsx-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", file, "-d", dir]);

  const strings = [];
  const sharedXml = readFileSync(`${dir}/xl/sharedStrings.xml`, "utf8");
  for (const si of sharedXml.split("<si>").slice(1)) {
    const parts = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
    strings.push(decode(parts.join("")));
  }

  const sheet = readFileSync(`${dir}/xl/worksheets/sheet1.xml`, "utf8");
  const rows = [];
  for (const rowXml of sheet.split("<row ").slice(1)) {
    const cells = {};
    /* Cells come in two shapes: <c ...>…</c> and the empty <c ... />. The
       self-closing form has to be excluded from the first pattern, or it
       swallows everything up to the next closing tag — including the next
       row's values. */
    for (const m of rowXml.matchAll(/<c r="([A-Z]+)\d+"([^>\/]*)>([\s\S]*?)<\/c>/g)) {
      const [, col, attrs, body] = m;
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      const inline = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("");
      cells[colIndex(col)] = / t="s"/.test(attrs)
        ? (strings[Number(value)] ?? "")
        : decode(inline || value);
    }
    const width = Math.max(-1, ...Object.keys(cells).map(Number)) + 1;
    rows.push(Array.from({ length: width }, (_, i) => (cells[i] ?? "").trim()));
  }
  return rows;
}

const decode = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#10;/g, "\n").replace(/&amp;/g, "&");

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/* ── Model ───────────────────────────────────────────────────────────────── */

/** "Stage 1 : Pre-Application" → "Pre-Application"; typos in the Excel are kept. */
const stageTitle = (raw) => raw.replace(/^S[a-z]*\s*\d+\s*:\s*/i, "").trim();

/** Every URL in a Learn cell becomes its own link block, in order. */
const URL_RE = /https?:\/\/[^\s)]+/g;

/* Steps whose Learn content is resolved live from the programme catalogue.
   These are the Claude Prompt instructions that reference the programme engine:
   the block kind carries the field name and the renderer looks it up for the
   student's own programme. */
const PROGRAM_BLOCKS = {
  "Explore Your Program": "url",
  "English Certificate": "english",
  "Application Fees": "app_fee",
  "Pay Tuition Fees": "tuition",
};

/* Learn content that differs by plan, from the Claude Prompt column. */
const PLAN_LEARN = {
  "Submit Your Application": {
    self_service: "When every document is approved, open the university application page and submit your application there.",
    full_service: "Do not submit anything yourself. Our support team submits your university application on your behalf once all of your documents have been reviewed and approved.",
  },
  "Motivational Interview": {
    full_service: [
      "Be on time and test your microphone and camera before an online interview.",
      "Dress appropriately and keep eye contact.",
      "Speak clearly and answer honestly.",
      "Explain why you chose this program.",
      "Talk about your study and career goals.",
      "Read every preparation PDF in this step before the interview.",
      "Practise beforehand, and ask our support team if you need help.",
    ],
  },
  "University Review": {
    full_service: "Our team has submitted your application and we are waiting for the university's admission decision. You do not need to do anything at this stage. If the university asks for more documents, an interview or any other information, our support team will contact you immediately.",
  },
};

/** Optional steps a student may skip, from the Claude Prompt column. */
const OPTIONAL_STEPS = new Set(["Additional Courses"]);

/* Uploads are PDF only, except the photo, which may also be an image. */
const PHOTO_STEPS = new Set(["Personal Photo"]);

/** Steps named in the Excel but not yet specified; skipped until filled in. */
const INCOMPLETE = new Set(["e signature"]);

function buildModel(rows) {
  const [header, ...body] = rows;
  const col = (name) => header.findIndex((h) => h.toLowerCase().startsWith(name));
  const C = { stage: col("stage"), step: col("step"), desc: col("desc"), upload: col("upload"), learn: col("learn") };

  const stages = [];
  let current = null;
  const skipped = [];

  for (const row of body) {
    const get = (i) => (i >= 0 && row[i] ? row[i].trim() : "");
    const stageCell = get(C.stage);
    if (stageCell) {
      current = { title: stageTitle(stageCell), raw: stageCell, steps: [] };
      stages.push(current);
    }
    const step = get(C.step);
    if (!step || !current) continue;
    if (INCOMPLETE.has(step)) { skipped.push(step); continue; }

    current.steps.push({
      title: step,
      description: get(C.desc),
      requiresUpload: /^y/i.test(get(C.upload)),
      learn: get(C.learn),
    });
  }
  return { stages, skipped };
}

/* ── Content blocks ──────────────────────────────────────────────────────── */

function blocksFor(step) {
  const blocks = [];
  const push = (kind, extra = {}) => blocks.push({ kind, title: "", body: "", data: {}, ...extra });

  // Programme-derived facts sit above the written guidance.
  const programField = PROGRAM_BLOCKS[step.title];
  if (programField) push("program", { data: { field: programField } });

  const planCopy = PLAN_LEARN[step.title];
  if (planCopy) {
    for (const [plan, copy] of Object.entries(planCopy)) {
      if (Array.isArray(copy)) push("list", { title: "How to prepare", data: { entries: copy, plan } });
      else push("paragraph", { body: copy, data: { plan } });
    }
  }

  if (step.learn) {
    // Links become their own blocks; the remaining prose stays in order.
    const links = step.learn.match(URL_RE) ?? [];
    const prose = step.learn.replace(URL_RE, "").replace(/\s{2,}/g, " ");
    const lines = prose.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length > 1) {
      push("paragraph", { body: lines[0] });
      push("list", { data: { entries: lines.slice(1) } });
    } else if (lines.length === 1) {
      push("paragraph", { body: lines[0] });
    }

    for (const url of links) {
      const isVideo = /youtu\.?be|vimeo\.com/.test(url);
      if (isVideo) push("video", { title: "Tutorial", data: { url } });
      else push("link", { data: { url, label: labelForLink(url), newTab: true, internal: false } });
    }
  }
  return blocks;
}

function labelForLink(url) {
  if (/passeport\.ma/.test(url)) return "Apply for your passport";
  if (/apostille\.ma/.test(url)) return "Apostille portal";
  if (/atajtraduction/.test(url)) return "Find a certified translator";
  return "Open the official website";
}

/** The document a step asks for, when the Excel says an upload is required. */
function requirementFor(step) {
  const photo = PHOTO_STEPS.has(step.title);
  return {
    key: slug(step.title),
    name: step.title,
    description: step.description,
    instructions: "",
    required: !OPTIONAL_STEPS.has(step.title),
    // The Claude Prompt for Personal Photo: image or PDF there, PDF elsewhere.
    acceptedTypes: photo ? "pdf,jpg,jpeg,png" : "pdf",
    maxSizeMb: 4,
    templatePath: "",
    templateName: "",
    notes: "",
  };
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

/* ── SQL ─────────────────────────────────────────────────────────────────── */

const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
const j = (value) => `${q(JSON.stringify(value))}::jsonb`;

function toSql({ stages, skipped }, source) {
  const out = [];
  out.push(`-- 12 · Journey content for ${COUNTRY} ${DEGREE}, imported from the Excel source of truth.
--
-- Generated by scripts/import-journey.mjs — do not hand-edit. Re-run the script
-- after the Excel changes and apply the new file.
--
-- Source: ${source}
-- Stages: ${stages.length} · Steps: ${stages.reduce((n, s) => n + s.steps.length, 0)} · Plans: ${PLANS.join(", ")}
${skipped.length ? `-- Skipped, not specified in the Excel yet: ${skipped.join(", ")}\n` : ""}--
-- Idempotent: stages and steps are matched by title, so re-running updates the
-- existing rows and never deletes a step that student progress points at.

do $$
declare
  v_plan   text;
  v_stage  uuid;
  v_step   uuid;
begin
foreach v_plan in array array[${PLANS.map(q).join(", ")}] loop
`);

  stages.forEach((stage, si) => {
    const published = stage.steps.length > 0;   // MIGRIS has no steps yet: draft.
    const rules = { degree: DEGREE, source: "xlsx", excelStage: stage.raw };
    out.push(`
  /* ── ${stage.raw} ── */
  select id into v_stage from public.journey_stages
   where country = ${q(COUNTRY)} and plan = v_plan and title = ${q(stage.title)} limit 1;

  if v_stage is null then
    insert into public.journey_stages (country, plan, sort_order, title, description, icon, tone, status, rules)
    values (${q(COUNTRY)}, v_plan, ${si}, ${q(stage.title)}, '', ${q(STAGE_ICONS[si] ?? "route")}, ${q(STAGE_TONES[si] ?? "blue")}, ${q(published ? "published" : "draft")}, ${j(rules)})
    returning id into v_stage;
  else
    update public.journey_stages
       set sort_order = ${si}, icon = ${q(STAGE_ICONS[si] ?? "route")}, tone = ${q(STAGE_TONES[si] ?? "blue")},
           status = ${q(published ? "published" : "draft")}, rules = ${j(rules)}
     where id = v_stage;
  end if;
`);

    stage.steps.forEach((step, pi) => {
      const requirements = step.requiresUpload ? [requirementFor(step)] : [];
      const stepRules = {
        documents: requirements,
        allowSkip: OPTIONAL_STEPS.has(step.title),
        source: "xlsx",
      };
      const blocks = blocksFor(step);

      out.push(`
  select id into v_step from public.journey_steps
   where stage_id = v_stage and title = ${q(step.title)} limit 1;

  if v_step is null then
    insert into public.journey_steps (stage_id, sort_order, title, description, status, required, rules)
    values (v_stage, ${pi}, ${q(step.title)}, ${q(step.description)}, 'published', ${!OPTIONAL_STEPS.has(step.title)}, ${j(stepRules)})
    returning id into v_step;
  else
    update public.journey_steps
       set sort_order = ${pi}, description = ${q(step.description)}, status = 'published',
           required = ${!OPTIONAL_STEPS.has(step.title)}, rules = ${j(stepRules)}
     where id = v_step;
  end if;

  -- Content is fully owned by the import, so it is replaced wholesale. Nothing
  -- references a block id, unlike steps, so this is safe.
  delete from public.journey_blocks where step_id = v_step and (data ->> 'source') = 'xlsx';`);

      blocks.forEach((block, bi) => {
        const data = { ...block.data, source: "xlsx" };
        out.push(`  insert into public.journey_blocks (step_id, sort_order, kind, enabled, title, body, data, audience)
    values (v_step, ${bi}, ${q(block.kind)}, true, ${q(block.title)}, ${q(block.body)}, ${j(data)}, 'student');`);
      });
    });
  });

  out.push(`
end loop;
end $$;

notify pgrst, 'reload schema';
`);
  return out.join("\n");
}

const STAGE_ICONS = ["landmark", "graduation-cap", "file-text", "plane", "route"];
const STAGE_TONES = ["purple", "green", "amber", "blue", "teal"];

/* ── Run ─────────────────────────────────────────────────────────────────── */

const rows = readSheet(SOURCE);
const model = buildModel(rows);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, toSql(model, SOURCE));

console.log(`Read ${rows.length} rows from ${SOURCE}`);
for (const stage of model.stages) {
  console.log(`  ${stage.raw}  (${stage.steps.length} step${stage.steps.length === 1 ? "" : "s"})`);
  for (const step of stage.steps) {
    const bits = [step.requiresUpload ? "upload" : null, OPTIONAL_STEPS.has(step.title) ? "optional" : null,
      PROGRAM_BLOCKS[step.title] ? `programme:${PROGRAM_BLOCKS[step.title]}` : null,
      PLAN_LEARN[step.title] ? "plan-specific" : null].filter(Boolean);
    console.log(`     · ${step.title}${bits.length ? `  [${bits.join(", ")}]` : ""}`);
  }
}
if (model.skipped.length) console.log(`  skipped (incomplete in the Excel): ${model.skipped.join(", ")}`);
console.log(`\nWrote ${OUT}`);
