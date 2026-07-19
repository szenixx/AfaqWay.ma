import type { ReactNode } from "react";
import { Icon } from "./Icon";

/* Ported verbatim from design/AfaqWay-Design-System/components/status/StatusBadge.jsx.
   The platform's one icon signature: a circle-housed status glyph. Closed set. */
export const STATUS = {
  "not-started": { label: "Not started", text: "var(--grey)", tint: "var(--grey-tint)", line: "var(--grey-line)", icon: "status-not-started" },
  applied: { label: "Applied", text: "var(--indigo-text)", tint: "var(--indigo-tint)", line: "var(--indigo-line)", icon: "status-applied" },
  "under-review": { label: "Under review", text: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)", icon: "status-under-review" },
  "needs-changes": { label: "Needs changes", text: "var(--red)", tint: "var(--red-tint)", line: "var(--red-line)", icon: "status-needs-changes" },
  approved: { label: "Approved", text: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)", icon: "status-approved" },
} as const;

export type StatusName = keyof typeof STATUS;

export function StatusBadge({ status = "not-started", size = 32, label, caption }: { status?: StatusName; size?: number; label?: ReactNode; caption?: ReactNode }) {
  const s = STATUS[status] ?? STATUS["not-started"];
  const badge = (
    <span style={{ width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", background: s.tint, color: s.text, border: "1.5px solid " + s.line }}>
      <Icon name={s.icon} size={Math.round(size * 0.62)} />
    </span>
  );
  if (!label) return badge;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      {badge}
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ font: "500 13.5px/20px var(--font-sans)", color: "var(--ink)" }}>{label}</span>
        {caption ? <span style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>{caption}</span> : null}
      </span>
    </span>
  );
}
