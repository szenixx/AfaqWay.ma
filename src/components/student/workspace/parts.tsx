"use client";

/* Reusable presentational pieces for the student workspace. Glass surface
   (.sw-tile) matches the admin Overview/Wallet dashboards. Kept generic so every
   module (and every future country) reuses the same building blocks. */

import type { ReactNode } from "react";
import {
  GraduationCap, Building2, Home, Wallet, Bus, HeartPulse, Landmark, Users,
  Lightbulb, CircleCheckBig, Clock3, TriangleAlert, CircleDashed, Lock, Info,
} from "lucide-react";
export { DefaultAvatar } from "@/components/ds/DefaultAvatar";
import { StatCard, CompactCard } from "@/components/ds/Cards";
export { CompactCard };

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

/* Statistics tile — the platform's one metric card, on the workspace glass
   surface. `trend` shows the change against the previous period. */
export function StatTile({ label, value, accent, icon, sub, trend }: { label: string; value: string; accent: string; icon: ReactNode; sub?: string; trend?: { value: string; up: boolean } }) {
  return <StatCard className="sw-tile" title={label} value={value} accent={accent} icon={icon} sub={sub} trend={trend} />;
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
    <button type="button" onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px", borderRadius: 12, border: "none", background: "var(--indigo-600)", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, font: "600 13px/1 var(--font-sans)", ...style }}>{children}</button>
  );
}

/* One tone system for every tinted surface on the platform: buttons, icon
   chips and info notices all read their colours from here, so a "red button"
   looks the same in every module. Values are design-system tokens only. */
export type Tone = "neutral" | "blue" | "red" | "green" | "amber";
export const TONES: Record<Exclude<Tone, "neutral">, { tint: string; line: string; ink: string }> = {
  blue: { tint: "var(--indigo-tint)", line: "var(--indigo-line)", ink: "var(--indigo-text)" },
  red: { tint: "var(--red-tint)", line: "var(--red-line)", ink: "var(--red)" },
  green: { tint: "var(--green-tint)", line: "var(--green-line)", ink: "var(--green)" },
  amber: { tint: "var(--amber-tint)", line: "var(--amber-line)", ink: "var(--amber)" },
};

/* Secondary button. `tone` only recolours it — size, radius and spacing are
   identical across tones so swapping a tone never shifts a layout. */
export function BtnGhost({ children, onClick, style, tone = "neutral", disabled, title }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties; tone?: Tone; disabled?: boolean; title?: string }) {
  const t = tone === "neutral" ? null : TONES[tone];
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 14px", borderRadius: 12,
        border: `1px solid ${t ? t.line : "var(--line)"}`,
        background: t ? t.tint : "rgba(255,255,255,.7)",
        color: t ? t.ink : "var(--ink)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        font: "600 13.5px/1 var(--font-sans)", ...style,
      }}
    >{children}</button>
  );
}

/* Slim information frame (locked fields, onboarding-sourced data, warnings).
   Tinted background + matching border, icon and text — same padding and radius
   wherever it appears. */
export function InfoNotice({ children, icon, tone = "amber", style }: { children: ReactNode; icon?: ReactNode; tone?: Exclude<Tone, "neutral">; style?: React.CSSProperties }) {
  const t = TONES[tone];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.tint, border: `1px solid ${t.line}`, borderRadius: 14, padding: "10px 13px", ...style }}>
      <span style={{ display: "flex", flex: "none", color: t.ink }}>{icon ?? <Info size={16} />}</span>
      <span style={{ font: "500 12px/17px var(--font-sans)", color: t.ink }}>{children}</span>
    </div>
  );
}

/* Small square icon chip used in info rows and program cards. */
export function IconChip({ children, tone = "blue", size = 32 }: { children: ReactNode; tone?: Exclude<Tone, "neutral">; size?: number }) {
  const t = TONES[tone];
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), flex: "none", background: t.tint, color: t.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</span>
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

/* Section titles carry a colour so a long page reads as distinct sections
   rather than one wall. The tones are the design system's own accents, used at
   label weight so they stay subtle. */
export type SectionTone = "blue" | "purple" | "orange" | "green" | "indigo" | "grey";

export function SectionTitle({ tone = "blue", sub, children }: {
  tone?: SectionTone;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`sect sect-${tone}`}>
      <span className="sect-bar" aria-hidden />
      <span className="sect-text">
        <span className="sect-title">{children}</span>
        {sub && <span className="sect-sub">{sub}</span>}
      </span>
    </div>
  );
}

/* Warnings and notices are a small icon and coloured text, never a filled box. */
export function InlineNote({ tone = "amber", icon, children }: {
  tone?: "amber" | "red" | "green" | "blue" | "grey";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className={`inote inote-${tone}`}>
      {icon ?? <Info size={14} />}
      <span>{children}</span>
    </p>
  );
}
