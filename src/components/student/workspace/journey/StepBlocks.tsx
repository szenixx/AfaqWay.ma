"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronDown, Download, ExternalLink, Paperclip, TriangleAlert } from "lucide-react";
import { Loader, HeroVideoDialog } from "@/components/ds";
import { fileUrl } from "@/lib/storage/client";
import { fetchBlocks, fetchReminders, subscribeJourney, type DbBlock, type DbReminder } from "@/lib/journeyDb";
import {
  accordionForDisplay, attachmentData, blockKindOf, blockPlan, checklistForDisplay,
  embedUrl, imageData, isEmptyBlock, linkData, listItemsForDisplay, moduleSummary,
  programField, sanitizeRichText, tableData, CALLOUT_KINDS,
} from "@/lib/journeyBlocks";
import { markdownSegments } from "@/lib/markdown";
import { ProgramBlock } from "./ProgramBlock";
import type { StudyApp } from "@/lib/studyApplication";

/* The Learn content a student reads.

   This renders like a documentation page, not a dashboard: headings, text,
   lists and links with comfortable spacing and no decorative frames. Row level
   security already hides disabled and advisor-only blocks, so whatever arrives
   here is meant for the student, in the order the administrator arranged.

   Every shape read here comes from lib/journeyBlocks, the same module the
   editor writes with, so what an administrator saves is what a student sees. */

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lrn-acc${open ? " open" : ""}`}>
      <button type="button" className="lrn-acc-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <ChevronDown size={16} />
      </button>
      {open && <div className="lrn-acc-body">{body}</div>}
    </div>
  );
}

/** Attachments live in R2; the link is signed on demand and never stored. */
function Attachment({ path, fileName, description, title }: { path: string; fileName: string; description: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const go = async (download: boolean) => {
    setBusy(true);
    const url = await fileUrl(path, download ? fileName : undefined);
    setBusy(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="lrn-file">
      <span className="lrn-file-ico"><Paperclip size={15} /></span>
      <span className="lrn-file-main">
        <span className="lrn-file-name">{title || fileName || "Attachment"}</span>
        {description && <span className="lrn-file-desc">{description}</span>}
      </span>
      <button type="button" className="lrn-link" disabled={busy} onClick={() => go(false)}>View</button>
      <button type="button" className="lrn-link" disabled={busy} onClick={() => go(true)}>
        <Download size={13} />Download
      </button>
    </div>
  );
}

/** One content block, rendered as plain documentation. */
export function JourneyBlock({ block, study }: { block: DbBlock; study?: StudyApp | null }) {
  const kind = blockKindOf(block.kind);
  const title = (block.title ?? "").trim();

  if (kind === "program") {
    return (
      <>
        {title && <h4 className="lrn-sub">{title}</h4>}
        <ProgramBlock field={programField(block)} study={study ?? null} />
      </>
    );
  }

  if (CALLOUT_KINDS.has(kind)) {
    /* Callouts are a coloured label and the detail itself, which may be a
       sentence or a short list — the Excel writes tips and requirements both
       ways ("Tips & Advice" is four bullets, a warning is one paragraph).
       `important` is the red card the Excel asks to be unmissable, so it is the
       one callout drawn as a filled card rather than a rule in the margin. */
    const entries = listItemsForDisplay(block);
    return (
      <div className={`lrn-note lrn-note-${kind}`}>
        {kind === "important" && <TriangleAlert size={16} className="lrn-note-ico" aria-hidden />}
        <div className="lrn-note-main">
          {title && <span className="lrn-note-title">{title}</span>}
          {block.body && <p>{block.body}</p>}
          {entries.length > 0 && <ul className="lrn-ul">{entries.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        </div>
      </div>
    );
  }

  switch (kind) {
    /* A Learn module: a title, one line saying what it teaches, then Markdown.
       Videos inside the Markdown are lifted out and given the design system's
       own player, so no third-party frame loads until a student asks for it. */
    case "module": {
      const summary = moduleSummary(block);
      return (
        <section className="lrn-module">
          {title && <h3 className="lrn-module-title">{title}</h3>}
          {summary && <p className="lrn-module-sum">{summary}</p>}
          <div className="lrn-md">
            {markdownSegments(block.body ?? "").map((seg, i) => (
              seg.kind === "video"
                ? <HeroVideoDialog key={i} url={seg.url} title={seg.title} />
                : <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
            ))}
          </div>
        </section>
      );
    }

    /* "Display an Important Preparation Banner above the Learn section … Keep
       the banner visible until the student marks the step as completed." The
       step decides whether to render it at all; this only draws it. */
    case "banner": {
      const entries = listItemsForDisplay(block);
      return (
        <div className="lrn-banner">
          <div className="lrn-banner-head">
            <TriangleAlert size={17} aria-hidden />
            <span>{title || "Before you travel"}</span>
          </div>
          {block.body && <p className="lrn-banner-text">{block.body}</p>}
          {entries.length > 0 && (
            <ul className="lrn-banner-list">
              {entries.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </div>
      );
    }

    /* "Display a blue Application Under Review status card at the top of the
       page with an animated loading indicator." */
    case "review_status":
      return (
        <div className="lrn-review">
          <Loader size={26} />
          <div className="lrn-review-main">
            <span className="lrn-review-title">{title || "Application Under Review"}</span>
            <span className="lrn-review-text">
              {block.body || "The Lithuanian Migration Department is reviewing your documents, biometric information and interview."}
            </span>
          </div>
        </div>
      );

    /* "Add an optional Example section … can include text, images, files,
       videos, or external links." One card, composed from the pieces that are
       filled in, so an administrator can use as much or as little as they want. */
    case "example": {
      const image = imageData(block);
      const link = linkData(block);
      const file = attachmentData(block);
      const video = String((block.data as { videoUrl?: string })?.videoUrl ?? "");
      return (
        <div className="lrn-example">
          <span className="lrn-example-tag">{title || "Example"}</span>
          {block.body && <div className="lrn-p" dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body) }} />}
          {image.url && (
            /* Administrator-supplied URL: the host is unknown, so no next/image. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.alt || "Example"} loading="lazy" className="lrn-example-img" />
          )}
          {embedUrl(video) && <HeroVideoDialog url={video} title="Example" />}
          {link.url && (
            <a className="lrn-link" href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label || "Open the example"}<ExternalLink size={13} />
            </a>
          )}
          {file.path && <Attachment path={file.path} fileName={file.fileName} description={file.description} title="Example file" />}
        </div>
      );
    }

    case "heading":
      return <h3 className="lrn-h">{title || block.body}</h3>;

    case "list":
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <ul className="lrn-ul">{listItemsForDisplay(block).map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      );

    case "numbered":
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <ol className="lrn-ol">{listItemsForDisplay(block).map((t, i) => <li key={i}>{t}</li>)}</ol>
        </>
      );

    case "checklist":
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <ul className="lrn-check">
            {checklistForDisplay(block).map((item, i) => (
              <li key={i}>
                {/* Reading aid only: progress is tracked by the step itself. */}
                <input type="checkbox" defaultChecked={item.checked} aria-label={item.text} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      );

    case "accordion":
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          {accordionForDisplay(block).map((item, i) => <Accordion key={i} title={item.title} body={item.body} />)}
        </>
      );

    case "table": {
      const { columns, rows } = tableData(block);
      if (!columns.length) return null;
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <div className="lrn-tablewrap">
            <table className="lrn-table">
              <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </>
      );
    }

    case "image": {
      const { url, alt, caption } = imageData(block);
      if (!url) return null;
      return (
        <figure className="lrn-fig">
          {/* Administrator-supplied URL: the host is unknown, so no next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt || title || "Illustration"} loading="lazy" />
          {(caption || title) && <figcaption>{caption || title}</figcaption>}
        </figure>
      );
    }

    case "video": {
      const raw = String((block.data as { url?: string })?.url ?? "");
      // The dialog does its own parsing; embedUrl only tells us it is playable.
      if (!embedUrl(raw)) return null;
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <HeroVideoDialog url={raw} title={title || undefined} />
        </>
      );
    }

    case "link": {
      const { url, label, newTab, internal } = linkData(block);
      if (!url) return null;
      return (
        <p className="lrn-linkrow">
          <span className="lrn-linklabel">{label || title || "Link"}</span>
          <a
            className="lrn-link" href={url}
            target={newTab && !internal ? "_blank" : undefined}
            rel={newTab && !internal ? "noopener noreferrer" : undefined}
          >
            {url}
            {newTab && !internal && <ExternalLink size={13} />}
          </a>
        </p>
      );
    }

    case "attachment": {
      const { path, fileName, description } = attachmentData(block);
      if (!path) return null;
      return <Attachment path={path} fileName={fileName} description={description} title={title} />;
    }

    default:
      // Paragraph: a small allow-listed subset of HTML from the mini editor.
      return (
        <>
          {title && <h4 className="lrn-sub">{title}</h4>}
          <div className="lrn-p" dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body ?? "") }} />
        </>
      );
  }
}

export function StepBlocks({ stepId, fallback, plan, study, hideBanner }: {
  stepId: string;
  fallback: string;
  /** Blocks may target one service plan; the student only sees their own. */
  plan?: string | null;
  study?: StudyApp | null;
  /** The preparation banner stays up only until the step is completed. */
  hideBanner?: boolean;
}) {
  const [blocks, setBlocks] = useState<DbBlock[]>([]);
  const [reminders, setReminders] = useState<DbReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [b, r] = await Promise.all([fetchBlocks(stepId), fetchReminders([stepId])]);
    setBlocks(b);
    setReminders(r);
    setLoading(false);
  }, [stepId]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLoading(true); void load(); }, [load]);
  /* An administrator editing this step updates the open page immediately. */
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  if (loading) return <Loader block />;

  // Empty blocks would render as a blank gap; plan-specific ones belong to the
  // other plan and must not leak across.
  const visible = blocks.filter((b) => {
    const only = blockPlan(b);
    if (only && plan && only !== plan) return false;
    if (hideBanner && blockKindOf(b.kind) === "banner") return false;
    return !isEmptyBlock(b);
  });

  return (
    <div className="lrn">
      {visible.length === 0
        ? <p className="lrn-p">{fallback}</p>
        : visible.map((b) => <div key={b.id} className="lrn-blk"><JourneyBlock block={b} study={study} /></div>)}

      {reminders.map((r) => (
        <p key={r.id} className="lrn-reminder">
          <Bell size={13} />
          <span>
            <b>{r.title}</b>
            {r.due_at && <> · due {new Date(r.due_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</>}
            {r.message && <> — {r.message}</>}
          </span>
        </p>
      ))}
    </div>
  );
}

export default StepBlocks;
