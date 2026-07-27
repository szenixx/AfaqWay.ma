"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronDown, Download, ExternalLink, Paperclip } from "lucide-react";
import { Loader, HeroVideoDialog } from "@/components/ds";
import { fileUrl } from "@/lib/storage/client";
import { fetchBlocks, fetchReminders, subscribeJourney, type DbBlock, type DbReminder } from "@/lib/journeyDb";
import {
  accordionForDisplay, attachmentData, blockKindOf, blockPlan, checklistForDisplay,
  embedUrl, imageData, isEmptyBlock, linkData, listItemsForDisplay, programField,
  sanitizeRichText, tableData, CALLOUT_KINDS,
} from "@/lib/journeyBlocks";
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
    const url = await fileUrl(path, "documents", download ? fileName : undefined);
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
    // Callouts stay text: a small coloured label and the sentence itself.
    return (
      <div className={`lrn-note lrn-note-${kind}`}>
        {title && <span className="lrn-note-title">{title}</span>}
        <p>{block.body}</p>
      </div>
    );
  }

  switch (kind) {
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

export function StepBlocks({ stepId, fallback, plan, study }: {
  stepId: string;
  fallback: string;
  /** Blocks may target one service plan; the student only sees their own. */
  plan?: string | null;
  study?: StudyApp | null;
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
