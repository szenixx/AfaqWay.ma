"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, Trash2 } from "lucide-react";
import { AnimatedModal, BrandLogo, DialogCard, DialogFoot, DialogHead, Input, TextArea } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
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
    <AnimatedModal open onClose={onClose} className="dlg upd" ariaLabel="Add a platform update">
      <DialogHead title="Add update">
        Everyone on the platform receives this, in their notification centre and by email.
      </DialogHead>

      <div className="dlg-body">
        {/* Who it comes from, shown the way the student will see it. */}
        <DialogCard tone="quiet">
          <div className="upd-identity">
            <BrandLogo size={34} />
            <span>
              <b>AfaqWay</b>
              <em>AfaqWay Platform</em>
            </span>
          </div>
        </DialogCard>

        <DialogCard title="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance on Sunday" />
        </DialogCard>

        <DialogCard title="Message" hint="Write it as you would say it. Students read this in their own language level.">
          <TextArea
            rows={7} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="What is changing, when, and what students need to do."
          />
        </DialogCard>

        <DialogCard title="Attachments" hint="PDFs, images or documents. Optional.">
          {files.length > 0 && (
            <ul className="upd-files">
              {files.map((f, i) => (
                <li key={f.path}>
                  <Paperclip size={14} />
                  <span>{f.fileName}</span>
                  <button
                    type="button" className="chat-act" aria-label={`Remove ${f.fileName}`}
                    onClick={() => setFiles((list) => list.filter((_, n) => n !== i))}
                    style={{ color: "var(--red)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <JrButton tone="outline" icon={<Paperclip size={14} />} disabled={uploading} onClick={() => pick.current?.click()}>
            {uploading ? "Uploading…" : "Attach a file"}
          </JrButton>
          <input ref={pick} type="file" style={{ display: "none" }} onChange={onFile} />
        </DialogCard>

        {error && <p className="af-drop-error">{error}</p>}
        {sent && (
          <p className="stp-hint">
            <Send size={14} />{sent} Everyone still received it in their notification centre.
          </p>
        )}
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" disabled={busy} onClick={onClose}>{sent ? "Close" : "Cancel"}</JrButton>
        <JrButton tone="primary" size="md" icon={<Send size={15} />} disabled={busy || !title.trim()} onClick={send}>
          {busy ? "Sending…" : "Send Update"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default AddUpdateDialog;
