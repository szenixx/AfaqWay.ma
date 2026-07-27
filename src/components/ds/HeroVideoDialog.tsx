"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

/* Hero video dialog.

   A still preview with a large play control, opening the player in a dialog
   rather than embedding an iframe in the page. That means no third-party frame
   loads until the student actually asks for it, which keeps the Learn section
   fast and stops YouTube setting cookies on arrival.

   YouTube and Vimeo thumbnails are derived from the video id, so an
   administrator only ever pastes a link. */

type Provider = "youtube" | "vimeo" | null;

function parse(url: string): { provider: Provider; id: string | null } {
  const yt = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url);
  if (yt) return { provider: "youtube", id: yt[1] };
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return { provider: "vimeo", id: vimeo[1] };
  return { provider: null, id: null };
}

/** Embed URL with autoplay, used only once the dialog is open. */
function embedFor(provider: Provider, id: string): string {
  return provider === "vimeo"
    ? `https://player.vimeo.com/video/${id}?autoplay=1`
    : `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
}

export function HeroVideoDialog({ url, title, thumbnail }: {
  url: string;
  title?: string;
  /** Overrides the provider thumbnail when an administrator supplies one. */
  thumbnail?: string;
}) {
  const [open, setOpen] = useState(false);
  const { provider, id } = parse(url);

  // Escape closes, and the page behind must not scroll while the dialog is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!provider || !id) return null;

  const poster = thumbnail
    ?? (provider === "youtube" ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined);
  const label = title || "Watch the video";

  return (
    <>
      <button type="button" className="hvd" onClick={() => setOpen(true)} aria-label={label}>
        {poster
          // Provider thumbnail: a remote host, so no next/image.
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="hvd-poster" src={poster} alt="" loading="lazy" />
          : <span className="hvd-poster hvd-poster-blank" />}
        <span className="hvd-shade" />
        <span className="hvd-play"><Play size={22} fill="currentColor" /></span>
        {title && <span className="hvd-title">{title}</span>}
      </button>

      {open && (
        <div className="hvd-overlay" role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)}>
          <div className="hvd-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="hvd-close" onClick={() => setOpen(false)} aria-label="Close video">
              <X size={18} />
            </button>
            <div className="hvd-frame">
              <iframe
                src={embedFor(provider, id)} title={label} allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HeroVideoDialog;
