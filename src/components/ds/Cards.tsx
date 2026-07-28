"use client";

import type { CSSProperties, ReactNode } from "react";
import { Pill } from "./Pill";
import { ArrowRight, Bookmark, TrendingDown, TrendingUp } from "lucide-react";

/* The platform's five card roles. Everything that presents an item on any page
   is one of these, so a country card, a university card and a dashboard widget
   all share the same radius, padding, hover and typography.

   Feature  — a highlighted thing with a cover image (featured country, university,
              scholarship, program, blog, homepage highlight)
   Info     — the standard list item (university, program, country, housing,
              transport, banking, healthcare, student services)
   Compact  — small icon + line of text (quick tips, notifications, timeline,
              FAQs, dashboard widgets, recent activity, requirements)
   Stat     — a number with its trend (both workspaces' metric tiles)
   Action   — an invitation to do the next thing (continue application, upload
              documents, complete profile, contact advisor, explore countries) */

const CARD: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  boxShadow: "var(--shadow-card)",
  overflow: "hidden",
};

/* ── Large feature card ───────────────────────────────────────────────────── */

export function FeatureCard({ image, imageNode, badge, title, description, actionLabel, onAction, bookmarked, onBookmark, style }: {
  image?: string;
  /** Used when the cover is drawn rather than photographed (map, flag, illustration). */
  imageNode?: ReactNode;
  badge?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div className="af-card af-card-feature" style={{ ...CARD, display: "flex", flexDirection: "column", ...style }}>
      <div style={{ position: "relative", height: 156, background: "var(--indigo-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : imageNode}
        {badge && (
          <Pill tone="indigo" style={{ position: "absolute", top: 12, left: 12, background: "var(--card)" }}>{badge}</Pill>
        )}
        {onBookmark && (
          <button
            type="button" onClick={onBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark"} aria-pressed={bookmarked}
            style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", color: bookmarked ? "var(--indigo-600)" : "var(--ink-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Bookmark size={16} fill={bookmarked ? "var(--indigo-600)" : "none"} />
          </button>
        )}
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ font: "700 17px/23px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
        {description && <div style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)" }}>{description}</div>}
        {actionLabel && (
          <button type="button" onClick={onAction} style={{ marginTop: "auto", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 14, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13.5px/1 var(--font-sans)", cursor: "pointer" }}>
            {actionLabel}<ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Medium information card ──────────────────────────────────────────────── */

export function InfoCard({ thumbnail, title, supporting, meta, actionLabel, onAction, style }: {
  thumbnail?: ReactNode;
  title: string;
  supporting?: string;
  /** Short facts shown as a quiet metadata row (city, tuition, language…). */
  meta?: string[];
  actionLabel?: string;
  onAction?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div className="af-card af-card-info" style={{ ...CARD, padding: 16, display: "flex", gap: 14, alignItems: "flex-start", ...style }}>
      {thumbnail && (
        <span style={{ flex: "none", width: 52, height: 52, borderRadius: 14, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{thumbnail}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 15px/21px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
        {supporting && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>{supporting}</div>}
        {meta && meta.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
            {meta.map((m) => <span key={m} style={{ font: "500 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{m}</span>)}
          </div>
        )}
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: 12, border: "1px solid var(--indigo-line)", background: "var(--indigo-tint)", color: "var(--indigo-text)", font: "600 12.5px/1 var(--font-sans)", cursor: "pointer" }}>
          {actionLabel}<ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Compact information card ─────────────────────────────────────────────── */

export function CompactCard({ icon, title, description, onClick, style }: {
  icon: ReactNode; title: string; description?: string; onClick?: () => void; style?: CSSProperties;
}) {
  const inner = (
    <>
      <span style={{ flex: "none", width: 34, height: 34, borderRadius: 11, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{title}</span>
        {description && <span style={{ display: "block", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)", marginTop: 1 }}>{description}</span>}
      </span>
    </>
  );
  const st: CSSProperties = { ...CARD, padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "left", width: "100%", ...style };
  return onClick
    ? <button type="button" className="af-card af-card-compact" onClick={onClick} style={{ ...st, cursor: "pointer", font: "inherit" }}>{inner}</button>
    : <div className="af-card af-card-compact" style={st}>{inner}</div>;
}

/* ── Statistics card ──────────────────────────────────────────────────────── */

export function StatCard({ value, title, icon, accent = "var(--indigo-600)", trend, sub, style, className }: {
  value: string | number;
  title: string;
  icon: ReactNode;
  accent?: string;
  /** Signed change over the previous period, e.g. `{ value: "+12%", up: true }`. */
  trend?: { value: string; up: boolean };
  sub?: string;
  style?: CSSProperties;
  /** Lets a surface (e.g. the workspace glass tile) supply its own skin. */
  className?: string;
}) {
  const trendColor = trend ? (trend.up ? "var(--green)" : "var(--red)") : undefined;
  return (
    <div className={`af-card af-card-stat${className ? " " + className : ""}`} style={{ ...(className ? null : CARD), padding: 16, borderTop: `3px solid ${accent}`, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ font: "600 11.5px/15px var(--font-sans)", color: "var(--ink-soft)" }}>{title}</span>
        <span style={{ width: 30, height: 30, borderRadius: 10, flex: "none", background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ font: "800 24px/30px var(--font-sans)", color: "var(--ink)", letterSpacing: "-.3px" }}>{value}</span>
        {trend && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, font: "600 11.5px/16px var(--font-sans)", color: trendColor }}>
            {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{trend.value}
          </span>
        )}
      </div>
      {sub && <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Action card ──────────────────────────────────────────────────────────── */

export function ActionCard({ icon, title, description, ctaLabel, onAction, style }: {
  icon: ReactNode; title: string; description?: string; ctaLabel: string; onAction?: () => void; style?: CSSProperties;
}) {
  return (
    <div className="af-card af-card-action" style={{ ...CARD, padding: 18, display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <div style={{ font: "700 14.5px/20px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
      {description && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{description}</div>}
      <button type="button" onClick={onAction} style={{ marginTop: 4, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: 13, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13px/1 var(--font-sans)", cursor: "pointer" }}>
        {ctaLabel}<ArrowRight size={15} />
      </button>
    </div>
  );
}
