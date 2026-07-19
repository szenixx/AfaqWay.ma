"use client";

/* ============================================================================
   ⚠️  INTENTIONAL DESIGN-SYSTEM EXCEPTION — DO NOT COPY THIS PATTERN ELSEWHERE
   ----------------------------------------------------------------------------
   The AfaqWay design system forbids gradients, textures, blur and transparency.
   This component deliberately breaks that rule: a frosted-glass, animated
   glassmorphism hero. Approved ONLY for hero / marketing surfaces (this
   onboarding left panel + the homepage / login hero). NEVER copy blur/glass
   into product / document pages. Want to reuse it elsewhere? STOP and ask.
   The right-hand onboarding form stays 100% inside the DS.
   Background clips generated with Higgsfield (white bg / blue glass objects).
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds";
import { supabase } from "@/lib/supabase/client";

const VIDEOS = ["/onboarding/step-1.mp4", "/onboarding/step-2.mp4", "/onboarding/step-3.mp4", "/onboarding/step-4.mp4", "/onboarding/step-5.mp4"];
const PANEL_RADIUS = 16; // matches the login card
const PLAYBACK_RATE = 0.4; // slow the drift down a lot
const FADE_MS = 900;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
        <path className="af-logo-chev1" d="M29 28 48 45 67 28" />
        <path className="af-logo-chev2" d="M29 54 48 71 67 54" />
      </g>
    </svg>
  );
}

type HeroStep = { label: string; caption: string };
type Props = { steps: HeroStep[]; view: number; reached: number; onJump: (i: number) => void };

export default function OnboardingHeroPanel({ steps, view, reached, onJump }: Props) {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const idx = Math.min(Math.max(view - 1, 0), VIDEOS.length - 1);

  // Two video slots. We cross-fade between them both on step change AND on loop
  // restart, so the clip never hard-cuts / "refreshes" at its end.
  const v0 = useRef<HTMLVideoElement>(null);
  const v1 = useRef<HTMLVideoElement>(null);
  const visibleRef = useRef(0);
  const idxRef = useRef(idx);
  const [visible, setVisible] = useState(0);

  const slot = (n: number) => (n === 0 ? v0.current : v1.current);

  function crossTo(src: string) {
    const hidden = 1 - visibleRef.current;
    const el = slot(hidden);
    if (!el) return;
    if (el.getAttribute("src") !== src) el.setAttribute("src", src);
    el.playbackRate = PLAYBACK_RATE;
    try { el.currentTime = 0; } catch {}
    if (!reduced) el.play().catch(() => {});
    visibleRef.current = hidden;
    setVisible(hidden);
  }

  // Mount: prime both slots with the current clip, start the visible one.
  useEffect(() => {
    [v0.current, v1.current].forEach((el) => { if (el && el.getAttribute("src") !== VIDEOS[idx]) el.setAttribute("src", VIDEOS[idx]); if (el) el.playbackRate = PLAYBACK_RATE; });
    if (!reduced) v0.current?.play().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step change: cross-fade to the new step's clip.
  useEffect(() => {
    if (idx === idxRef.current) return;
    idxRef.current = idx;
    crossTo(VIDEOS[idx]);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loop: when the visible clip ends, cross-fade to a fresh play of the same clip.
  const onEnded = (n: number) => () => { if (n === visibleRef.current) crossTo(VIDEOS[idxRef.current]); };
  const onLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => { e.currentTarget.playbackRate = PLAYBACK_RATE; if (reduced) { e.currentTarget.pause(); e.currentTarget.currentTime = 0; } };

  const vStyle = (n: number): React.CSSProperties => ({
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.14)", transformOrigin: "center",
    opacity: visible === n ? 1 : 0, transition: reduced ? "none" : `opacity ${FADE_MS}ms cubic-bezier(.4,0,.2,1)`,
  });

  async function logout() { await supabase.auth.signOut(); router.replace("/signup"); }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", borderRadius: PANEL_RADIUS, overflow: "hidden", background: "#fff", isolation: "isolate" }}>
      {/* Layer 1 — background clips (cross-faded, zoomed) */}
      <video ref={v0} style={vStyle(0)} muted playsInline preload="auto" onEnded={onEnded(0)} onLoadedData={onLoaded} aria-hidden />
      <video ref={v1} style={vStyle(1)} muted playsInline preload="auto" onEnded={onEnded(1)} onLoadedData={onLoaded} aria-hidden />

      {/* Layer 2 — frosted legibility overlay (light, so dark text reads on white) */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.5)", backdropFilter: "blur(6px) saturate(1.05)", WebkitBackdropFilter: "blur(6px) saturate(1.05)" }} />

      {/* Layer 3 — crisp foreground */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "28px 32px" }}>
        {/* top row: logo (left) + logout (right) */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <LogoMark size={30} />
              <span style={{ font: "700 20px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
            </div>
            <div style={{ font: "700 22px/28px var(--font-sans)", color: "var(--ink)", marginTop: 14 }}>Let&apos;s build your plan</div>
          </div>
          <button type="button" onClick={logout}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 14px", borderRadius: 999, cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink-soft)", background: "rgba(255,255,255,.45)", border: "1px solid rgba(23,35,58,.12)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <Icon name="logout" size={15} />
            Log out
          </button>
        </div>

        {/* middle: vertically-centered steps with connecting lines + captions */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <nav style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((s, i) => {
              const step = i + 1;
              const active = step === view;
              const done = step !== view && step <= reached;
              const upcoming = step > reached;
              const clickable = step <= reached && step !== view;
              const last = i === steps.length - 1;
              return (
                <div key={step} style={{ display: "flex", gap: 16 }}>
                  {/* icon + connector column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ width: 40, height: 40, borderRadius: 999, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: active || done ? "var(--indigo-600)" : "rgba(255,255,255,.75)", color: active || done ? "#fff" : "var(--ink-faint)", border: upcoming ? "1px solid var(--line)" : "none", font: "600 15px/1 var(--font-sans)", boxShadow: active ? "0 6px 16px rgba(43,76,155,.35)" : "none" }}>
                      {done ? <Icon name="check" size={18} /> : step}
                    </span>
                    {!last && <span aria-hidden style={{ width: 2, flex: 1, minHeight: 26, borderRadius: 999, background: reached > step ? "var(--indigo-600)" : "var(--line)", margin: "3px 0" }} />}
                  </div>
                  {/* label + longer caption */}
                  <button type="button" onClick={() => clickable && onJump(step)} disabled={!clickable} aria-current={active ? "step" : undefined}
                    style={{ background: "none", border: "none", textAlign: "left", padding: "6px 0 24px", cursor: clickable ? "pointer" : "default" }}>
                    <div style={{ font: "600 17px/22px var(--font-sans)", color: active ? "var(--indigo-700)" : upcoming ? "var(--ink-faint)" : "var(--ink)" }}>{s.label}</div>
                    <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4, maxWidth: 320 }}>{s.caption}</div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* bottom: static reassurance copy */}
        <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: 0, textAlign: "center", maxWidth: 340, alignSelf: "center" }}>
          The basics we need before we can shortlist programs. This stays in your file, you can edit most of it later.
        </p>
      </div>
    </div>
  );
}
