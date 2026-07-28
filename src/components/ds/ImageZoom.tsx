"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* ImageZoom — the viewport every preview in the platform is shown through.
 *
 * It owns the gestures and nothing else: the wheel and pinch to zoom, the drag
 * to pan, a double-click to fit. What is being looked at — an image, a PDF
 * page, a payment screenshot — is passed in as a child, so one set of gestures
 * serves every file type and no preview screen has to reimplement them.
 *
 * Zoom is controlled from outside so a toolbar can share the same number: the
 * component reports every change and never keeps a second copy. Pan is local,
 * because nothing outside cares where inside the image the reader is.
 *
 * Panning only engages once the content is larger than the frame. Below that
 * there is nothing to pan to, and a grabbing cursor over a still image is a
 * promise the component cannot keep. */

const MIN = 0.4;
const MAX = 5;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, Number(z.toFixed(2))));

export type ImageZoomProps = {
  children: ReactNode;
  zoom: number;
  onZoomChange: (z: number) => void;
  /** Degrees. Applied after scale so rotation feels like turning the paper. */
  rotation?: number;
  /** Fit level restored by a double-click. */
  fitZoom?: number;
  className?: string;
  /** Announced to assistive technology as the name of what is being viewed. */
  label?: string;
};

export function ImageZoom({
  children, zoom, onZoomChange, rotation = 0, fitZoom = 1, className = "", label,
}: ImageZoomProps) {
  const frame = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const canPan = zoom > fitZoom;
  /* Centred whenever there is nothing to pan to. Derived rather than reset in
     an effect: at fit size there is only one correct offset, so storing it
     would just be a second copy of `zoom` that can disagree. */
  const offset = canPan ? pan : { x: 0, y: 0 };

  /* Wheel zoom. Registered by hand because React's synthetic wheel listener is
     passive, and a passive listener may not call preventDefault — without
     which the page scrolls behind the preview while the reader zooms. */
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !el.matches(":hover")) return;
      e.preventDefault();
      onZoomChange(clamp(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, onZoomChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canPan || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) });
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  /* Two-finger pinch, for touch screens where there is no wheel. */
  const touchDistance = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) pinch.current = { distance: touchDistance(e.touches), zoom };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinch.current) return;
    const ratio = touchDistance(e.touches) / pinch.current.distance;
    onZoomChange(clamp(pinch.current.zoom * ratio));
  };
  const onTouchEnd = () => { pinch.current = null; };

  // Double-click toggles between fit and a readable 2x, the way a map does.
  const onDoubleClick = useCallback(() => {
    if (zoom > fitZoom) { onZoomChange(fitZoom); setPan({ x: 0, y: 0 }); }
    else onZoomChange(clamp(fitZoom * 2));
  }, [zoom, fitZoom, onZoomChange]);

  return (
    <div
      ref={frame}
      className={`ds-zoom${canPan ? " pannable" : ""}${dragging ? " dragging" : ""} ${className}`.trim()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={onDoubleClick}
      role="img"
      aria-label={label}
    >
      <div
        className="ds-zoom-inner"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          // Snap back smoothly when released, but follow the finger exactly.
          transition: dragging ? "none" : "transform 180ms var(--ease)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
