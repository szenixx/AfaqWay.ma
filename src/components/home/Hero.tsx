import Link from "next/link";
import Image from "next/image";
import SiteHeader from "./SiteHeader";
import { IconArrow } from "./ui";
import { AnimatedGridPattern } from "./AnimatedGridPattern";
import { ElasticText } from "@/components/ds/ElasticText";

/* The six hero widgets. `at` reuses the slots the previous tiles and glass
   cards occupied, so all four corners and both mid-sides stay filled; `rotate`,
   `dur` and `delay` are carried over from the item that held each slot, which
   is what keeps the original drift. `ratio` is the artwork's own aspect. */
/* `w` is kept at or below each render's native pixel width, so the artwork is
   never upscaled — that upscaling was what made the widgets look soft. `nat`
   is the source width, handed to next/image so it serves the full-resolution
   file rather than a downscaled candidate. */
/* Every widget is anchored from the TOP, never from the bottom. Mixing the two
   made the vertical gaps depend on the viewport height, so the lower pair on
   each side slid into the one above it on a short screen — the cards were
   genuinely overlapping at ~900px tall. Anchoring one way makes each column a
   fixed stack with ~55px of clear air between neighbours, which holds at every
   height. Widths are trimmed slightly to keep both columns clear of the
   centre headline. */
const WIDGETS = [
  // ── Left column ──
  { src: "/hero/w2.webp", w: 240, nat: 358, ratio: 358 / 314, at: { left: 40, top: 110 }, rotate: -5, dur: 7, delay: 0 },
  { src: "/hero/w5.webp", w: 265, nat: 414, ratio: 414 / 173, at: { left: 72, top: 379 }, rotate: -8, dur: 8, delay: 0.6 },
  { src: "/hero/w4.webp", w: 262, nat: 398, ratio: 398 / 310, at: { left: 32, top: 544 }, rotate: 3, dur: 7.5, delay: 0.3 },
  // ── Right column ──
  { src: "/hero/w1.webp", w: 272, nat: 470, ratio: 470 / 318, at: { right: 56, top: 100 }, rotate: 6, dur: 8.5, delay: 0.9 },
  { src: "/hero/w3.webp", w: 248, nat: 414, ratio: 414 / 326, at: { right: 28, top: 342 }, rotate: 4, dur: 7.2, delay: 0.45 },
  { src: "/hero/w6.webp", w: 288, nat: 900, ratio: 620 / 430, at: { right: 36, top: 595 }, rotate: -3, dur: 7.8, delay: 1.1 },
] as const;

export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px 0",
        textAlign: "center",
      }}
    >
      {/* Full-bleed animated grid, spans the whole hero, behind the top bar.
          Replaces the previous ambient image + dot pattern; hero content,
          widgets and layout are untouched. */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AnimatedGridPattern />
      </div>

      {/* Top bar sits on the background */}
      <SiteHeader />

      {/* ── Floating widgets (decorative; hidden on narrow screens) ──
          Six supplied widget renders, one per corner and mid-side, so the
          frame is filled the way the old tiles and glass cards filled it.
          Each keeps a previous item's slot, rotation, float duration and
          delay, so the drift reads exactly as before — only the artwork
          changed. The PNGs carry their own card, shadow and transparency, so
          they are placed bare, with no wrapper card behind them. */}
      <div className="af-hero-widgets" aria-hidden>
        {WIDGETS.map((w) => (
          <div key={w.src} style={{ position: "absolute", ...w.at, transform: `rotate(${w.rotate}deg)` }}>
            <div className="af-hero-widget-frame" style={{ animation: `afFloatY ${w.dur}s ease-in-out ${w.delay}s infinite` }}>
              {/* unoptimized: these are already hand-tuned lossless WebP with
                  alpha. Running them through the image optimizer re-encoded
                  them lossily and softened the type. */}
              <Image
                className="af-hero-widget" unoptimized
                src={w.src} alt="" width={w.nat} height={Math.round(w.nat / w.ratio)}
                style={{ display: "block", width: `calc(${w.w}px * var(--hw-scale, 1))`, height: "auto" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Center stack ── */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", marginTop: 72 }}>
        <svg width="132" height="132" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }}>
          <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M29 28 48 45 67 28" style={{ animation: "afChev 2.2s cubic-bezier(.4,0,.2,1) infinite" }} />
            <path d="M29 54 48 71 67 54" style={{ animation: "afChev 2.2s cubic-bezier(.4,0,.2,1) .28s infinite" }} />
          </g>
        </svg>

        <h1 style={{ font: "800 var(--font-sans)", fontSize: "clamp(30px, 5.5vw, 56px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--ink)", maxWidth: 900, margin: "28px 0 0" }}>
          <ElasticText>Study abroad, guided every step of the way.</ElasticText>
        </h1>
        <p style={{ font: "400 var(--font-sans)", fontSize: "clamp(15px, 2.2vw, 17px)", lineHeight: 1.65, color: "var(--ink-soft)", maxWidth: 600, margin: "20px 0 0" }}>
          One clear plan from application to arrival, human-reviewed documents, a live tracker, and real people behind every step.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="af-btn-primary af-shimmer af-jelly" href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 28px", borderRadius: "var(--radius-2xl)", font: "600 15px/1 var(--font-sans)" }}>
            Start your roadmap
          </Link>
          <Link className="af-btn-ghost" href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 28px", borderRadius: "var(--radius-2xl)", border: "1.5px solid var(--indigo-600)", color: "var(--indigo-600)", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
            Talk to us
            <IconArrow size={16} />
          </Link>
        </div>
      </div>

      {/* ── Trust strip (marquee, no corner fades) ── */}
      <div style={{ marginTop: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingBottom: 72, position: "relative", zIndex: 2 }}>
        <span style={{ font: "500 12px/16px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
          Trusted by students accepted at
        </span>
        <div className="af-marquee" style={{ position: "relative", width: 1100, maxWidth: "100%", overflow: "hidden" }}>
          <div className="af-marquee-track" style={{ display: "flex", alignItems: "center", gap: 48, width: "max-content", animation: "afMarquee 30s linear infinite", opacity: 0.6, color: "var(--ink-faint)" }}>
            {[...UNIVERSITIES, ...UNIVERSITIES].map((name, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 48 }}>
                <span style={{ font: "600 16px/32px var(--font-sans)", whiteSpace: "nowrap" }}>{name}</span>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--ink-faint)" }} />
              </span>
            ))}
          </div>
        </div>
        <span style={{ font: "600 13px/20px var(--font-sans)", color: "var(--indigo-600)", marginTop: 4 }}>
          AfaqWay is built for students, not agencies.
        </span>
      </div>
    </section>
  );
}

const UNIVERSITIES = [
  "Vytautas Magnus University",
  "Vilnius University",
  "SMK University of Applied Social Sciences",
  "Kauno kolegija",
  "Klaipėda University",
];
