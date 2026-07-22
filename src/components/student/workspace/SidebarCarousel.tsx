"use client";

/* Small auto-rotating image carousel for the bottom of the workspace sidebar.
   Uses the three PNGs in /public/document (1.png, 2.png, 3.png). Falls back to a
   soft placeholder tile if an image is missing, so the sidebar never looks broken.
   Fade transition, advances every 5s, dot pagination reflects the active slide. */

import { useEffect, useState } from "react";

// ?v bumped whenever the images are replaced, so browsers don't serve a stale cache.
const IMAGES = ["/document/1.png?v=3", "/document/2.png?v=3", "/document/3.png?v=3"];
const INTERVAL = 22000;

export default function SidebarCarousel() {
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const t = setInterval(() => setActive((v) => (v + 1) % IMAGES.length), INTERVAL);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sw-carousel">
      <div className="sw-carousel-frame">
        {IMAGES.map((src, i) =>
          broken[i] ? (
            <div key={i} className="sw-carousel-slide sw-carousel-ph" style={{ opacity: active === i ? 1 : 0 }} aria-hidden />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="sw-carousel-slide"
              style={{ opacity: active === i ? 1 : 0 }}
              onError={() => setBroken((b) => { const n = [...b]; n[i] = true; return n; })}
            />
          )
        )}
      </div>
      <div className="sw-carousel-dots">
        {IMAGES.map((_, i) => (
          <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setActive(i)} className={`sw-dot-ind${active === i ? " on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
