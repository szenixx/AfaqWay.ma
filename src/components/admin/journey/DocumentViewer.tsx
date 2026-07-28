"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleCheck, Download, Maximize2, Minimize2, RotateCw, X, XCircle, ZoomIn, ZoomOut,
} from "lucide-react";
import { fileUrl } from "@/lib/storage/client";
import { Loader, ImageZoom } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import type { DbDocument } from "@/lib/journeyDb";

/* Inline document preview for the review window.

   An administrator should never have to download a file to decide on it, so
   images and PDFs render here with zoom, rotation and full screen, and the
   approve and reject decisions sit under the preview. */

const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;
const PDF = /\.pdf$/i;

export function DocumentViewer({ doc, onClose, onDecide, busy }: {
  doc: DbDocument;
  onClose: () => void;
  /** Omitted where the viewer is read-only, e.g. inside View Details. */
  onDecide?: (status: "approved" | "needs_changes") => void;
  busy?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [full, setFull] = useState(false);
  const shell = useRef<HTMLDivElement>(null);

  const name = doc.file_name || doc.name || "document";
  const isImage = IMAGE.test(name);
  const isPdf = PDF.test(name) || doc.mime_type === "application/pdf";

  const load = useCallback(async () => {
    setUrl(await fileUrl(doc.file_path, "documents"));
    setLoading(false);
  }, [doc.file_path]);
  // Fetching the signed URL is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  // Escape closes, which matters most when the preview covers the screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { if (full) setFull(false); else onClose(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full, onClose]);

  const download = async () => {
    const signed = await fileUrl(doc.file_path, "documents", name);
    if (signed) window.open(signed, "_blank", "noopener,noreferrer");
  };

  const zoomBy = (by: number) => setZoom((z) => Math.min(4, Math.max(0.4, Number((z + by).toFixed(2)))));

  return (
    <div ref={shell} className={`dv${full ? " dv-full" : ""}`}>
      <header className="dv-bar">
        <span className="dv-name" title={name}>{name}</span>
        <span className="dv-tools">
          <button type="button" className="dv-tool" title="Zoom out" onClick={() => zoomBy(-0.25)} disabled={zoom <= 0.4}><ZoomOut size={15} /></button>
          <span className="dv-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" className="dv-tool" title="Zoom in" onClick={() => zoomBy(0.25)} disabled={zoom >= 4}><ZoomIn size={15} /></button>
          <button type="button" className="dv-tool" title="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)}><RotateCw size={15} /></button>
          <button type="button" className="dv-tool" title={full ? "Exit full screen" : "Full screen"} onClick={() => setFull(!full)}>
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button type="button" className="dv-tool" title="Download" onClick={download}><Download size={15} /></button>
          <button type="button" className="dv-tool" title="Close preview" onClick={onClose}><X size={15} /></button>
        </span>
      </header>

      <div className="dv-stage">
        {loading ? <Loader block /> : !url ? (
          <p className="stp-hint">This file could not be opened. Try downloading it instead.</p>
        ) : isImage || isPdf ? (
          /* Both file types are looked at the same way, so both go through the
             shared viewport: wheel and pinch to zoom, drag to pan, double-click
             to fit. The toolbar above shares its `zoom`, so the percentage it
             shows and the gesture always agree. */
          <ImageZoom zoom={zoom} onZoomChange={setZoom} rotation={rotation} label={name}>
            {isImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={url} alt={name} className="dv-img" />
              : <div className="dv-pdfwrap"><iframe src={`${url}#toolbar=0`} title={name} className="dv-pdf" /></div>}
          </ImageZoom>
        ) : (
          <p className="stp-hint">
            No inline preview for this file type. Use Download to open it.
          </p>
        )}
      </div>

      {onDecide && (
        <footer className="dv-foot">
          <JrButton tone="danger" icon={<XCircle size={14} />} disabled={busy} onClick={() => onDecide("needs_changes")}>
            Reject document
          </JrButton>
          <JrButton tone="success" icon={<CircleCheck size={14} />} disabled={busy} onClick={() => onDecide("approved")}>
            Approve document
          </JrButton>
        </footer>
      )}
    </div>
  );
}

export default DocumentViewer;
