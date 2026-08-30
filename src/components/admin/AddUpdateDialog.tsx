"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, Trash2 } from "lucide-react";
import { Button, Input, Label, TextArea, TextField, Tooltip } from "@heroui/react";
import { BrandLogo } from "@/components/ds";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { uploadUserFile } from "@/lib/storage/client";
import { publishUpdate, type PlatformUpdate } from "@/lib/notifications";

/* Writing a platform announcement.

   Deliberately shaped like sending a message rather than filling in a form:
   the platform identity at the top, then what you want to say, then what you
   want to attach. Publishing writes one row; a database trigger turns it into
   a notification for every active student, and the email goes out alongside. */

type Attachment = PlatformUpdate["attachments"][number];

export function AddUpdateDialog({ onClose, onPublished }: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const pick = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (pick.current) pick.current.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const up = await uploadUserFile(file, { folder: "documents" });
      setFiles((list) => [...list, { path: up.path, fileName: up.fileName, mimeType: up.mimeType, size: up.size }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file could not be attached.");
    }
    setUploading(false);
  };

  const send = async () => {
    if (!title.trim()) { setError("Give the update a title."); return; }
    setBusy(true);
    setError("");
    const result = await publishUpdate({ title: title.trim(), body: body.trim(), attachments: files });
    setBusy(false);
    if (!result.ok) { setError(result.error ?? "The update could not be sent."); return; }

    onPublished();

    /* The announcement is stored and everyone has it in the platform. Email is
       separate, so its result is reported rather than hidden: closing on a
       silent partial failure is how nobody notices the mail stopped working. */
    if (result.emailFailed) {
      setSent(`Published. Emailed ${result.emailed}, failed ${result.emailFailed}.`);
      return;
    }
    onClose();
  };

  return (
    <AdminDialog
      description="Everyone on the platform receives this, in their notification centre and by email."
      footer={(
        <>
          <Button isDisabled={busy} onPress={onClose} size="sm" variant="tertiary">{sent ? "Close" : "Cancel"}</Button>
          <Button isDisabled={busy || !title.trim()} onPress={send} size="sm" variant="primary">
            <Send size={14} /> {busy ? "Sending…" : "Send Update"}
          </Button>
        </>
      )}
      icon={<Send className="size-5" />}
      onClose={onClose}
      size="lg"
      title="Add update"
    >
      <div className="afq-form">
        {/* Who it comes from, shown the way the student will see it. */}
        <div className="afq-mini-card" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <BrandLogo size={34} />
          <span style={{ display: "flex", flexDirection: "column" }}>
            <b className="afq-mini-title">AfaqWay</b>
            <span className="afq-mini-sub">AfaqWay Platform</span>
          </span>
        </div>

        <TextField fullWidth onChange={setTitle} value={title}>
          <Label>Title</Label>
          <Input placeholder="Scheduled maintenance on Sunday" variant="secondary" />
        </TextField>

        <TextField fullWidth onChange={setBody} value={body}>
          <Label>Message</Label>
          <TextArea placeholder="What is changing, when, and what students need to do." rows={6} variant="secondary" />
          <p className="afq-mini-sub">Write it as you would say it. Students read this in their own language level.</p>
        </TextField>

        <div className="afq-form">
          <Label>Attachments</Label>
          {files.length > 0 && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
              {files.map((f, i) => (
                <li key={f.path} className="afq-mini-card" style={{ flexDirection: "row", alignItems: "center", padding: "8px 10px" }}>
                  <Paperclip size={14} />
                  <span className="afq-mini-title" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Button aria-label={`Remove ${f.fileName}`} isIconOnly onPress={() => setFiles((list) => list.filter((_, n) => n !== i))} size="sm" variant="danger-soft">
                        <Trash2 size={13} />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Remove</Tooltip.Content>
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
          <Button isDisabled={uploading} onPress={() => pick.current?.click()} size="sm" style={{ alignSelf: "flex-start" }} variant="secondary">
            <Paperclip size={14} /> {uploading ? "Uploading…" : "Attach a file"}
          </Button>
          <input onChange={onFile} ref={pick} style={{ display: "none" }} type="file" />
        </div>

        {error && <p className="afq-form-err">{error}</p>}
        {sent && (
          <p className="afq-dialog-desc">
            <Send size={14} /> {sent} Everyone still received it in their notification centre.
          </p>
        )}
      </div>
    </AdminDialog>
  );
}

export default AddUpdateDialog;
