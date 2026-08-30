"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, Bold, Italic, Link2, List, ListOrdered, Plus, Trash2, Underline,
} from "lucide-react";
import { Button, Checkbox, Input, Label, ListBox, Select, TextArea, TextField, Tooltip } from "@heroui/react";
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
    <span style={{ display: "inline-flex", gap: 4, flex: "none" }}>
      <Tooltip><Tooltip.Trigger><Button aria-label="Move up" isDisabled={i === 0} isIconOnly onPress={() => onMove(-1)} size="sm" variant="tertiary"><ArrowUp size={13} /></Button></Tooltip.Trigger><Tooltip.Content>Move up</Tooltip.Content></Tooltip>
      <Tooltip><Tooltip.Trigger><Button aria-label="Move down" isDisabled={i === count - 1} isIconOnly onPress={() => onMove(1)} size="sm" variant="tertiary"><ArrowDown size={13} /></Button></Tooltip.Trigger><Tooltip.Content>Move down</Tooltip.Content></Tooltip>
      <Tooltip><Tooltip.Trigger><Button aria-label="Remove" isIconOnly onPress={onRemove} size="sm" variant="danger-soft"><Trash2 size={13} /></Button></Tooltip.Trigger><Tooltip.Content>Remove</Tooltip.Content></Tooltip>
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
    <TextField fullWidth>
      <Label>{label}</Label>
      {children}
    </TextField>
  );
}

/** A HeroUI Select built from a plain value/label list — every editor below
 *  picks from a short fixed set, so this is the one place that shape is
 *  assembled rather than repeated per field. */
function PickSelect({ value, onChange, options, ariaLabel }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; ariaLabel?: string;
}) {
  return (
    <Select onSelectionChange={(k) => onChange(String(k))} selectedKey={value}>
      {ariaLabel ? <Label className="sr-only">{ariaLabel}</Label> : null}
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/* ── Rich text (paragraph) ────────────────────────────────────────────────── */

/**
 * A small formatting toolbar over a contentEditable region. The stored value is
 * an allow-listed subset of HTML, sanitized on the way in and again on render.
 * No HeroUI equivalent exists for this interaction, so the editable surface
 * stays a plain contentEditable div — only its toolbar buttons are HeroUI.
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
        <Tooltip><Tooltip.Trigger><Button aria-label="Bold" isIconOnly onPress={() => cmd("bold")} size="sm" variant="tertiary"><Bold size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Bold</Tooltip.Content></Tooltip>
        <Tooltip><Tooltip.Trigger><Button aria-label="Italic" isIconOnly onPress={() => cmd("italic")} size="sm" variant="tertiary"><Italic size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Italic</Tooltip.Content></Tooltip>
        <Tooltip><Tooltip.Trigger><Button aria-label="Underline" isIconOnly onPress={() => cmd("underline")} size="sm" variant="tertiary"><Underline size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Underline</Tooltip.Content></Tooltip>
        <Tooltip><Tooltip.Trigger><Button aria-label="Bullet list" isIconOnly onPress={() => cmd("insertUnorderedList")} size="sm" variant="tertiary"><List size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Bullet list</Tooltip.Content></Tooltip>
        <Tooltip><Tooltip.Trigger><Button aria-label="Numbered list" isIconOnly onPress={() => cmd("insertOrderedList")} size="sm" variant="tertiary"><ListOrdered size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Numbered list</Tooltip.Content></Tooltip>
        <Tooltip><Tooltip.Trigger><Button aria-label="Add link" isIconOnly onPress={addLink} size="sm" variant="tertiary"><Link2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Add link</Tooltip.Content></Tooltip>
      </div>
      <div
        aria-label="Paragraph content" aria-multiline="true" className="be-richarea" contentEditable
        dangerouslySetInnerHTML={{ __html: initial }} onBlur={flush} ref={ref} role="textbox" suppressContentEditableWarning
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
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span aria-hidden style={{ flex: "none", color: "#8695AB" }}>{ordered ? `${i + 1}.` : "•"}</span>
          <TextField fullWidth onChange={(v) => write(items.map((x, n) => (n === i ? v : x)))} value={item}>
            <Input placeholder="List item" variant="secondary" />
          </TextField>
          <RowTools count={items.length} i={i} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
        </div>
      ))}
      <Button onPress={() => write([...items, ""])} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary"><Plus size={14} /> Add item</Button>
    </>
  );
}

function ChecklistEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const items = checklistItems(block);
  const write = (next: ChecklistItem[]) => patch({ data: { ...block.data, entries: next } });
  return (
    <>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Checkbox aria-label="Checked by default" isSelected={item.checked} onChange={(v) => write(items.map((x, n) => (n === i ? { ...x, checked: v } : x)))}>
            <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content>
          </Checkbox>
          <TextField fullWidth onChange={(v) => write(items.map((x, n) => (n === i ? { ...x, text: v } : x)))} value={item.text}>
            <Input placeholder="Task" variant="secondary" />
          </TextField>
          <RowTools count={items.length} i={i} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
        </div>
      ))}
      <Button onPress={() => write([...items, { text: "", checked: false }])} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary"><Plus size={14} /> Add task</Button>
      <p className="afq-mini-sub">The tick marks the state a student sees first; their progress is tracked by the step itself.</p>
    </>
  );
}

function AccordionEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const items = accordionItems(block);
  const write = (next: AccordionItem[]) => patch({ data: { ...block.data, entries: next } });
  return (
    <>
      {items.map((item, i) => (
        <div className="afq-mini-card" key={i}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TextField fullWidth onChange={(v) => write(items.map((x, n) => (n === i ? { ...x, title: v } : x)))} value={item.title}>
              <Input placeholder="Accordion title" variant="secondary" />
            </TextField>
            <RowTools count={items.length} i={i} onMove={(by) => write(moved(items, i, by))} onRemove={() => write(items.filter((_, n) => n !== i))} />
          </div>
          <TextField fullWidth onChange={(v) => write(items.map((x, n) => (n === i ? { ...x, body: v } : x)))} value={item.body}>
            <TextArea placeholder="Accordion content" rows={3} variant="secondary" />
          </TextField>
        </div>
      ))}
      <Button onPress={() => write([...items, { title: "", body: "" }])} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary"><Plus size={14} /> Add another accordion</Button>
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
                <TextField fullWidth onChange={(v) => write(columns.map((x, n) => (n === i ? v : x)), rows)} value={c}>
                  <Input placeholder={`Column ${i + 1}`} variant="secondary" />
                </TextField>
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button aria-label="Delete column" isDisabled={columns.length <= 1} isIconOnly onPress={() => removeColumn(i)} size="sm" variant="danger-soft">
                      <Trash2 size={13} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Delete column</Tooltip.Content>
                </Tooltip>
              </th>
            ))}
            <th className="be-th-add">
              <Button onPress={addColumn} size="sm" variant="tertiary"><Plus size={13} /> Column</Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {columns.map((_, c) => (
                <td key={c}>
                  <TextField fullWidth onChange={(v) => write(columns, rows.map((rr, n) => (n === r ? rr.map((cc, m) => (m === c ? v : cc)) : rr)))} value={row[c] ?? ""}>
                    <Input placeholder="—" variant="secondary" />
                  </TextField>
                </td>
              ))}
              <td className="be-td-tools">
                <RowTools
                  count={rows.length} i={r}
                  onMove={(by) => write(columns, moved(rows, r, by))}
                  onRemove={() => write(columns, rows.filter((_, n) => n !== r))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button onPress={addRow} size="sm" style={{ marginTop: 8 }} variant="tertiary"><Plus size={14} /> Add row</Button>
    </div>
  );
}

function LinkEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  const link = linkData(block);
  const write = (next: Partial<typeof link>) => patch({ data: { ...block.data, ...link, ...next } });
  return (
    <>
      <Labelled label="Title"><Input onChange={(e) => write({ label: e.target.value })} placeholder="Official website" value={link.label} variant="secondary" /></Labelled>
      <Labelled label="URL"><Input onChange={(e) => write({ url: e.target.value })} placeholder="https://migracija.lt" value={link.url} variant="secondary" /></Labelled>
      <div className="afq-form-row">
        <TextField fullWidth>
          <Label>Destination</Label>
          <PickSelect
            onChange={(v) => write({ internal: v === "internal" })}
            options={[{ value: "external", label: "External website" }, { value: "internal", label: "Inside the application" }]}
            value={link.internal ? "internal" : "external"}
          />
        </TextField>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>Behaviour</Label>
          <Checkbox isDisabled={link.internal} isSelected={link.newTab && !link.internal} onChange={(v) => write({ newTab: v })}>
            <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Open in a new browser tab</Checkbox.Content>
          </Checkbox>
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
      <TextField fullWidth onChange={(v) => write({ url: v })} value={img.url}>
        <Label>Image address</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="https:// or upload a file" variant="secondary" />
          <Button isDisabled={uploading} onPress={onPickFile} size="sm" variant="secondary">{uploading ? "Uploading…" : "Upload"}</Button>
        </div>
      </TextField>
      <Labelled label="Alt text"><Input onChange={(e) => write({ alt: e.target.value })} placeholder="What the image shows, for screen readers" value={img.alt} variant="secondary" /></Labelled>
      <Labelled label="Caption"><Input onChange={(e) => write({ caption: e.target.value })} placeholder="Shown under the image" value={img.caption} variant="secondary" /></Labelled>
      {img.url && (
        <div className="be-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={img.alt || "Preview"} src={img.url} />
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
        <Input onChange={(e) => patch({ data: { ...block.data, url: e.target.value } })} placeholder="https://youtube.com/watch?v=… or a Vimeo link" value={url} variant="secondary" />
      </Labelled>
      {url && !embed && <p className="afq-form-err">This link is not a recognised YouTube or Vimeo video, so students will not see a player.</p>}
      {embed && (
        <div className="be-preview be-preview-video">
          <iframe allowFullScreen src={embed} title="Video preview" />
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
      <Labelled label="Title"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Application form" value={block.title ?? ""} variant="secondary" /></Labelled>
      <Labelled label="Description"><Input onChange={(e) => write({ description: e.target.value })} placeholder="What this file is for" value={file.description} variant="secondary" /></Labelled>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="afq-mini-sub" style={{ flex: 1 }}>{file.fileName || "No file attached yet"}</span>
        {file.path && <Button onPress={() => write({ path: "", fileName: "" })} size="sm" variant="tertiary">Remove</Button>}
        <Button isDisabled={uploading} onPress={onPickFile} size="sm" variant="secondary">
          {uploading ? "Uploading…" : file.path ? "Replace file" : "Upload file"}
        </Button>
      </div>
    </>
  );
}

/* ── Dispatcher ───────────────────────────────────────────────────────────── */

/**
 * Which service plan sees a block.
 *
 * Available on EVERY kind, not just programme details. The Excel replaces the
 * Learn text of many steps for Full Service ("replace the default Learn Section
 * with a message informing the student that our team will…"), and the importer
 * writes that as a plan tag on the paragraph. Without this control an
 * administrator could see a block in the list, edit it, and never understand why
 * only half of their students ever saw it.
 */
export function PlanPicker({ block, patch }: { block: DbBlock; patch: Patch }) {
  return (
    <Labelled label="Show to">
      <PickSelect
        onChange={(v) => {
          const data = { ...(block.data ?? {}) } as Record<string, unknown>;
          if (v) data.plan = v; else delete data.plan;
          patch({ data });
        }}
        options={[
          { value: "", label: "Every student" },
          { value: "self_service", label: "Self Service only" },
          { value: "full_service", label: "Full Service only" },
        ]}
        value={String((block.data as { plan?: string })?.plan ?? "")}
      />
    </Labelled>
  );
}

/** "Display an Important Preparation Banner above the Learn section." */
function BannerEditor({ block, patch }: { block: DbBlock; patch: Patch }) {
  return (
    <>
      <Labelled label="Banner heading">
        <Input onChange={(e) => patch({ title: e.target.value })} placeholder="🔴 Before You Travel" value={block.title ?? ""} variant="secondary" />
      </Labelled>
      <Labelled label="Intro (optional)">
        <TextArea onChange={(e) => patch({ body: e.target.value })} placeholder="One sentence above the list" rows={2} value={block.body ?? ""} variant="secondary" />
      </Labelled>
      <TextListEditor block={block} ordered={false} patch={patch} />
      <p className="afq-mini-sub">Shown above everything else in the step, and hidden once the student completes it.</p>
    </>
  );
}

export function BlockEditor({ kind, block, patch, onPickFile, uploading }: {
  kind: BlockKind;
  block: DbBlock;
  patch: Patch;
  onPickFile: () => void;
  uploading: boolean;
}) {
  switch (kind) {
    /* A Learn module is edited as Markdown, on purpose: the brief asks that a
       future update require "only Markdown editing". One field holds the whole
       module, so rewriting it is a paste rather than a tour of twelve blocks. */
    case "module":
      return (
        <>
          <Labelled label="Module title">
            <Input onChange={(e) => patch({ title: e.target.value })} placeholder="Avoiding Rental Scams" value={block.title ?? ""} variant="secondary" />
          </Labelled>
          <Labelled label="Short description">
            <Input
              onChange={(e) => patch({ data: { ...block.data, summary: e.target.value } })}
              placeholder="One line explaining what the student will learn."
              value={String((block.data as { summary?: string })?.summary ?? "")} variant="secondary"
            />
          </Labelled>
          <Labelled label="Content (Markdown)">
            <TextArea
              className="be-md" onChange={(e) => patch({ body: e.target.value })} rows={18}
              placeholder={"## Heading\n\nText.\n\n- Bullet\n- Bullet\n\n> [!WARNING] Something to avoid.\n\n### Checklist\n- [ ] First task"}
              value={block.body ?? ""} variant="secondary"
            />
          </Labelled>
          <p className="afq-mini-sub">
            Headings, lists, tables, links, images, <b>bold</b>, code and checklists (<code>- [ ] task</code>).
            Callouts: <code>&gt; [!TIP]</code>, <code>[!WARNING]</code>, <code>[!IMPORTANT]</code>, <code>[!MISTAKE]</code>, <code>[!NOTE]</code>.
            A YouTube or Vimeo address alone on its own line becomes a video player.
          </p>
        </>
      );

    case "banner":
      return <BannerEditor block={block} patch={patch} />;

    case "review_status":
      return (
        <>
          <Labelled label="Heading">
            <Input onChange={(e) => patch({ title: e.target.value })} placeholder="Application Under Review" value={block.title ?? ""} variant="secondary" />
          </Labelled>
          <Labelled label="Message (optional)">
            <TextArea onChange={(e) => patch({ body: e.target.value })} placeholder="Leave empty to use the default wording" rows={2} value={block.body ?? ""} variant="secondary" />
          </Labelled>
          <p className="afq-mini-sub">A blue status card with a loading indicator, for a step the student is waiting on.</p>
        </>
      );

    /* "Add an optional Example section that the admin can enable, edit, or hide
       for each step. The Example section can include text, images, files,
       videos, or external links." Every field is optional; whatever is filled in
       is what the student sees. */
    case "example":
      return (
        <>
          <Labelled label="Label"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Example" value={block.title ?? ""} variant="secondary" /></Labelled>
          <Labelled label="Text"><RichText onChange={(html) => patch({ body: html })} value={block.body ?? ""} /></Labelled>
          <Labelled label="Image URL (optional)">
            <Input
              onChange={(e) => patch({ data: { ...block.data, url: e.target.value } })} placeholder="https://…"
              value={String((block.data as { url?: string })?.url ?? "")} variant="secondary"
            />
          </Labelled>
          <Labelled label="Video URL (optional)">
            <Input
              onChange={(e) => patch({ data: { ...block.data, videoUrl: e.target.value } })} placeholder="YouTube or Vimeo link"
              value={String((block.data as { videoUrl?: string })?.videoUrl ?? "")} variant="secondary"
            />
          </Labelled>
          <Labelled label="External link (optional)">
            <Input
              onChange={(e) => patch({ data: { ...block.data, linkUrl: e.target.value } })} placeholder="https://…"
              value={String((block.data as { linkUrl?: string })?.linkUrl ?? "")} variant="secondary"
            />
          </Labelled>
          <AttachmentEditor block={block} onPickFile={onPickFile} patch={patch} uploading={uploading} />
          <p className="afq-mini-sub">Switch the block off with the toggle above to hide the Example without deleting it.</p>
        </>
      );
  }

  switch (kind) {
    case "heading":
      return <Labelled label="Heading text"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="How to complete this step" value={block.title ?? ""} variant="secondary" /></Labelled>;
    case "paragraph":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Leave empty for plain text" value={block.title ?? ""} variant="secondary" /></Labelled>
          <Labelled label="Text"><RichText onChange={(html) => patch({ body: html })} value={block.body ?? ""} /></Labelled>
        </>
      );
    case "list":
    case "numbered":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Leave empty for just the list" value={block.title ?? ""} variant="secondary" /></Labelled>
          <TextListEditor block={block} ordered={kind === "numbered"} patch={patch} />
        </>
      );
    case "checklist":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="What to prepare" value={block.title ?? ""} variant="secondary" /></Labelled>
          <ChecklistEditor block={block} patch={patch} />
        </>
      );
    case "accordion":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Common questions" value={block.title ?? ""} variant="secondary" /></Labelled>
          <AccordionEditor block={block} patch={patch} />
        </>
      );
    case "table":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Costs" value={block.title ?? ""} variant="secondary" /></Labelled>
          <TableEditor block={block} patch={patch} />
        </>
      );
    case "image":
      return <ImageEditor block={block} onPickFile={onPickFile} patch={patch} uploading={uploading} />;
    case "video":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Tutorial video" value={block.title ?? ""} variant="secondary" /></Labelled>
          <VideoEditor block={block} patch={patch} />
        </>
      );
    case "link":
      return <LinkEditor block={block} patch={patch} />;
    case "attachment":
      return <AttachmentEditor block={block} onPickFile={onPickFile} patch={patch} uploading={uploading} />;
    case "program":
      return (
        <>
          <Labelled label="Title (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Leave empty for just the detail" value={block.title ?? ""} variant="secondary" /></Labelled>
          <Labelled label="Which programme detail">
            <PickSelect
              onChange={(v) => patch({ data: { ...block.data, field: v } })}
              options={[
                { value: "url", label: "Programme page link" },
                { value: "apply", label: "Apply now link" },
                { value: "english", label: "Accepted English certificates" },
                { value: "app_fee", label: "Application fee" },
                { value: "tuition", label: "Tuition fee" },
              ]}
              value={String((block.data as { field?: string })?.field ?? "url")}
            />
          </Labelled>
          <p className="afq-mini-sub">Resolved from each student&rsquo;s own programme, so this stays correct without editing.</p>
        </>
      );

    default:
      /* Callouts: a short label, one sentence, and optionally a few bullets —
         the Excel writes a "Tips & Advice" card as four bullet points and a
         warning as one paragraph, and both are the same block. */
      return (
        <>
          <Labelled label="Label (optional)"><Input onChange={(e) => patch({ title: e.target.value })} placeholder="Leave empty to use the default" value={block.title ?? ""} variant="secondary" /></Labelled>
          <Labelled label="Message"><TextArea onChange={(e) => patch({ body: e.target.value })} placeholder="One clear sentence" rows={2} value={block.body ?? ""} variant="secondary" /></Labelled>
          <TextListEditor block={block} ordered={false} patch={patch} />
        </>
      );
  }
}

export default BlockEditor;
