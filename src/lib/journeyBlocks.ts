"use client";

/* The block contract, defined once.

   The admin editor and the student renderer both read this file, which is the
   whole point: the earlier bug was a generic form writing a shape the renderer
   did not read, so a block saved fine and then showed nothing. Every kind now
   has one declared data shape, one normalizer, and one editor.

   Normalizers accept the older shapes too (items as a newline string), so
   content authored before this change keeps rendering. */

import type { DbBlock } from "@/lib/journeyDb";

export type BlockKind =
  | "heading" | "paragraph" | "list" | "numbered" | "checklist" | "accordion"
  | "table" | "image" | "video" | "link" | "attachment"
  | "note" | "info" | "tip" | "warning" | "mistake"
  /* Resolved at read time from the student's own programme, so the Excel never
     has to repeat a fee or a URL that already lives in the programme engine. */
  | "program";

export const BLOCK_KINDS: { value: BlockKind; label: string; group: "text" | "media" | "callout" }[] = [
  { value: "heading",    label: "Heading",        group: "text" },
  { value: "paragraph",  label: "Paragraph",      group: "text" },
  { value: "list",       label: "Bullet list",    group: "text" },
  { value: "numbered",   label: "Numbered list",  group: "text" },
  { value: "checklist",  label: "Checklist",      group: "text" },
  { value: "accordion",  label: "Accordion",      group: "text" },
  { value: "table",      label: "Table",          group: "text" },
  { value: "image",      label: "Image",          group: "media" },
  { value: "video",      label: "Video",          group: "media" },
  { value: "link",       label: "Link",           group: "media" },
  { value: "attachment", label: "Attachment",     group: "media" },
  { value: "note",       label: "Note",           group: "callout" },
  { value: "info",       label: "Information",    group: "callout" },
  { value: "tip",        label: "Tip",            group: "callout" },
  { value: "warning",    label: "Warning",        group: "callout" },
  { value: "mistake",    label: "Common mistake", group: "callout" },
  { value: "program",    label: "Programme detail", group: "media" },
];

/** Which fact a "program" block pulls from the student's programme record. */
export type ProgramField = "url" | "english" | "app_fee" | "tuition";

export const PROGRAM_FIELD_LABEL: Record<ProgramField, string> = {
  url: "Programme page",
  english: "Accepted English certificates",
  app_fee: "Application fee",
  tuition: "Tuition fee",
};

export const programField = (block: Pick<DbBlock, "data">): ProgramField =>
  ((block.data as { field?: string })?.field as ProgramField) ?? "url";

/** A block may be limited to one service plan; empty means everyone sees it. */
export const blockPlan = (block: Pick<DbBlock, "data">): string =>
  String((block.data as { plan?: string })?.plan ?? "");

export const KIND_LABEL = new Map(BLOCK_KINDS.map((k) => [k.value, k.label]));
export const CALLOUT_KINDS = new Set<BlockKind>(["note", "info", "tip", "warning", "mistake"]);

/** Kinds that no longer exist; anything stored as one renders as a paragraph. */
const RETIRED = new Set(["faq", "success"]);

export const blockKindOf = (kind: string): BlockKind =>
  RETIRED.has(kind) ? "paragraph" : (BLOCK_KINDS.some((k) => k.value === kind) ? (kind as BlockKind) : "paragraph");

/* ── Data shapes ──────────────────────────────────────────────────────────── */

export type ChecklistItem = { text: string; checked: boolean };
export type AccordionItem = { title: string; body: string };
export type TableData = { columns: string[]; rows: string[][] };
export type LinkData = { url: string; label: string; newTab: boolean; internal: boolean };
export type ImageData = { url: string; alt: string; caption: string };
export type AttachmentData = { path: string; fileName: string; description: string };

type Raw = Record<string, unknown>;
const raw = (b: Pick<DbBlock, "data">): Raw => (b.data ?? {}) as Raw;

/* Reading rule that matters: normalizers NEVER drop empty entries.
   An entry the administrator has just added is empty by definition, and
   discarding it made "Add task" look broken and made clearing a field delete
   the row. Emptiness is a RENDER-time concern, so only the student renderer
   filters, through the `forDisplay` helpers below. */

/** Legacy support: lists used to be one newline-separated string. */
function toLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? ""));
  if (typeof value === "string") return value.split("\n").map((l) => l.trim()).filter(Boolean);
  return [];
}

export function listItems(block: Pick<DbBlock, "data">): string[] {
  const d = raw(block);
  return toLines(d.entries ?? d.items);
}

export function checklistItems(block: Pick<DbBlock, "data">): ChecklistItem[] {
  const d = raw(block);
  if (Array.isArray(d.entries)) {
    return (d.entries as Raw[]).map((e) => ({ text: String(e?.text ?? ""), checked: Boolean(e?.checked) }));
  }
  return toLines(d.items).map((text) => ({ text, checked: false }));
}

export function accordionItems(block: Pick<DbBlock, "data">): AccordionItem[] {
  const d = raw(block);
  if (Array.isArray(d.entries)) {
    return (d.entries as Raw[]).map((e) => ({ title: String(e?.title ?? ""), body: String(e?.body ?? "") }));
  }
  // Legacy "Title | Body" lines.
  return toLines(d.items).map((line) => {
    const [head, ...rest] = line.split("|");
    return { title: head.trim(), body: rest.join("|").trim() };
  });
}

/* Display variants: what a student actually sees, with blanks removed. */
export const listItemsForDisplay = (b: Pick<DbBlock, "data">) => listItems(b).map((t) => t.trim()).filter(Boolean);
export const checklistForDisplay = (b: Pick<DbBlock, "data">) => checklistItems(b).filter((e) => e.text.trim());
export const accordionForDisplay = (b: Pick<DbBlock, "data">) => accordionItems(b).filter((e) => e.title.trim() || e.body.trim());

export function tableData(block: Pick<DbBlock, "data">): TableData {
  const d = raw(block);
  if (Array.isArray(d.columns) && Array.isArray(d.rows)) {
    const columns = (d.columns as unknown[]).map((c) => String(c ?? ""));
    const rows = (d.rows as unknown[][]).map((r) => {
      const cells = Array.isArray(r) ? r.map((c) => String(c ?? "")) : [];
      return Array.from({ length: columns.length }, (_, i) => cells[i] ?? "");
    });
    return { columns, rows };
  }
  // Legacy pipe-separated lines, first line the header.
  const lines = toLines(d.items).map((l) => l.split("|").map((c) => c.trim()));
  if (!lines.length) return { columns: [], rows: [] };
  const [columns, ...rows] = lines;
  return { columns, rows: rows.map((r) => Array.from({ length: columns.length }, (_, i) => r[i] ?? "")) };
}

export function linkData(block: Pick<DbBlock, "data">): LinkData {
  const d = raw(block);
  return {
    url: String(d.url ?? ""),
    label: String(d.label ?? ""),
    newTab: d.newTab === undefined ? true : Boolean(d.newTab),
    internal: Boolean(d.internal),
  };
}

export function imageData(block: Pick<DbBlock, "data">): ImageData {
  const d = raw(block);
  return { url: String(d.url ?? ""), alt: String(d.alt ?? ""), caption: String(d.caption ?? "") };
}

export function attachmentData(block: Pick<DbBlock, "data">): AttachmentData {
  const d = raw(block);
  return { path: String(d.path ?? ""), fileName: String(d.fileName ?? ""), description: String(d.description ?? "") };
}

/** Turns a YouTube or Vimeo link of any shape into its embed form. */
export function embedUrl(input: string): string | null {
  const url = input.trim();
  const yt = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** The data a freshly added block starts with, so no kind is ever born empty. */
export function starterData(kind: BlockKind): Record<string, unknown> {
  switch (kind) {
    case "list":
    case "numbered":   return { entries: ["First item"] };
    case "checklist":  return { entries: [{ text: "First task", checked: false }] };
    case "accordion":  return { entries: [{ title: "Question or title", body: "The answer or detail." }] };
    case "table":      return { columns: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "link":       return { url: "", label: "", newTab: true, internal: false };
    case "image":      return { url: "", alt: "", caption: "" };
    case "attachment": return { path: "", fileName: "", description: "" };
    case "video":      return { url: "" };
    default:           return {};
  }
}

/* ── Rich text ────────────────────────────────────────────────────────────── */

/**
 * Paragraphs are stored as a small subset of HTML written by the mini editor.
 * Anything outside the allow-list is stripped, so nothing an administrator
 * pastes can inject markup into a student's page.
 */
/** Elements whose *contents* must go too, not just their tags. */
const DANGEROUS_ELEMENTS = /<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const ORPHAN_DANGEROUS = /<\/?(?:script|style|iframe|object|embed|noscript)\b[^>]*>/gi;
const DISALLOWED_TAGS = /<(?!\/?(?:b|strong|i|em|u|a|br|p|ul|ol|li)\b)[^>]*>/gi;
const EVENT_ATTRS = /\s(?:on\w+|style|class|srcset|src|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
/** Matches the whole href attribute, quotes included, so nothing is left behind. */
const BAD_HREF = /\shref\s*=\s*(?:"\s*(?:javascript|data|vbscript):[^"]*"|'\s*(?:javascript|data|vbscript):[^']*'|(?:javascript|data|vbscript):[^\s>]*)/gi;

export function sanitizeRichText(html: string): string {
  return html
    .replace(DANGEROUS_ELEMENTS, "")
    .replace(ORPHAN_DANGEROUS, "")
    .replace(DISALLOWED_TAGS, "")
    .replace(EVENT_ATTRS, "")
    .replace(BAD_HREF, ' href="#"');
}

/** True when a block has nothing worth rendering, so it can be skipped. */
export function isEmptyBlock(block: Pick<DbBlock, "kind" | "title" | "body" | "data">): boolean {
  const kind = blockKindOf(block.kind);
  const hasText = Boolean((block.title ?? "").trim() || (block.body ?? "").trim());
  switch (kind) {
    case "list":
    case "numbered":   return listItemsForDisplay(block).length === 0;
    case "checklist":  return checklistForDisplay(block).length === 0;
    case "accordion":  return accordionForDisplay(block).length === 0;
    case "table":      return tableData(block).columns.length === 0;
    case "image":      return !imageData(block).url;
    case "video":      return !embedUrl(String((block.data as Raw)?.url ?? ""));
    case "link":       return !linkData(block).url;
    case "attachment": return !attachmentData(block).path;
    case "program":    return false;   // always resolvable from the programme
    default:           return !hasText;
  }
}
