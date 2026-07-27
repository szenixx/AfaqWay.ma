"use client";

import { useState } from "react";
import { AnimatedModal, FileDrop, DialogCard, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton } from "../journey/parts";
import type { DocRequirement, DocStatus } from "@/lib/journeyDb";

/* Replace a document.

   Clicking Replace opens this rather than the file picker, so the student sees
   what is expected before choosing anything: the document, its current state,
   the accepted formats and the size limit. Nothing else, on purpose, the step
   description belongs on the step, not here.

   The upload area is the platform's shared FileDrop, the same control used at
   checkout and check-in. */

const LABEL: Record<DocStatus, string> = {
  pending: "Not uploaded", uploaded: "Uploaded", under_review: "Under review",
  needs_changes: "Rejected", approved: "Verified",
};
const TONE: Record<DocStatus, string> = {
  pending: "grey", uploaded: "indigo", under_review: "amber", needs_changes: "red", approved: "green",
};

export function ReplaceDialog({ requirement, status, existingName, onCancel, onConfirm }: {
  requirement: DocRequirement;
  status: DocStatus;
  existingName?: string;
  onCancel: () => void;
  /** Resolves once the upload has been stored. */
  onConfirm: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const accept = requirement.acceptedTypes
    .split(",").map((t) => t.trim().replace(/^\./, "")).filter(Boolean)
    .map((t) => `.${t}`).join(",") || undefined;

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await onConfirm(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <AnimatedModal open onClose={onCancel} className="dlg" ariaLabel={`Replace ${requirement.name}`}>
      <DialogHead title={existingName ? "Replace Document" : "Upload Document"}>
        Choose the file to send to your advisor. They review it and you will see the result on the step.
      </DialogHead>

      <div className="dlg-body">
        <DialogCard tone="quiet">
          <div className="rpl-doc">
            <span className="rpl-doc-name">{requirement.name || requirement.key}</span>
            <span className={`pill pill-${TONE[status]}`}>{LABEL[status]}</span>
          </div>
          <dl className="rvw-facts">
            <div><dt>Required format</dt><dd>{requirement.acceptedTypes ? requirement.acceptedTypes.toUpperCase() : "Any"}</dd></div>
            <div><dt>Maximum size</dt><dd>{requirement.maxSizeMb || 4} MB</dd></div>
            {existingName && <div><dt>Current file</dt><dd>{existingName}</dd></div>}
          </dl>
        </DialogCard>

        {(requirement.instructions || requirement.description) && (
          <DialogCard hint={requirement.instructions || requirement.description} />
        )}

        <DialogCard title="Upload">
          <FileDrop
            file={file} onFile={setFile} accept={accept} maxSizeMb={requirement.maxSizeMb || 4}
            hint="Drag your document here, or click to choose" error={error} onError={setError}
            disabled={busy}
          />
        </DialogCard>
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" disabled={busy} onClick={onCancel}>Back</JrButton>
        <JrButton tone="primary" size="md" disabled={!file || busy} onClick={submit}>
          {busy ? "Uploading…" : "Continue"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default ReplaceDialog;
