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
 * progress. A step that disappears from the Excel is archived, never dropped.
 *
 * Reading the sheet is not as simple as "row 1 is the header":
 *
 *   · the sheet carries THREE header rows (one per section of the journey),
 *     not one, and they must not be imported as stages;
 *   · they do not agree on column order — the Stage 3 header swaps `learn` and
 *     `upload req` — so the columns are classified per row by their content,
 *     with the nearest header as the tie-breaker;
 *   · a step's required documents are listed on the FOLLOWING rows, which carry
 *     no step title. Dropping them, as an earlier version did, lost 21 of the
 *     journey's document requirements.
 *
 * Behaviour that the Claude Prompt column asks for lives in scripts/journey-spec.mjs.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { SPEC, STAGES, EXTRA_STAGES, TEMPLATES, linkLabel, videoTitle } from "./journey-spec.mjs";
import { MODULES } from "./journey-modules.mjs";

const SOURCE = process.argv[2]
  ?? "/home/szei/Documents/Important-AW/Bachelor-Journey-stages-lt.xlsx";
const OUT = resolve("supabase/migrations/journey/12_journey_content_lt_bachelor.sql");
/* A verification pass to run after the migration. Generated from the same model,
   so the numbers it asserts can never drift from the numbers it wrote. */
const VERIFY_OUT = resolve("supabase/migrations/journey/19_verify_journey_content.sql");

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

/* Numeric entities are decoded generically: this file writes newlines as the
   HEX form `&#xA;`, and a decoder that only knew `&#10;` left them in the text.
   A URL regex then ran straight through the entity into the next line, so a
   tutorial link arrived as ".../watch?v=…&t=35s&#xA;Apply:" — a dead link.
   `&amp;` is decoded last so an escaped entity cannot become a live one. */
const decode = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&amp;/g, "&");

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/* ── Reading the sheet ───────────────────────────────────────────────────── */

/** "Stage 1 : Pre-Application" → "Pre-Application". Handles the "Sage 2" typo. */
const stageTitle = (raw) => raw.replace(/^S[a-z]*\s*\d+\s*:\s*/i, "").trim();

/**
 * Step titles as typed contain stray spacing: " CV( Resume)", "Create MIGRIS
 * Account ". Only whitespace is normalised — no word is changed.
 */
const stepTitle = (raw) => raw
  .replace(/\s+/g, " ")
  .replace(/\s*\(\s*/g, " (")
  .replace(/\s*\)\s*/g, ") ")
  .trim();

/** A header row repeats mid-sheet whenever the journey starts a new section. */
const isHeaderRow = (row) =>
  (row[0] ?? "").trim().toLowerCase() === "stage" && /^steps?$/i.test((row[1] ?? "").trim());

/**
 * The cell that answers "does this step need an upload". Three shapes appear:
 * a plain yes/no, "Required Documents:" followed by bullets on the next rows,
 * and "No Upload Required".
 */
const isUploadCell = (v) => /^(yes|no|required documents|no upload required)\b/i.test((v ?? "").trim());

/** A continuation row's document line: "• High School Diploma (Original)". */
const BULLET = /^[•·▪◦*\-–]\s*/;
const isBullet = (v) => BULLET.test((v ?? "").trim());

function buildModel(rows) {
  /* The header in force. It only decides which of `learn` / `upload` a column
     holds when the row's own content cannot; see classify() below. */
  let C = { stage: 0, step: 1, desc: 2, upload: 3, learn: 4, prompt: 5 };

  const readHeader = (row) => {
    const find = (name) => row.findIndex((h) => (h ?? "").trim().toLowerCase().startsWith(name));
    return {
      stage: find("stage"), step: find("step"), desc: find("desc"),
      upload: find("upload"), learn: find("learn"), prompt: find("claude"),
    };
  };

  const stages = [];
  let stage = null;
  let step = null;
  const warnings = [];

  for (const [i, row] of rows.entries()) {
    const at = (n) => (n >= 0 && row[n] ? row[n].trim() : "");

    if (isHeaderRow(row)) { C = readHeader(row); continue; }

    const stageCell = at(C.stage);
    if (stageCell) {
      stage = { title: stageTitle(stageCell), raw: stageCell, steps: [] };
      stages.push(stage);
    }

    const stepCell = at(C.step);

    /* A row with no step title continues the step above it, listing one of the
       documents that step requires. */
    if (!stepCell) {
      if (!step) continue;
      const line = [at(C.upload), at(C.learn)].find(isBullet);
      if (line) step.documents.push(line.replace(BULLET, "").trim());
      continue;
    }

    if (!stage) { warnings.push(`row ${i + 1}: step "${stepCell}" appears before any stage`); continue; }

    /* Classify by content first: the Stage 3 header swaps these two columns,
       and two of its rows then ignore their own header and use the original
       order. Only the cell itself can be trusted. */
    const a = at(C.upload);
    const b = at(C.learn);
    let upload = a;
    let learn = b;
    if (!isUploadCell(a) && isUploadCell(b)) { upload = b; learn = a; }

    step = {
      title: stepTitle(stepCell),
      description: at(C.desc),
      upload,
      learn,
      prompt: at(C.prompt),
      documents: [],
      row: i + 1,
    };
    stage.steps.push(step);
  }

  return { stages, warnings };
}

/* ── Learn prose → content blocks ────────────────────────────────────────── */

const URL_RE = /https?:\/\/[^\s)]+/g;

/** A short line in a run of short lines is a list item, not a paragraph. */
const SHORT = 120;

/**
 * Turns one Learn cell into ordered blocks.
 *
 * Blank lines separate groups. Inside a group, bullet lines become a list and
 * a run of two or more short lines becomes a list too — the Excel writes both
 * ways. Everything else is prose.
 */
function proseBlocks(text) {
  const blocks = [];
  for (const group of text.split(/\n\s*\n/)) {
    const lines = group.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let plain = [];
    let bullets = [];
    const flushPlain = () => {
      if (!plain.length) return;
      // A run of short lines is the Excel's way of writing a list.
      if (plain.length >= 2 && plain.every((l) => l.length <= SHORT)) {
        blocks.push({ kind: "list", data: { entries: plain } });
      } else {
        blocks.push({ kind: "paragraph", body: plain.join(" ") });
      }
      plain = [];
    };
    const flushBullets = () => {
      if (!bullets.length) return;
      blocks.push({ kind: "list", data: { entries: bullets } });
      bullets = [];
    };

    for (const line of lines) {
      if (isBullet(line)) { flushPlain(); bullets.push(line.replace(BULLET, "").trim()); }
      else { flushBullets(); plain.push(line); }
    }
    flushPlain();
    flushBullets();
  }
  return blocks.filter((b) => (b.body ?? "").trim() || (b.data?.entries ?? []).length);
}

/**
 * Pulls the addresses out of a Learn cell.
 *
 * The label that introduces a link ("Tutorial:", "Apply:", "Website:") goes
 * with it; leaving it behind is what produced sentences ending in a bare
 * "Tuturial :". The Excel's own misspelling is matched deliberately.
 */
const LINK_LABEL_RE = /(?:tutorial|tuturial|apply|website|recommended provider)\s*:?\s*$/i;

function splitLinks(learn) {
  const urls = learn.match(URL_RE) ?? [];
  let prose = learn;
  for (const url of urls) {
    const at = prose.indexOf(url);
    if (at < 0) continue;
    const before = prose.slice(0, at);
    const label = LINK_LABEL_RE.exec(before);
    prose = (label ? before.slice(0, label.index) : before) + prose.slice(at + url.length);
  }
  // A label whose link sat in another cell leaves the same dangling word.
  prose = prose.split("\n").map((l) => l.replace(LINK_LABEL_RE, "").trimEnd()).join("\n");
  return { prose, urls };
}

/** Every block a step's Learn tab renders, in order. */
function blocksFor(step, spec) {
  const blocks = [];
  const push = (b) => blocks.push({ title: "", body: "", data: {}, ...b });

  // Blocks the Excel wants above everything else: the red warning cards and
  // the "Application Under Review" status card.
  for (const b of spec.blocks ?? []) if (b.first) push(b);

  // The preparation banner sits above the Learn content and stays until the
  // step is completed.
  if (spec.banner) {
    push({ kind: "banner", title: spec.banner.title, data: { entries: spec.banner.entries } });
  }

  // Programme-derived facts are stated above the written guidance.
  if (spec.program) push({ kind: "program", data: { field: spec.program } });

  /* A plan whose Learn content is replaced does not see the Excel prose at
     all, so the prose is tagged for the other plans and the replacement is
     added in its place. */
  const replaced = Object.keys(spec.replaceLearn ?? {});
  const proseAudience = replaced.length
    ? PLANS.filter((p) => !replaced.includes(p))
    : [];

  if (step.learn && !isUploadCell(step.learn) && !spec.ignoreLearn) {
    const { prose, urls } = splitLinks(step.learn);
    for (const block of proseBlocks(prose)) {
      // One plan sees the Excel prose, the other sees its replacement.
      push(proseAudience.length === 1 ? { ...block, plan: proseAudience[0] } : block);
    }
    for (const url of urls) {
      const video = /youtu\.?be|vimeo\.com/.test(url);
      if (video) push({ kind: "video", title: videoTitle(url), data: { url } });
      else push({ kind: "link", data: { url, label: linkLabel(url), newTab: true, internal: false } });
    }
  }

  for (const [plan, message] of Object.entries(spec.replaceLearn ?? {})) {
    push({ kind: "paragraph", body: message, plan });
  }

  for (const b of spec.blocks ?? []) if (!b.first) push(b);

  return blocks;
}

/* ── Document requirements ───────────────────────────────────────────────── */

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

/** Keys must be unique inside a step: they are half of the upload's identity. */
function uniqueKeys(names) {
  const seen = new Map();
  return names.map((name) => {
    const base = slug(name) || "document";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
}

const requirement = (key, name, { photo = false, description = "", required = true } = {}) => ({
  key, name, description, instructions: "", required,
  // The Claude Prompt for Personal Photo: image or PDF there, PDF elsewhere.
  acceptedTypes: photo ? "pdf,jpg,jpeg,png" : "pdf",
  maxSizeMb: 4, templatePath: "", templateName: "", notes: "",
});

function requirementsFor(step, spec) {
  const cell = (step.upload ?? "").trim();
  if (/^no upload required/i.test(cell) || /^no\b/i.test(cell)) return [];

  // A step that lists its documents gets one requirement per listed document.
  if (step.documents.length) {
    const keys = uniqueKeys(step.documents);
    return step.documents.map((name, i) => requirement(keys[i], name, { photo: spec.photo }));
  }

  // "Required Documents:" with nothing under it, or a plain "yes": the step
  // itself is the document.
  if (/^yes\b/i.test(cell) || /^required documents/i.test(cell)) {
    return [requirement(slug(step.title), step.title, {
      photo: spec.photo, description: step.description, required: !spec.allowSkip,
    })];
  }
  return [];
}

/* ── The rules payload each step carries ─────────────────────────────────── */

function rulesFor(step, spec, documents) {
  const rules = { documents, source: "xlsx" };
  if (spec.allowSkip) rules.allowSkip = true;
  if (spec.completion) rules.completion = spec.completion;
  if (spec.confirm) rules.confirm = spec.confirm;
  if (spec.capture) rules.capture = spec.capture;
  if (spec.decision) rules.decision = spec.decision;
  if (spec.gate) rules.gate = spec.gate;
  if (spec.requiresSteps) rules.requiresSteps = true;
  if (spec.example) rules.example = true;
  if (spec.announce) rules.announce = spec.announce;
  return rules;
}

/* ── SQL ─────────────────────────────────────────────────────────────────── */

const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
const j = (value) => `${q(JSON.stringify(value))}::jsonb`;

const STAGE_ICONS = ["landmark", "graduation-cap", "file-text", "plane", "route"];
const STAGE_TONES = ["purple", "green", "amber", "blue", "teal"];

/**
 * The whole journey as one JSON document.
 *
 * The migration loops over this instead of repeating a pair of INSERT/UPDATE
 * statements per step: the same rules payload was being written twice per step
 * and once more per block, which made the file four times longer than the
 * content it carries and gave four places for a change to be applied to three
 * of them.
 */
/**
 * Stage 5, in the same shape the Excel stages produce.
 *
 * It is appended to the same `stages` array rather than kept apart, so the
 * migration's one upsert loop creates it, the same archive rule protects it,
 * and an administrator edits it in the same screens. A separate path would have
 * meant a second set of bugs.
 */
function extraStages(startIndex) {
  return EXTRA_STAGES.map((stage, i) => ({
    title: stage.title,
    icon: stage.icon,
    tone: stage.tone,
    status: stage.status,
    rules: { degree: DEGREE, source: "xlsx", authored: "stage5", ...(stage.rules ?? {}) },
    steps: (stage.steps ?? []).map((step) => {
      /* The first step of the stage is the one an administrator answers; every
         other step is opened by it and then completed by the student alone. */
      const first = step === stage.steps[0];
      const rules = { documents: [], source: "xlsx" };
      if (step.cta) rules.cta = step.cta;
      if (step.support) rules.support = true;
      if (step.approveOnly) rules.approveOnly = true;
      if (step.allowSkip) rules.allowSkip = true;
      if (!first) {
        rules.completion = "self";
        rules.cta = rules.cta ?? "Done";
        rules.unlockedBy = stage.steps[0].title;
      }
      return {
        title: step.title,
        description: step.description,
        required: !step.allowSkip,
        rules,
        blocks: (step.blocks ?? []).map((b) => ({
          kind: b.kind,
          title: b.title ?? "",
          body: b.body ?? "",
          enabled: true,
          data: { ...(b.data ?? {}), source: "xlsx" },
        })),
      };
    }),
    sortOrder: startIndex + i,
  }));
}

function payload(stages) {
  return {
    stages: [...stages.map((stage, si) => ({
      title: stage.title,
      icon: STAGE_ICONS[si] ?? "route",
      tone: STAGE_TONES[si] ?? "blue",
      status: "published",
      rules: { degree: DEGREE, source: "xlsx", excelStage: stage.raw, ...(STAGES[stage.title] ?? {}) },
      steps: stage.steps.map((step) => ({
        title: step.title,
        description: step.description,
        required: !step.spec.allowSkip,
        rules: step.rules,
        blocks: [
          ...step.blocks.map((b) => ({
            kind: b.kind,
            title: b.title ?? "",
            body: b.body ?? "",
            enabled: true,
            data: { ...b.data, source: "xlsx", ...(b.plan ? { plan: b.plan } : {}) },
          })),
          /* The Excel asks for an Example section the administrator can enable,
             edit or hide. Seeded switched off so an empty one is never shown. */
          ...(step.spec.example
            ? [{ kind: "example", title: "Example", body: "", enabled: false, data: { source: "xlsx" } }]
            : []),
          /* A tutorial video the Excel asks for but gives no address to. Seeded
             switched off with an empty url, so the administrator pastes a link
             into a waiting block rather than building one, and a student never
             sees an empty player in the meantime. */
          ...(step.spec.videoSlot
            ? [{
                kind: "video", title: step.spec.videoSlot.title, body: "", enabled: false,
                data: { url: "", source: "xlsx", ...(step.spec.videoSlot.plan ? { plan: step.spec.videoSlot.plan } : {}) },
              }]
            : []),
        ],
      })),
    })), ...extraStages(stages.length)],
  };
}

function toSql(model, source, content) {
  const { stages, warnings } = model;
  const steps = stages.reduce((n, s) => n + s.steps.length, 0);
  const documents = stages.reduce((n, s) => n + s.steps.reduce((m, t) => m + t.requirements.length, 0), 0);
  const out = [];

  out.push(`-- 12 · Journey content for ${COUNTRY} ${DEGREE}, imported from the Excel source of truth.
--
-- Generated by scripts/import-journey.mjs — do not hand-edit. Re-run the script
-- after the Excel changes and apply the new file.
--
-- Source: ${source}
-- Stages: ${stages.length} · Steps: ${steps} · Documents: ${documents} · Plans: ${PLANS.join(", ")}
${warnings.map((w) => `-- Warning: ${w}\n`).join("")}--
-- The journey travels as one JSON document and the migration loops over it.
-- Writing a statement per step instead meant the same rules payload appeared
-- twice per step and once per block: four times the length of the content it
-- carries, and four places for an edit to reach three of.
--
-- Idempotent: stages and steps are matched by title, so re-running UPDATES the
-- existing rows and never deletes a step that journey_progress points at.
-- Anything the Excel no longer lists is archived at the end, never dropped.

do $journey$
declare
  content  jsonb := ${j(content)};
  v_plan   text;
  v_stage  uuid;
  v_step   uuid;
  s        jsonb;
  st       jsonb;
  b        jsonb;
  si       int;
  pi       int;
  bi       int;
begin
foreach v_plan in array array[${PLANS.map(q).join(", ")}] loop

  si := 0;
  for s in select value from jsonb_array_elements(content -> 'stages') loop

    select id into v_stage from public.journey_stages
     where country = ${q(COUNTRY)} and plan = v_plan and title = s ->> 'title' limit 1;

    if v_stage is null then
      insert into public.journey_stages (country, plan, sort_order, title, description, icon, tone, status, rules)
      values (${q(COUNTRY)}, v_plan, si, s ->> 'title', '', s ->> 'icon', s ->> 'tone', s ->> 'status', s -> 'rules')
      returning id into v_stage;
    else
      update public.journey_stages
         set sort_order = si, icon = s ->> 'icon', tone = s ->> 'tone',
             status = s ->> 'status', rules = s -> 'rules'
       where id = v_stage;
    end if;

    pi := 0;
    for st in select value from jsonb_array_elements(s -> 'steps') loop

      select id into v_step from public.journey_steps
       where stage_id = v_stage and title = st ->> 'title' limit 1;

      if v_step is null then
        insert into public.journey_steps (stage_id, sort_order, title, description, status, required, rules)
        values (v_stage, pi, st ->> 'title', st ->> 'description', 'published',
                (st ->> 'required')::boolean, st -> 'rules')
        returning id into v_step;
      else
        update public.journey_steps
           set sort_order = pi, description = st ->> 'description', status = 'published',
               required = (st ->> 'required')::boolean, rules = st -> 'rules'
         where id = v_step;
      end if;

      /* Content is owned by the import, so it is replaced wholesale: nothing
         references a block id, unlike steps. Blocks an administrator added by
         hand are not tagged 'xlsx' and survive untouched. */
      delete from public.journey_blocks
       where step_id = v_step and (data ->> 'source') = 'xlsx';

      bi := 0;
      for b in select value from jsonb_array_elements(st -> 'blocks') loop
        insert into public.journey_blocks (step_id, sort_order, kind, enabled, title, body, data, audience)
        values (v_step, bi, b ->> 'kind', (b ->> 'enabled')::boolean,
                b ->> 'title', b ->> 'body', b -> 'data', 'student');
        bi := bi + 1;
      end loop;

      pi := pi + 1;
    end loop;

    -- A step the Excel dropped stays in the table, archived, so progress keeps.
    update public.journey_steps set status = 'archived'
     where stage_id = v_stage and status <> 'archived'
       and title not in (select value ->> 'title' from jsonb_array_elements(s -> 'steps'));

    si := si + 1;
  end loop;

  -- A stage the Excel no longer lists (an earlier import's "MIGRIS Application")
  -- is archived rather than deleted: journey_progress cascades from steps.
  update public.journey_stages set status = 'archived'
   where country = ${q(COUNTRY)} and plan = v_plan and status <> 'archived'
     and (rules ->> 'source') = 'xlsx'
     and title not in (select value ->> 'title' from jsonb_array_elements(content -> 'stages'));

end loop;
end $journey$;
`);

  /* The wording of every automated message. Upserted, not replaced: an
     administrator may reword a template, and a re-import must not undo that
     silently — only events this script has never seen are inserted. */
  out.push(`
-- ── Message templates ──────────────────────────────────────────────────────
-- One row per event and channel. journey_emit() reads these, so a step names an
-- event and never carries wording. Existing rows keep any edits an
-- administrator made; only new events are added.
`);
  for (const [event, channels] of Object.entries(TEMPLATES)) {
    for (const [channel, t] of Object.entries(channels)) {
      out.push(`insert into public.journey_templates (event, channel, title, body, link, priority, pinned)
values (${q(event)}, ${q(channel)}, ${q(t.title ?? "")}, ${q(t.body ?? "")}, ${q(t.link ?? "")}, ${q(t.priority ?? "normal")}, ${Boolean(t.pinned)})
on conflict (event, channel) do nothing;`);
    }
  }

  out.push(`
notify pgrst, 'reload schema';
`);
  return out.join("\n");
}

/* ── Verification ────────────────────────────────────────────────────────────
   Applying a migration and reading "Success" back proves the statement ran, not
   that the content arrived. This counts the rows instead, against the numbers
   this same script generated, for both service plans.

   It is a SQL file rather than a script because the journey tables are readable
   `to authenticated` only, so anything driving the public API would need to sign
   in — and the account this project uses signs in with Google, which no script
   can do. The Supabase SQL editor is already an authenticated session. */

/**
 * Counts are read off the SAME payload the migration inserts, never recomputed.
 * Recomputing them here meant adding one seeded block to the importer made the
 * verification disagree with the migration it was checking — the very drift this
 * file exists to catch.
 */
function toVerifySql(content, source) {
  const rows = content.stages.map((stage, si) => ({
    title: stage.title,
    sortOrder: si,
    steps: stage.steps.length,
    docs: stage.steps.reduce((n, s) => n + (s.rules.documents?.length ?? 0), 0),
    blocks: stage.steps.reduce((n, s) => n + s.blocks.length, 0),
  }));


  const totals = rows.reduce(
    (t, r) => ({ steps: t.steps + r.steps, docs: t.docs + r.docs, blocks: t.blocks + r.blocks }),
    { steps: 0, docs: 0, blocks: 0 },
  );

  const values = rows
    .map((r) => `    (${q(r.title)}, ${r.sortOrder}, ${r.steps}, ${r.docs}, ${r.blocks})`)
    .join(",\n");

  return `-- 19 · Verification for the ${COUNTRY} ${DEGREE} journey content.
--
-- Generated by scripts/import-journey.mjs — do not hand-edit. Re-run the script
-- after the Excel changes, apply 12_journey_content_lt_bachelor.sql, then run
-- this and read the status column.
--
-- Source: ${source}
-- Expects, for EACH of ${PLANS.join(" and ")}:
--   ${rows.length} stages · ${totals.steps} steps · ${totals.docs} documents · ${totals.blocks} learn blocks
--
-- EVERY ROW OF QUERY 1 MUST READ 'OK'. Anything else names the stage and the
-- plan it went wrong on.
--
-- Only rows the import owns are counted: stages and steps tagged
-- rules ->> 'source' = 'xlsx', and blocks tagged data ->> 'source' = 'xlsx'.
-- A stage, step or block an administrator adds by hand is therefore ignored
-- here rather than reported as a mismatch — this checks the Excel's content,
-- not everything that happens to exist.

-- ── 1 · Per stage, per plan ────────────────────────────────────────────────
with expected (stage_title, sort_order, steps, docs, blocks) as (
  values
${values}
),
plans (plan) as (
  values ${PLANS.map((p) => `(${q(p)})`).join(", ")}
),
want as (
  select p.plan, e.* from plans p cross join expected e
),
step_facts as (
  select s.plan,
         s.title as stage_title,
         st.id   as step_id,
         coalesce(jsonb_array_length(st.rules -> 'documents'), 0) as docs
    from public.journey_stages s
    left join public.journey_steps st
           on st.stage_id = s.id
          and st.status = 'published'
          and (st.rules ->> 'source') = 'xlsx'
   where s.country = ${q(COUNTRY)}
     and s.status = 'published'
     and (s.rules ->> 'source') = 'xlsx'
),
block_counts as (
  select step_id, count(*) as n
    from public.journey_blocks
   where (data ->> 'source') = 'xlsx'
   group by step_id
),
actual as (
  select f.plan,
         f.stage_title,
         count(f.step_id)                        as steps,
         coalesce(sum(f.docs), 0)                as docs,
         coalesce(sum(coalesce(b.n, 0)), 0)      as blocks
    from step_facts f
    left join block_counts b on b.step_id = f.step_id
   group by f.plan, f.stage_title
)
select
  coalesce(w.plan, a.plan)                                as plan,
  coalesce(w.sort_order + 1, 0)                           as stage,
  coalesce(w.stage_title, a.stage_title)                  as stage_title,
  coalesce(a.steps,  0) || ' / ' || coalesce(w.steps,  0) as steps_got_want,
  coalesce(a.docs,   0) || ' / ' || coalesce(w.docs,   0) as docs_got_want,
  coalesce(a.blocks, 0) || ' / ' || coalesce(w.blocks, 0) as blocks_got_want,
  case
    when a.stage_title is null then 'MISSING STAGE'
    when w.stage_title is null then 'UNEXPECTED STAGE'
    when a.steps = w.steps and a.docs = w.docs and a.blocks = w.blocks then 'OK'
    else 'MISMATCH'
  end                                                     as status
  from want w
  full outer join actual a
    on a.plan = w.plan and a.stage_title = w.stage_title
 order by plan, stage;

-- ── 2 · Totals per plan ────────────────────────────────────────────────────
-- Expect ${totals.steps} steps, ${totals.docs} documents and ${totals.blocks} blocks on each plan.
select s.plan,
       count(distinct s.id)  as stages,
       count(st.id)          as steps,
       coalesce(sum(coalesce(jsonb_array_length(st.rules -> 'documents'), 0)), 0) as documents,
       coalesce((select count(*) from public.journey_blocks b
                  join public.journey_steps s2 on s2.id = b.step_id
                  join public.journey_stages g on g.id = s2.stage_id
                 where g.plan = s.plan and g.country = ${q(COUNTRY)}
                   and g.status = 'published' and (g.rules ->> 'source') = 'xlsx'
                   and s2.status = 'published' and (s2.rules ->> 'source') = 'xlsx'
                   and (b.data ->> 'source') = 'xlsx'), 0) as learn_blocks
  from public.journey_stages s
  left join public.journey_steps st
         on st.stage_id = s.id and st.status = 'published' and (st.rules ->> 'source') = 'xlsx'
 where s.country = ${q(COUNTRY)} and s.status = 'published' and (s.rules ->> 'source') = 'xlsx'
 group by s.plan
 order by s.plan;

-- ── 3 · Message templates ──────────────────────────────────────────────────
-- journey_emit() reads these. Empty means every automated notification, chat
-- message and WhatsApp message silently does nothing.
select event, string_agg(channel, ', ' order by channel) as channels
  from public.journey_templates
 group by event
 order by event;

-- ── 4 · Nothing stale left published ───────────────────────────────────────
-- An earlier import's stage that the Excel no longer lists must be archived.
-- This should return NO rows.
select plan, title, status
  from public.journey_stages
 where country = ${q(COUNTRY)}
   and status = 'published'
   and (rules ->> 'source') = 'xlsx'
   and title not in (${rows.map((r) => q(r.title)).join(", ")})
 order by plan, title;
`;
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

const rows = readSheet(SOURCE);
const model = buildModel(rows);

// Attach the behaviour spec and derive everything the SQL needs.
const unusedSpec = new Map(Object.entries(SPEC).map(([s, steps]) => [s, new Set(Object.keys(steps))]));
for (const stage of model.stages) {
  for (const step of stage.steps) {
    const spec = SPEC[stage.title]?.[step.title] ?? {};
    unusedSpec.get(stage.title)?.delete(step.title);
    step.spec = spec;
    step.requirements = requirementsFor(step, spec);
    step.rules = rulesFor(step, spec, step.requirements);
    step.blocks = blocksFor(step, spec);
  }
}
/* ── Optional modules ──────────────────────────────────────────────────────
   Steps a student switches on, appended after the Excel's own steps for the
   stage. They are built here rather than in a separate migration for one
   reason: toSql archives every step in a stage whose title it does not know,
   so a module defined anywhere else would be archived by the next import,
   taking the student's uploads out of the journey with it. */
for (const stage of model.stages) {
  for (const mod of MODULES[stage.title] ?? []) {
    const parentRules = {
      documents: [],
      source: "module",
      module: mod.module,
      optionalModule: true,
      icon: mod.icon ?? "",
      dialogs: mod.dialogs ?? {},
      /* The container is never completed directly; its children carry the work. */
      completion: "module",
    };
    stage.steps.push({
      title: mod.title,
      description: mod.description,
      spec: {},
      requirements: [],
      rules: parentRules,
      blocks: [],
    });

    for (const child of mod.children) {
      const names = child.documents.map((d) => (typeof d === "string" ? d : d.name));
      const keys = uniqueKeys(names);
      const requirements = child.documents.map((d, i) => requirement(
        keys[i], names[i],
        { required: typeof d === "string" ? true : d.required !== false },
      ));
      const rules = {
        documents: requirements,
        source: "module",
        moduleOf: mod.module,
        completion: "self",
        cta: "Done",
      };
      if (child.allowSkip) rules.allowSkip = true;
      if (child.skipConfirm) rules.confirm = child.skipConfirm;
      stage.steps.push({
        title: child.title,
        description: child.description,
        spec: { allowSkip: Boolean(child.allowSkip) },
        requirements,
        rules,
        /* "The Learn section should remain empty for now. Administrators will
           populate it later." An empty step renders its own placeholder, and the
           admin editor can add blocks to it like any other step. */
        blocks: [],
      });
    }
  }
}

/* A spec entry that matches no step means the Excel was renamed underneath it
   and the behaviour would silently stop being applied. */
for (const [stage, leftover] of unusedSpec) {
  if (!model.stages.some((s) => s.title === stage)) model.warnings.push(`spec stage "${stage}" matched no stage in the Excel`);
  else for (const step of leftover) model.warnings.push(`spec step "${stage} / ${step}" matched no step in the Excel`);
}

mkdirSync(dirname(OUT), { recursive: true });
/* One payload, two files: the migration inserts it and the verification asserts
   it, so they can never describe different journeys. */
const content = payload(model.stages);
writeFileSync(OUT, toSql(model, SOURCE, content));
writeFileSync(VERIFY_OUT, toVerifySql(content, SOURCE));

console.log(`Read ${rows.length} rows from ${SOURCE}\n`);
let totalSteps = 0;
let totalDocs = 0;
for (const stage of model.stages) {
  console.log(`  ${stage.raw}  (${stage.steps.length} steps)`);
  for (const step of stage.steps) {
    totalSteps += 1;
    totalDocs += step.requirements.length;
    const bits = [
      step.requirements.length ? `${step.requirements.length} doc${step.requirements.length === 1 ? "" : "s"}` : null,
      step.rules.completion ? `completion:${step.rules.completion}` : null,
      step.rules.capture ? `capture:${step.rules.capture}` : null,
      step.rules.decision ? `decision:${step.rules.decision}` : null,
      step.rules.gate ? "gate" : null,
      step.rules.confirm ? "confirm" : null,
      step.rules.requiresSteps ? "prerequisites" : null,
      step.rules.allowSkip ? "optional" : null,
      step.rules.announce ? "announce" : null,
      step.spec.program ? `programme:${step.spec.program}` : null,
      step.spec.replaceLearn ? `plan-learn:${Object.keys(step.spec.replaceLearn).join("+")}` : null,
      step.spec.example ? "example" : null,
    ].filter(Boolean);
    console.log(`     · ${step.title}  [${step.blocks.length} blocks${bits.length ? `, ${bits.join(", ")}` : ""}]`);
  }
}
for (const stage of EXTRA_STAGES) {
  const docs = 0;
  const blocks = (stage.steps ?? []).reduce((n, st) => n + (st.blocks ?? []).length, 0);
  console.log(`  ${stage.title}  (${(stage.steps ?? []).length} steps, ${blocks} learn modules, Full Service only)`);
  totalSteps += (stage.steps ?? []).length;
  totalDocs += docs;
}
console.log(`\n  ${model.stages.length} stages · ${totalSteps} steps · ${totalDocs} document requirements`);
for (const w of model.warnings) console.log(`  ! ${w}`);
console.log(`\nWrote ${OUT}`);
console.log(`Wrote ${VERIFY_OUT}`);
console.log("\nApply 12_… in the Supabase SQL editor, then run 19_… and check every row reads OK.");
