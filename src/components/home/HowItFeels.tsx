"use client";

import Image from "next/image";
import { useState } from "react";

type Pin = { name: string; left: number; top: number; dot: string; pulse?: boolean; facts?: string[] };

const PINS: Pin[] = [
  {
    name: "Lithuania",
    left: 55,
    top: 45.5,
    dot: "var(--green)",
    pulse: true,
    facts: ["10+ universities", "Tuition ~€4,000 / year", "2 intakes per year", "Taught in English", "Bachelor & Master degrees"],
  },
  { name: "Latvia", left: 56, top: 40.5, dot: "var(--red)" },
  { name: "Poland", left: 50, top: 52, dot: "var(--red)" },
  { name: "Germany", left: 42, top: 53, dot: "var(--red)" },
  { name: "Hungary", left: 51.5, top: 59.5, dot: "var(--red)" },
  { name: "Russia", left: 82, top: 40, dot: "var(--red)" },
];
const YOU = { left: 20, top: 83 };

const em = { color: "var(--indigo-600)", fontWeight: 600, fontStyle: "normal" as const };

export default function HowItFeels() {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const active = pinned ?? hover;
  const p = active !== null ? PINS[active] : null;

  return (
    <div style={{ padding: "56px 24px" }}>
      <div className="af-two-col">
        {/* Map — sits directly on the section background, no card/layer behind it */}
        <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
          <div onClick={() => setPinned(null)} style={{ position: "relative", width: "100%", aspectRatio: "1264 / 848" }}>
            <Image src="/europe-map.webp" alt="Outline map of Europe and Morocco" fill style={{ objectFit: "contain" }} sizes="(max-width: 900px) 100vw, 560px" />

            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <line x1={`${YOU.left}%`} y1={`${YOU.top}%`} x2={`${PINS[0].left}%`} y2={`${PINS[0].top}%`} stroke="var(--indigo-600)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.55" />
            </svg>

            {PINS.map((pin, i) => (
              <button
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => { e.stopPropagation(); setPinned(pinned === i ? null : i); }}
                style={{ position: "absolute", left: `${pin.left}%`, top: `${pin.top}%`, transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: `1px solid ${active === i ? "var(--indigo-line)" : "var(--line)"}`, borderRadius: 999, padding: "4px 10px", boxShadow: "var(--shadow-card)", cursor: "pointer", zIndex: 2, font: "500 11px/14px var(--font-sans)", color: "var(--ink)" }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 999, background: pin.dot, animation: pin.pulse ? "afPulse 2s infinite" : undefined }} />
                {pin.name}
              </button>
            ))}

            <div style={{ position: "absolute", left: `${YOU.left}%`, top: `${YOU.top}%`, transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--indigo-line)", borderRadius: 999, padding: "4px 10px", boxShadow: "var(--shadow-card)", zIndex: 2 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--indigo-600)" }} />
              <span style={{ font: "600 11px/14px var(--font-sans)", color: "var(--indigo-600)" }}>You</span>
            </div>

            {p && (
              <div
                style={{
                  position: "absolute",
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  transform: p.top < 45 ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 16px))",
                  zIndex: 3,
                  background: "var(--ink)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  width: 224,
                  pointerEvents: "none",
                  boxShadow: "0 6px 20px rgba(23,35,58,.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: p.dot }} />
                  <span style={{ font: "600 12.5px/17px var(--font-sans)" }}>{p.name}</span>
                  <span style={{ marginLeft: "auto", font: "600 9px/13px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: p.facts ? "#9CCBB2" : "#C9D3E4" }}>
                    {p.facts ? "Open" : "Soon"}
                  </span>
                </div>
                {p.facts ? (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                    {p.facts.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, font: "400 11.5px/16px var(--font-sans)", color: "#E4E9F2" }}>
                        <span style={{ width: 4, height: 4, borderRadius: 999, background: "#9CCBB2", flex: "none" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ font: "400 11.5px/17px var(--font-sans)", color: "#C9D3E4", marginTop: 6 }}>
                    Coming soon, programs, tuition and requirements unlock at launch.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right text */}
        <div>
          <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--indigo-600)" }}>How it feels</div>
          <h2 style={{ font: "700 var(--font-sans)", fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.25, color: "var(--ink)", margin: "12px 0 0" }}>
            From your living room to a European campus, guided, every step.
          </h2>
          <p style={{ font: "400 16px/28px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 460, margin: "20px 0 0" }}>
            You <em style={em}>start with a profile</em>. AfaqWay builds your <em style={em}>personalized roadmap</em>. A real reviewer <em style={em}>checks each document</em>. Your tracker shows what is done, what is next, and what needs your attention. By the time your visa appointment arrives, <em style={em}>nothing is missing</em>.
          </p>
          <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 16 }}>
            Click a country point for universities, tuition and intakes.
          </div>
        </div>
      </div>
    </div>
  );
}
