/* Markdown for Learn modules.
 *
 * Stage 5 stores its educational content as Markdown so an administrator can
 * rewrite a whole module by editing one field, with no developer and no
 * knowledge of the block model. That is the only place Markdown is used; the
 * earlier stages keep their typed blocks, and nothing here touches them.
 *
 * Written by hand rather than pulled from npm, for the reason the design system
 * already gives elsewhere in this repo: a parser is a small, well-understood
 * problem, and the alternative is a dependency whose output has to be sanitized
 * anyway.
 *
 * SAFETY: input is HTML-escaped FIRST, then Markdown is turned into tags. Every
 * tag in the output was therefore written by this file — an administrator
 * pasting `<script>` gets the visible text `<script>`, not a script. This is the
 * opposite order from sanitizing afterwards, and it cannot be bypassed by a
 * construction this parser does not know about.
 *
 * Supported, because the brief asks for exactly this: headings, bullet and
 * numbered lists, checklists, tables, links, images, bold, italic, inline code,
 * fenced code, block quotes, callouts and horizontal rules. Videos are handled
 * by the caller: see markdownSegments.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Only http(s) and mailto survive; anything else becomes an inert anchor. */
function safeUrl(raw: string): string | null {
  const url = raw.trim();
  return /^(https?:\/\/|mailto:|\/)/i.test(url) ? url : null;
}

/** Inline markup, applied to already-escaped text. */
function inline(text: string): string {
  let out = text;

  /* Code first: its contents must not be touched by the rules below. The
     placeholder is fenced with NUL, which cannot occur in the input because the
     text has already been HTML-escaped. Fencing it with spaces instead would
     match any bare number and destroy "at least 4 square meters". */
  const code: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_, body: string) => {
    code.push(`<code>${body}</code>`);
    return `\u0000${code.length - 1}\u0000`;
  });

  // ![alt](src)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt: string, src: string) => {
    const url = safeUrl(src);
    return url ? `<img src="${url}" alt="${alt}" loading="lazy" />` : m;
  });

  // [text](href) — external links open in a new tab, as they do elsewhere.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, href: string) => {
    const url = safeUrl(href);
    if (!url) return m;
    const external = /^https?:\/\//i.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${url}"${attrs}>${label}</a>`;
  });

  // A bare URL on its own becomes a link, so a pasted address is never dead.
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead: string, url: string) =>
    `${lead}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);

  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => code[Number(i)] ?? "");
}

/* Callouts reuse the Learn note styles the rest of the journey already uses, so
   a Markdown warning looks identical to one written as a block in Stage 1. */
const CALLOUTS: Record<string, { cls: string; label: string }> = {
  NOTE: { cls: "note", label: "Note" },
  INFO: { cls: "info", label: "Information" },
  TIP: { cls: "tip", label: "Tip" },
  EXAMPLE: { cls: "info", label: "Example" },
  WARNING: { cls: "warning", label: "Warning" },
  MISTAKE: { cls: "mistake", label: "Common mistake" },
  IMPORTANT: { cls: "important", label: "Important" },
};

const CHECK = /^[-*]\s+\[( |x|X)\]\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
/* Matches the ESCAPED form as well as the raw one: escaping runs first, so by
   the time block parsing sees a quote line it begins "&gt;", not ">". Without
   the first alternative every callout in Stage 5 rendered as a paragraph
   starting with a literal "&gt;". */
const QUOTE = /^(?:&gt;|>)\s?(.*)$/;
const TABLE_SEP = /^\|?[\s:-]*-[\s|:-]*\|?$/;

/**
 * Renders a Markdown document to HTML.
 * Block-level parsing is line based, which is all the brief's content needs and
 * keeps the whole thing readable.
 */
export function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const isTableRow = (l: string) => l.trim().startsWith("|") && l.trim().endsWith("|");
  const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i += 1; continue; }

    // Fenced code
    if (/^```/.test(trimmed)) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { body.push(lines[i]); i += 1; }
      i += 1;
      out.push(`<pre class="md-pre"><code>${body.join("\n")}</code></pre>`);
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(trimmed)) { out.push('<hr class="md-hr" />'); i += 1; continue; }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      const level = Math.min(6, heading[1].length);
      out.push(`<h${level} class="md-h md-h${level}">${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Callout: "> [!TIP] text" plus any following quoted lines.
    const quote = QUOTE.exec(trimmed);
    if (quote) {
      const body: string[] = [];
      let kind = "";
      let first = quote[1];
      const tag = /^\[!(\w+)\]\s*(.*)$/.exec(first);
      if (tag && CALLOUTS[tag[1].toUpperCase()]) { kind = tag[1].toUpperCase(); first = tag[2]; }
      if (first.trim()) body.push(first);
      i += 1;
      while (i < lines.length && QUOTE.test(lines[i].trim())) {
        body.push(QUOTE.exec(lines[i].trim())![1]);
        i += 1;
      }
      const meta = CALLOUTS[kind];
      const paragraphs = body.filter(Boolean).map((b) => `<p>${inline(b)}</p>`).join("");
      out.push(meta
        ? `<div class="lrn-note lrn-note-${meta.cls} md-callout"><div class="lrn-note-main"><span class="lrn-note-title">${meta.label}</span>${paragraphs}</div></div>`
        : `<blockquote class="md-quote">${paragraphs}</blockquote>`);
      continue;
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1].trim())) {
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) { body.push(cells(lines[i])); i += 1; }
      out.push(
        `<div class="md-tablewrap"><table class="md-table"><thead><tr>${
          head.map((c) => `<th>${c}</th>`).join("")
        }</tr></thead><tbody>${
          body.map((r) => `<tr>${head.map((_, n) => `<td>${r[n] ?? ""}</td>`).join("")}</tr>`).join("")
        }</tbody></table></div>`,
      );
      continue;
    }

    // Checklist — the brief ends every module with one.
    if (CHECK.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && CHECK.test(lines[i].trim())) {
        const m = CHECK.exec(lines[i].trim())!;
        const done = m[1].toLowerCase() === "x";
        /* A reading aid, deliberately not persisted: the step's own state is
           what records progress, and two competing records of "done" is how a
           student ends up trusting the wrong one. */
        items.push(
          `<li><input type="checkbox" ${done ? "checked " : ""}disabled aria-label="${m[2].replace(/<[^>]*>/g, "")}" /><span>${inline(m[2])}</span></li>`,
        );
        i += 1;
      }
      out.push(`<ul class="md-check">${items.join("")}</ul>`);
      continue;
    }

    if (BULLET.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && BULLET.test(lines[i].trim()) && !CHECK.test(lines[i].trim())) {
        items.push(`<li>${inline(BULLET.exec(lines[i].trim())![1])}</li>`);
        i += 1;
      }
      out.push(`<ul class="md-ul">${items.join("")}</ul>`);
      continue;
    }

    if (NUMBERED.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && NUMBERED.test(lines[i].trim())) {
        items.push(`<li>${inline(NUMBERED.exec(lines[i].trim())![1])}</li>`);
        i += 1;
      }
      out.push(`<ol class="md-ol">${items.join("")}</ol>`);
      continue;
    }

    // Paragraph: consecutive plain lines join, as Markdown expects.
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || HEADING.test(l) || BULLET.test(l) || NUMBERED.test(l) || QUOTE.test(l)
        || /^```/.test(l) || /^(---|\*\*\*|___)$/.test(l) || isTableRow(lines[i])) break;
      para.push(l);
      i += 1;
    }
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}

/* ── Videos ───────────────────────────────────────────────────────────────── */

/**
 * Splits a document so videos can be rendered by the design system's own player
 * instead of a raw iframe.
 *
 * A line containing nothing but a YouTube or Vimeo address is a video. Anything
 * else accumulates into an HTML segment. The caller maps the segments, so the
 * poster-then-load behaviour of HeroVideoDialog is preserved and no third-party
 * frame loads until a student asks for it.
 */
export type MarkdownSegment =
  | { kind: "html"; html: string }
  | { kind: "video"; url: string; title: string };

const VIDEO_LINE = /^(?:\[([^\]]*)\]\()?\s*(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\/[^\s)]+)\s*\)?$/;

export function markdownSegments(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) segments.push({ kind: "html", html: renderMarkdown(text) });
    buffer = [];
  };

  for (const line of (markdown ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    const video = VIDEO_LINE.exec(line.trim());
    if (video) {
      flush();
      segments.push({ kind: "video", url: video[2], title: (video[1] ?? "").trim() || "Video guide" });
      continue;
    }
    buffer.push(line);
  }
  flush();
  return segments;
}

/** First heading or sentence, for a collapsed module summary. */
export function markdownSummary(markdown: string, max = 140): string {
  const text = (markdown ?? "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/[*_`>|#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
