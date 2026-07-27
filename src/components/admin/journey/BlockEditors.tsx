"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, Bold, Italic, Link2, List, ListOrdered, Plus, Trash2, Underline,
} from "lucide-react";
import { Input, TextArea, Checkbox, Select } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import {
  accordionItems, attachmentData, checklistItems, embedUrl, imageData, linkData,
  listItems, sanitizeRichText, tableData,
  type AccordionItem, type BlockKind, type ChecklistItem,
} from "@/lib/journeyBlocks";
import type { DbBlock } from "@/lib/journeyDb";

/* One editor per content type.

   A single generic form was the reason content went missing: an administrator
   filled in a box that the renderer never read, the block saved, and the
   student saw nothing. Each kind now edits exactly the shape it renders. */

export type Patch = (patch: Partial<DbBlock>) => void;

/* ── Small shared pieces ──────────────────────────────────────────────────── */

function RowTools({ i, count, onMove, onRemove }: {
  i: number; count: number; onMove: (by: number) => void; onRemove: () => void;
}) {
  return (
    <span className="be-tools">
      <button type="button" className="chat-act" title="Move up" onClick={() => onMove(-1)} disabled={i === 0}><ArrowUp size={13} /></button>
      <button type="button" className="chat-act" title="Move down" onClick={() => onMove(1)} disabled={i === count - 1}><ArrowDown size={13} /></button>
      <button type="button" className="chat-act" title="Remove" onClick={onRemove} style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
    </span>
  );
}

/** Moves an item inside an array, returning a new array. */
function moved<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="be-field">
      <span className="af-label">{label}</span>
      {children}
    </div>
  );
}

/* ── Rich text (paragraph) ────────────────────────────────────────────────── */

/**
 * A small formatting toolbar over a contentEditable region. The stored value is
 * an allow-listed subset of HTML, sanitized on the way in and again on render.
 */
function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled on purpose: rewriting innerHTML on every keystroke moves the caret.
  const [initial] = useState(() => sanitizeRichText(value || ""));

  const flush = () => onChange(sanitizeRichText(ref.current?.innerHTML ?? ""));

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    flush();
  };

  const addLink = () => {
    const url = window.prompt("Link address (https://…)");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) { window.alert("Links must start with http:// or https://"); return; }
    cmd("createLink", url);
  };

  return (
    <div className="be-rich">
      <div className="be-richbar">
        <button type="button" className="chat-act" title="Bold" onClick={() => cmd("bold")}><Bold size={14} /></button>
        <button type="button" className="chat-act" title="Italic" onClick={() => cmd("italic")}><Italic size={14} /></button>
        <button type="button" className="chat-act" title="Underline" onClick={() => cmd("underline")}><Underline size={14} /></button>
        <button type="button" className="chat-act" title="Bullet list" onClick={() => cmd("insertUnorderedList")}><List size={14} /></button>
        <button type="button" className="chat-act" title="Numbered list" onClick={() => cmd("insertOrderedList")}><ListOrdered size={14} /></button>
        <button type="button" className="chat-act" title="Add link" onClick={addLink}><Link2 size={14} /></button>
      </div>
      <div
        ref={ref} className="be-richarea" contentEditable role="textbox" aria-multiline="true"
        aria-label="Paragraph content" suppressContentEditableWarning
        onBlur={flush} dangerouslySetInnerHTML={{ __html: initial }}
      />
    </div>
  );
}

/* ── The editors ──────────────────────────────────────────────────────────── */

function TextListEditor({ block, patch, ordered }: { block: DbBlock; patch: Patch; ordered: boolean }) {
  const items = listItems(block);
  const write = (next: string[]) => patch({ data: { ...block.data, entries: next } });
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="be-row">
          <span className="be-marker">{ordered ? `${i + 1}.` : "•"}</span>
          <Input
            value={item} placeholder="List item" containerStyle={{ flex: 1 }}
            onChange={(e) => write(items.map((v, n) => (n === i ? e.target.value : v)))}
          />
          <RowTools i={i} count={items.length} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
        </div>
      ))}
      <JrButton icon={<Plus size={14} />} onClick={() => write([...items, ""])}>Add item</JrButton>
    </>
  );
}

function ChecklistEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const items = checklistItems(block);
  const write = (next: ChecklistItem[]) => patch({ data: { ...block.data, entries: next } });
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="be-row">
          <Checkbox
            checked={item.checked} ariaLabel="Checked by default"
            onChange={(v) => write(items.map((x, n) => (n === i ? { ...x, checked: v } : x)))}
          />
          <Input
            value={item.text} placeholder="Task" containerStyle={{ flex: 1 }}
            onChange={(e) => write(items.map((x, n) => (n === i ? { ...x, text: e.target.value } : x)))}
          />
          <RowTools i={i} count={items.length} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
        </div>
      ))}
      <JrButton icon={<Plus size={14} />} onClick={() => write([...items, { text: "", checked: false }])}>Add task</JrButton>
      <p className="be-hint">The tick marks the state a student sees first; their progress is tracked by the step itself.</p>
    </>
  );
}

function AccordionEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const items = accordionItems(block);
  const write = (next: AccordionItem[]) => patch({ data: { ...block.data, entries: next } });
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="be-card">
          <div className="be-row">
            <Input
              value={item.title} placeholder="Accordion title" containerStyle={{ flex: 1 }}
              onChange={(e) => write(items.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)))}
            />
            <RowTools i={i} count={items.length} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
          </div>
          <TextArea
            rows={3} value={item.body} placeholder="Accordion content"
            onChange={(e) => write(items.map((x, n) => (n === i ? { ...x, body: e.target.value } : x)))}
          />
        </div>
      ))}
      <JrButton icon={<Plus size={14} />} onClick={() => write([...items, { title: "", body: "" }])}>Add another accordion</JrButton>
    </>
  );
}

function TableEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const { columns, rows } = tableData(block);
  const write = (cols: string[], body: string[][]) => patch({ data: { ...block.data, columns: cols, rows: body } });

  const addColumn = () => write([...columns, `Column ${columns.length + 1}`], rows.map((r) => [...r, ""]));
  const removeColumn = (c: number) =>
    write(columns.filter((_, i) => i !== c), rows.map((r) => r.filter((_, i) => i !== c)));
  const addRow = () => write(columns, [...rows, columns.map(() => "")]);

  return (
    <div className="be-tablewrap">
      <table className="be-table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>
                <Input
                  value={c} placeholder={`Column ${i + 1}`}
                  onChange={(e) => write(columns.map((v, n) => (n === i ? e.target.value : v)), rows)}
                />
                <button type="button" className="chat-act" title="Delete column" onClick={() => removeColumn(i)} disabled={columns.length <= 1}>
                  <Trash2 size={13} />
                </button>
              </th>
            ))}
            <th className="be-th-add">
              <JrButton icon={<Plus size={13} />} onClick={addColumn}>Column</JrButton>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {columns.map((_, c) => (
                <td key={c}>
                  <Input
                    value={row[c] ?? ""} placeholder="—"
                    onChange={(e) => write(columns, rows.map((rr, n) => (n === r ? rr.map((cc, m) => (m === c ? e.target.value : cc)) : rr)))}
                  />
                </td>
              ))}
              <td className="be-td-tools">
                <RowTools
                  i={r} count={rows.length}
                  onMove={(by) => write(columns, moved(rows, r, by))}
                  onRemove={() => write(columns, rows.filter((_, n) => n !== r))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <JrButton icon={<Plus size={14} />} onClick={addRow}>Add row</JrButton>
    </div>
  );
}

function LinkEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const link = linkData(block);
  const write = (next: Partial<typeof link>) => patch({ data: { ...block.data, ...link, ...next } });
  return (
    <>
      <Labelled label="Title"><Input value={link.label} placeholder="Official website" onChange={(e) => write({ label: e.target.value })} /></Labelled>
      <Labelled label="URL"><Input value={link.url} placeholder="https://migracija.lt" onChange={(e) => write({ url: e.target.value })} /></Labelled>
      <div className="sch-row2">
        <Select
          label="Destination" value={link.internal ? "internal" : "external"}
          onChange={(v) => write({ internal: v === "internal" })}
          options={[{ value: "external", label: "External website" }, { value: "internal", label: "Inside the application" }]}
        />
        <div className="be-field">
          <span className="af-label">Behaviour</span>
          <Checkbox
            checked={link.newTab && !link.internal} disabled={link.internal}
            onChange={(v) => write({ newTab: v })} label="Open in a new browser tab"
          />
        </div>
      </div>
    </>
  );
}

function ImageEditor({ block, patch, onPickFile, uploading }: {
  block: DbBlock; patch: Patch; onPickFile: () => void; uploading: boolean;
}) {
  const img = imageData(block);
  const write = (next: Partial<typeof img>) => patch({ data: { ...block.data, ...img, ...next } });
  return (
    <>
      <Labelled label="Image address">
        <div className="be-row">
          <Input value={img.url} placeholder="https://… or upload a file" containerStyle={{ flex: 1 }} onChange={(e) => write({ url: e.target.value })} />
          <JrButton tone="outline" disabled={uploading} onClick={onPickFile}>{uploading ? "Uploading…" : "Upload"}</JrButton>
        </div>
      </Labelled>
      <Labelled label="Alt text"><Input value={img.alt} placeholder="What the image shows, for screen readers" onChange={(e) => write({ alt: e.target.value })} /></Labelled>
      <Labelled label="Caption"><Input value={img.caption} placeholder="Shown under the image" onChange={(e) => write({ caption: e.target.value })} /></Labelled>
      {img.url && (
        <div className="be-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt || "Preview"} />
        </div>
      )}
    </>
  );
}

function VideoEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const url = String((block.data as { url?: string })?.url ?? "");
  const embed = embedUrl(url);
  return (
    <>
      <Labelled label="Video URL">
        <Input value={url} placeholder="https://youtube.com/watch?v=… or a Vimeo link" onChange={(e) => patch({ data: { ...block.data, url: e.target.value } })} />
      </Labelled>
      {url && !embed && <p className="be-hint be-warn">This link is not a recognised YouTube or Vimeo video, so students will not see a player.</p>}
      {embed && (
        <div className="be-preview be-preview-video">
          <iframe src={embed} title="Video preview" allowFullScreen />
        </div>
      )}
    </>
  );
}

function AttachmentEditor({ block, patch, onPickFile, uploading }: {
  block: DbBlock; patch: Patch; onPickFile: () => void; uploading: boolean;
}) {
  const file = attachmentData(block);
  const write = (next: Partial<typeof file>) => patch({ data: { ...block.data, ...file, ...next } });
  return (
    <>
      <Labelled label="Title"><Input value={block.title ?? ""} placeholder="Application form" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
      <Labelled label="Description"><Input value={file.description} placeholder="What this file is for" onChange={(e) => write({ description: e.target.value })} /></Labelled>
      <div className="be-row">
        <span className="be-filename">{file.fileName || "No file attached yet"}</span>
        {file.path && <JrButton onClick={() => write({ path: "", fileName: "" })}>Remove</JrButton>}
        <JrButton tone="outline" disabled={uploading} onClick={onPickFile}>
          {uploading ? "Uploading…" : file.path ? "Replace file" : "Upload file"}
        </JrButton>
      </div>
    </>
  );
}

/* ── Dispatcher ───────────────────────────────────────────────────────────── */

export function BlockEditor({ kind, block, patch, onPickFile, uploading }: {
  kind: BlockKind;
  block: DbBlock;
  patch: Patch;
  onPickFile: () => void;
  uploading: boolean;
}) {
  switch (kind) {
    case "heading":
      return <Labelled label="Heading text"><Input value={block.title ?? ""} placeholder="How to complete this step" onChange={(e) => patch({ title: e.target.value })} /></Labelled>;
    case "paragraph":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Leave empty for plain text" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <Labelled label="Text"><RichText value={block.body ?? ""} onChange={(html) => patch({ body: html })} /></Labelled>
        </>
      );
    case "list":
    case "numbered":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Leave empty for just the list" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <TextListEditor block={block} patch={patch} ordered={kind === "numbered"} />
        </>
      );
    case "checklist":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="What to prepare" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <ChecklistEditor block={block} patch={patch} />
        </>
      );
    case "accordion":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Common questions" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <AccordionEditor block={block} patch={patch} />
        </>
      );
    case "table":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Costs" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <TableEditor block={block} patch={patch} />
        </>
      );
    case "image":
      return <ImageEditor block={block} patch={patch} onPickFile={onPickFile} uploading={uploading} />;
    case "video":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Tutorial video" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <VideoEditor block={block} patch={patch} />
        </>
      );
    case "link":
      return <LinkEditor block={block} patch={patch} />;
    case "attachment":
      return <AttachmentEditor block={block} patch={patch} onPickFile={onPickFile} uploading={uploading} />;
    case "program":
      return (
        <>
          <Labelled label="Title (optional)"><Input value={block.title ?? ""} placeholder="Leave empty for just the detail" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <Labelled label="Which programme detail">
            <Select
              value={String((block.data as { field?: string })?.field ?? "url")}
              onChange={(v) => patch({ data: { ...block.data, field: v } })}
              options={[
                { value: "url", label: "Programme page link" },
                { value: "english", label: "Accepted English certificates" },
                { value: "app_fee", label: "Application fee" },
                { value: "tuition", label: "Tuition fee" },
              ]}
            />
          </Labelled>
          <Labelled label="Show to">
            <Select
              value={String((block.data as { plan?: string })?.plan ?? "")}
              onChange={(v) => patch({ data: { ...block.data, plan: v } })}
              options={[
                { value: "", label: "Every student" },
                { value: "self_service", label: "Self Service only" },
                { value: "full_service", label: "Full Service only" },
              ]}
            />
          </Labelled>
          <p className="be-hint">Resolved from each student&rsquo;s own programme, so this stays correct without editing.</p>
        </>
      );

    default:
      // Callouts: a short label and one sentence.
      return (
        <>
          <Labelled label="Label (optional)"><Input value={block.title ?? ""} placeholder="Leave empty to use the default" onChange={(e) => patch({ title: e.target.value })} /></Labelled>
          <Labelled label="Message"><TextArea rows={2} value={block.body ?? ""} placeholder="One clear sentence" onChange={(e) => patch({ body: e.target.value })} /></Labelled>
        </>
      );
  }
}

export default BlockEditor;
