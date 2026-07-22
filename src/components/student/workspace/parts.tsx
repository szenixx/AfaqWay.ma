"use client";

/* Reusable presentational pieces for the student workspace. Glass surface
   (.sw-tile) matches the admin Overview/Wallet dashboards. Kept generic so every
   module (and every future country) reuses the same building blocks. */

import type { ReactNode } from "react";
import {
  GraduationCap, Building2, Home, Wallet, Bus, HeartPulse, Landmark, Users,
  Lightbulb, CircleCheckBig, Clock3, TriangleAlert, CircleDashed, Lock,
} from "lucide-react";
export { DefaultAvatar } from "@/components/ds/DefaultAvatar";

export function Panel({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={`sw-tile${className ? " " + className : ""}`} style={style}>{children}</div>;
}

export function PageHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={{ font: "700 11px/15px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--indigo-600)" }}>{eyebrow}</div>}
        <h1 style={{ font: "800 26px/32px var(--font-sans)", color: "var(--ink)", margin: "3px 0 0", letterSpacing: "-.3px" }}>{title}</h1>
        {sub && <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0", maxWidth: 680 }}>{sub}</p>}
      </div>
      {action && <div style={{ flex: "none" }}>{action}</div>}
    </div>
  );
}

export function CardTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
        {sub && <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && <div style={{ flex: "none" }}>{action}</div>}
    </div>
  );
}

export function StatTile({ label, value, accent, icon, sub }: { label: string; value: string; accent: string; icon: ReactNode; sub?: string }) {
  return (
    <div className="sw-tile" style={{ padding: 16, borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ font: "600 11.5px/15px var(--font-sans)", color: "var(--ink-soft)" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 10, flex: "none", background: `${accent}22`, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      </div>
      <div style={{ font: "800 24px/30px var(--font-sans)", color: "var(--ink)", marginTop: 8, letterSpacing: "-.3px" }}>{value}</div>
      {sub && <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function ProgressLine({ pct, color = "var(--indigo-600)", height = 9 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 999, background: "var(--subtle)", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: 999, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

export function Pill({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "indigo" | "grey" }) {
  return <span className={`pill pill-${tone}`}>{text}</span>;
}

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "34px 20px", color: "var(--ink-faint)" }}>
      <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{icon}</span>
      <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
      {sub && <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4, maxWidth: 360 }}>{sub}</div>}
    </div>
  );
}

export function BtnPrimary({ children, onClick, disabled, style }: { children: ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 14, border: "none", background: "var(--indigo-600)", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, font: "600 13.5px/1 var(--font-sans)", ...style }}>{children}</button>
  );
}

export function BtnGhost({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 14, border: "1px solid var(--line)", background: "rgba(255,255,255,.7)", color: "var(--ink)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", ...style }}>{children}</button>
  );
}

// Stage / status glyph used by the journey timeline and doc lists.
export function StatusGlyph({ status, size = 20 }: { status: "done" | "active" | "locked" | "todo"; size?: number }) {
  if (status === "done") return <CircleCheckBig size={size} color="var(--green)" />;
  if (status === "active") return <Clock3 size={size} color="var(--amber)" />;
  if (status === "locked") return <Lock size={size} color="var(--ink-faint)" />;
  return <CircleDashed size={size} color="var(--ink-faint)" />;
}

export { TriangleAlert };

// Explore section icon resolver.
const EXPLORE_ICONS: Record<string, typeof GraduationCap> = {
  GraduationCap, Building2, Home, Wallet, Bus, HeartPulse, Landmark, Users, Lightbulb,
};
export function exploreIcon(name: string, size = 20) {
  const Ico = EXPLORE_ICONS[name] ?? Lightbulb;
  return <Ico size={size} />;
}
