import React from "react";
import { Pill } from "./Pill";

/* AfaqWay's five card roles. Everything that presents an item on any page is one
   of these — same radius, padding, hover and typography. Ported from Cards.tsx.
   Feature · Info · Compact · Stat · Action. */

/* Inline lucide-shaped glyphs so the file is self-contained. */
const IArrow = ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const IBookmark = ({ s = 16, filled }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>);
const ITrendUp = ({ s = 13 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 7l-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>);
const ITrendDown = ({ s = 13 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17l-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></svg>);

const CARD = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-card)", overflow: "hidden" };

export function FeatureCard({ image, imageNode, badge, title, description, actionLabel, onAction, bookmarked, onBookmark, style }) {
  return (
    <div className="af-card af-card-feature" style={{ ...CARD, display: "flex", flexDirection: "column", ...style }}>
      <div style={{ position: "relative", height: 156, background: "var(--indigo-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : imageNode}
        {badge && <Pill tone="indigo" style={{ position: "absolute", top: 12, left: 12, background: "var(--card)" }}>{badge}</Pill>}
        {onBookmark && (
          <button type="button" onClick={onBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark"} aria-pressed={bookmarked}
            style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", color: bookmarked ? "var(--indigo-600)" : "var(--ink-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IBookmark filled={bookmarked} />
          </button>
        )}
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ font: "700 17px/23px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
        {description && <div style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)" }}>{description}</div>}
        {actionLabel && (
          <button type="button" onClick={onAction} style={{ marginTop: "auto", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: "var(--radius-control)", border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13.5px/1 var(--font-sans)", cursor: "pointer" }}>
            {actionLabel}<IArrow />
          </button>
        )}
      </div>
    </div>
  );
}

export function InfoCard({ thumbnail, title, supporting, meta, actionLabel, onAction, style }) {
  return (
    <div className="af-card af-card-info" style={{ ...CARD, padding: 16, display: "flex", gap: 14, alignItems: "flex-start", ...style }}>
      {thumbnail && <span style={{ flex: "none", width: 52, height: 52, borderRadius: 14, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{thumbnail}</span>}
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
        <button type="button" onClick={onAction} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: "var(--radius-control)", border: "1px solid var(--indigo-line)", background: "var(--indigo-tint)", color: "var(--indigo-text)", font: "600 12.5px/1 var(--font-sans)", cursor: "pointer" }}>
          {actionLabel}<IArrow s={14} />
        </button>
      )}
    </div>
  );
}

export function CompactCard({ icon, title, description, onClick, style }) {
  const inner = (
    <>
      <span style={{ flex: "none", width: 34, height: 34, borderRadius: 11, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{title}</span>
        {description && <span style={{ display: "block", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)", marginTop: 1 }}>{description}</span>}
      </span>
    </>
  );
  const st = { ...CARD, padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "left", width: "100%", ...style };
  return onClick
    ? <button type="button" className="af-card af-card-compact" onClick={onClick} style={{ ...st, cursor: "pointer", font: "inherit" }}>{inner}</button>
    : <div className="af-card af-card-compact" style={st}>{inner}</div>;
}

export function StatCard({ value, title, icon, accent = "var(--indigo-600)", trend, sub, style, className }) {
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
            {trend.up ? <ITrendUp /> : <ITrendDown />}{trend.value}
          </span>
        )}
      </div>
      {sub && <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export const Cards = { FeatureCard, InfoCard, CompactCard, StatCard, ActionCard };

export function ActionCard({ icon, title, description, ctaLabel, onAction, style }) {
  return (
    <div className="af-card af-card-action" style={{ ...CARD, padding: 18, display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <div style={{ font: "700 14.5px/20px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
      {description && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{description}</div>}
      <button type="button" onClick={onAction} style={{ marginTop: 4, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: "var(--radius-control)", border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13px/1 var(--font-sans)", cursor: "pointer" }}>
        {ctaLabel}<IArrow />
      </button>
    </div>
  );
}
