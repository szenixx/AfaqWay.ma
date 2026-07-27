"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

/* The platform's file upload area.

   Extracted verbatim from the checkout receipt uploader so every place that
   asks for a file, onboarding, check-in, invoice upload and Replace Document,
   uses this one control. Drag and drop is added here, which means every caller
   gets it at once. Do not write a second uploader. */

export function FileDrop({
  file, onFile, accept = "image/*,application/pdf", maxSizeMb = 4, hint, disabled, error, onError,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  /** Comma-separated input accept list. */
  accept?: string;
  maxSizeMb?: number;
  /** Placeholder line shown when nothing is chosen. */
  hint?: string;
  disabled?: boolean;
  error?: string;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  /** One validation path for the picker and for a drop. */
  const accept_ = (candidate: File | null) => {
    if (!candidate) { onFile(null); return; }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      onError?.(`File is larger than ${maxSizeMb} MB. Please upload a smaller file.`);
      return;
    }
    const exts = accept.split(",").map((a) => a.trim()).filter((a) => a.startsWith("."));
    if (exts.length) {
      const ext = `.${(candidate.name.split(".").pop() ?? "").toLowerCase()}`;
      if (!exts.map((e) => e.toLowerCase()).includes(ext)) {
        onError?.(`This document must be one of: ${exts.join(", ")}.`);
        return;
      }
    }
    onError?.("");
    onFile(candidate);
  };

  return (
    <>
      <button
        type="button" disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); accept_(e.dataTransfer.files?.[0] ?? null); }}
        className={`af-upload-stripes af-drop${over ? " over" : ""}`}
      >
        <Upload size={26} />
        <span className={`af-drop-label${file ? " has" : ""}`}>
          {file ? file.name : hint || "Drag a file here, or click to choose"}
        </span>
        {file && <span className="af-drop-size">{(file.size / 1024).toFixed(0)} KB · click to change</span>}
      </button>
      <input
        ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { accept_(e.target.files?.[0] ?? null); e.target.value = ""; }}
      />
      {error && <p className="af-drop-error">{error}</p>}
    </>
  );
}

export default FileDrop;
