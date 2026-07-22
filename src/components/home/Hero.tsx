import Link from "next/link";
import Image from "next/image";
import SiteHeader from "./SiteHeader";
import { StatusCircle, IconCheck, IconClock, IconArrow } from "./ui";

const eyebrow = {
  font: "600 10.5px/14px var(--font-sans)",
  letterSpacing: ".08em",
  textTransform: "uppercase" as const,
  color: "var(--ink-faint)",
};
/* iOS-26 "liquid glass", translucent frosted panels for the hero widgets. */
const glassCard = {
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(16px) saturate(1.6)",
  WebkitBackdropFilter: "blur(16px) saturate(1.6)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 10px 30px rgba(23,35,58,.12), inset 0 1px 0 rgba(255,255,255,.75)",
} as const;
const glassAmber = {
  background: "rgba(251,240,218,0.45)",
  backdropFilter: "blur(16px) saturate(1.6)",
  WebkitBackdropFilter: "blur(16px) saturate(1.6)",
  border: "1px solid rgba(231,197,131,0.6)",
  boxShadow: "0 10px 30px rgba(23,35,58,.12), inset 0 1px 0 rgba(255,255,255,.6)",
} as const;

/* iOS-style app-icon tile, crisp SVG, white squircle + soft shadow.
   Style reference: floating productivity-app icons (white tile, coloured glyph). */
function TileFrame({ size, radius, children }: { size: number; radius: number; children: React.ReactNode }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "#fff", boxShadow: "0 10px 28px rgba(23,35,58,.14)", border: "1px solid rgba(23,35,58,.05)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      {children}
    </div>
  );
}

/* Generated iOS-style photo icon (Higgsfield), pre-cropped tight to the tile
   (checkerboard removed at the source), so it sits pixel-crisp at native size.
   The container rounds the square crop into an app-icon tile + float shadow. */
function ImgTile({ src, size, radius }: { src: string; size: number; radius: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", boxShadow: "0 10px 28px rgba(23,35,58,.16)", position: "relative", flex: "none" }}>
      <Image src={src} alt="" fill sizes={`${size * 2}px`} style={{ objectFit: "cover" }} />
    </div>
  );
}
const TileSmall = ({ children }: { children: React.ReactNode }) => (
  <TileFrame size={48} radius={13}>{children}</TileFrame>
);
const GlyphCap = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none" stroke="var(--indigo-600)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10 34 16 20 22 6 16Z" fill="var(--indigo-600)" stroke="none" />
    <path d="M11 18.5V26c0 2 4 3.6 9 3.6s9-1.6 9-3.6v-7.5" />
    <path d="M34 16v7" />
  </svg>
);
const GlyphPassport = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="none" stroke="var(--indigo-600)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="6" width="22" height="28" rx="4" />
    <circle cx="20" cy="17" r="4.6" />
    <path d="M15.5 27h9" />
  </svg>
);
const GlyphPlane = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="var(--indigo-600)" stroke="none">
    <path d="M35 6 5 18.5l11.7 4.2L21 34l4.9-9.2z" />
  </svg>
);

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
      {/* Full-bleed background, spans the whole hero, behind the top bar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url(/hero-ambient.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundImage: "radial-gradient(rgba(90,107,133,.16) 1.1px, transparent 1.1px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
        }}
      />

      {/* Top bar sits on the background */}
      <SiteHeader />

      {/* ── Floating widgets (decorative; hidden on narrow screens) ── */}
      <div className="af-hero-widgets" aria-hidden>
        <div style={{ position: "absolute", left: 120, top: 92, transform: "rotate(-6deg)" }}>
          <div style={{ animation: "afFloatY 8.2s ease-in-out .2s infinite" }}>
            <ImgTile src="/icons/ic-timer.png" size={64} radius={16} />
          </div>
        </div>
        <div style={{ position: "absolute", right: 340, bottom: 320, transform: "rotate(5deg)" }}>
          <div style={{ animation: "afFloatY 7.6s ease-in-out .8s infinite" }}>
            <ImgTile src="/icons/ic-flag.png" size={64} radius={16} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 56, top: 150, transform: "rotate(-5deg)" }}>
          <div style={{ width: 212, ...glassAmber, borderRadius: 12, padding: "14px 18px 16px", textAlign: "left", animation: "afFloatY 7s ease-in-out infinite" }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "var(--red)", margin: "0 auto" }} />
            <div style={{ font: "italic 500 13px/19px var(--font-sans)", color: "var(--amber)", marginTop: 8 }}>
              Every document, deadline and step, tracked in one dossier.
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 372, transform: "rotate(-8deg)" }}>
          <div style={{ animation: "afFloatY 8s ease-in-out .6s infinite" }}>
            <ImgTile src="/icons/ic-20.png" size={84} radius={20} />
          </div>
        </div>

        <div style={{ position: "absolute", left: 48, bottom: 210, transform: "rotate(3deg)" }}>
          <div style={{ width: 262, ...glassCard, borderRadius: 16, padding: "18px 20px", textAlign: "left", animation: "afFloatY 7.5s ease-in-out .3s infinite" }}>
            <div style={eyebrow}>Your journey</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <StatusCircle size={28} tone="green"><IconCheck size={15} /></StatusCircle>
              <span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink)", flex: 1 }}>Passport</span>
              <span style={{ font: "600 11px/14px var(--font-sans)", color: "var(--green)" }}>Approved</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
              <StatusCircle size={28} tone="amber"><IconClock size={15} /></StatusCircle>
              <span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink)", flex: 1 }}>Translated diploma</span>
              <span style={{ font: "600 11px/14px var(--font-sans)", color: "var(--amber)" }}>Under review</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "var(--grey-tint)", marginTop: 14, overflow: "hidden" }}>
              <div style={{ width: "62%", height: "100%", borderRadius: 999, background: "var(--indigo-600)" }} />
            </div>
            <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", marginTop: 6 }}>8 of 13 steps done</div>
          </div>
        </div>

        <div style={{ position: "absolute", right: 170, top: 128, transform: "rotate(6deg)" }}>
          <div style={{ animation: "afFloatY 8.5s ease-in-out .9s infinite" }}>
            <ImgTile src="/icons/ic-calendar.png" size={84} radius={20} />
          </div>
        </div>

        <div style={{ position: "absolute", right: 44, top: 206, transform: "rotate(4deg)" }}>
          <div style={{ width: 250, ...glassCard, borderRadius: 16, padding: "18px 20px", textAlign: "left", animation: "afFloatY 7.2s ease-in-out .45s infinite" }}>
            <div style={eyebrow}>Timetable</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ color: "var(--indigo-600)", display: "flex" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="14" height="13" rx="2" />
                  <path d="M3 8h14M7 2.5v3M13 2.5v3" />
                  <circle cx="10" cy="12.5" r="1.3" />
                </svg>
              </span>
              <span style={{ font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>Visa appointment</span>
            </div>
            <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 4, marginLeft: 28 }}>
              Embassy appointment · confirmed
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "10px 0 0 28px", background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", color: "var(--indigo-text)", borderRadius: 999, padding: "3px 10px", font: "600 11.5px/16px var(--font-sans)" }}>
              Thu · 09:30
            </span>
          </div>
        </div>

        <div style={{ position: "absolute", right: 52, bottom: 210, transform: "rotate(-3deg)" }}>
          <div style={{ width: 240, ...glassCard, borderRadius: 16, padding: "18px 20px", textAlign: "left", animation: "afFloatY 7.8s ease-in-out 1.1s infinite" }}>
            <div style={eyebrow}>10+ universities</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <TileSmall><GlyphCap /></TileSmall>
              <TileSmall><GlyphPassport /></TileSmall>
              <TileSmall><GlyphPlane /></TileSmall>
            </div>
            <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 10 }}>
              Universities across Europe
            </div>
          </div>
        </div>
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
          Study abroad, guided every step of the way.
        </h1>
        <p style={{ font: "400 var(--font-sans)", fontSize: "clamp(15px, 2.2vw, 17px)", lineHeight: 1.65, color: "var(--ink-soft)", maxWidth: 600, margin: "20px 0 0" }}>
          One clear plan from application to arrival, human-reviewed documents, a live tracker, and real people behind every step.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="af-btn-primary" href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 999, font: "600 15px/1 var(--font-sans)" }}>
            Start your roadmap
          </Link>
          <Link className="af-btn-ghost" href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 26px", borderRadius: 999, border: "1.5px solid var(--indigo-600)", color: "var(--indigo-600)", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
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
