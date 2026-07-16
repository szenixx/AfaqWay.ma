import type { CSSProperties, ReactNode } from "react";

/* Shared homepage primitives, all values come from the design-system tokens. */

export function Container({
  children,
  width = 1200,
  style,
}: {
  children: ReactNode;
  width?: number;
  style?: CSSProperties;
}) {
  return <div style={{ maxWidth: width, margin: "0 auto", ...style }}>{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <>
      <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--indigo-600)", textAlign: "center" }}>
        {eyebrow}
      </div>
      <h2 style={{ font: "700 34px/42px var(--font-sans)", color: "var(--ink)", textAlign: "center", margin: "12px 0 0" }}>
        {title}
      </h2>
      {sub && (
        <p style={{ font: "400 15px/24px var(--font-sans)", color: "var(--ink-soft)", textAlign: "center", margin: "12px 0 0" }}>
          {sub}
        </p>
      )}
    </>
  );
}

/* Circle-housed status badge, the DS's one icon signature. */
export type Tone = "grey" | "indigo" | "amber" | "green" | "red";
const TONES: Record<Tone, { tint: string; line: string; color: string }> = {
  grey: { tint: "var(--grey-tint)", line: "var(--grey-line)", color: "var(--grey)" },
  indigo: { tint: "var(--indigo-tint)", line: "var(--indigo-line)", color: "var(--indigo-600)" },
  amber: { tint: "var(--amber-tint)", line: "var(--amber-line)", color: "var(--amber)" },
  green: { tint: "var(--green-tint)", line: "var(--green-line)", color: "var(--green)" },
  red: { tint: "var(--red-tint)", line: "var(--red-line)", color: "var(--red)" },
};

export function StatusCircle({ size, tone, children }: { size: number; tone: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span style={{ width: size, height: size, borderRadius: 999, background: t.tint, border: `1.5px solid ${t.line}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: t.color, flex: "none", boxSizing: "border-box" }}>
      {children}
    </span>
  );
}

/* Outline glyphs, DS: 1.75px stroke, rounded caps/joins, 20x20 grid. */
function Glyph({ size = 22, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const IconRing = ({ size }: { size?: number }) => <Glyph size={size}><circle cx="10" cy="10" r="7" /></Glyph>;
export const IconPlane = ({ size }: { size?: number }) => <Glyph size={size}><path d="M17.5 2.5 2 9.6l6 2.3 2.3 6L17.5 2.5Z" /><path d="M10.3 11.9 13.7 8.5" /></Glyph>;
export const IconClock = ({ size }: { size?: number }) => <Glyph size={size}><circle cx="10" cy="10" r="7" /><path d="M10 6.5v3.7l2.6 1.7" /></Glyph>;
export const IconCheck = ({ size }: { size?: number }) => <Glyph size={size}><path d="M7 10.3 9.2 12.5 13.3 7.8" /></Glyph>;
export const IconCompass = ({ size }: { size?: number }) => <Glyph size={size}><circle cx="10" cy="10" r="7" /><path d="M12.8 7.2 11.2 11.2 7.2 12.8 8.8 8.8Z" /></Glyph>;
export const IconDoc = ({ size }: { size?: number }) => <Glyph size={size}><path d="M6 2.5h6l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" /><path d="M12 2.5V6h3.5" /></Glyph>;
export const IconTracker = ({ size }: { size?: number }) => <Glyph size={size}><rect x="3.5" y="3.5" width="13" height="13" rx="3" /><path d="M7 10.3 9.2 12.5 13.3 7.8" /></Glyph>;
export const IconCalendar = ({ size }: { size?: number }) => <Glyph size={size}><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14M7 2.5v3M13 2.5v3" /></Glyph>;
export const IconChat = ({ size }: { size?: number }) => <Glyph size={size}><path d="M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /></Glyph>;
export const IconVideo = ({ size }: { size?: number }) => <Glyph size={size}><rect x="3" y="4.5" width="14" height="11" rx="2" /><path d="M9 8.2v3.6l3-1.8Z" /></Glyph>;
export const IconArrow = ({ size }: { size?: number }) => <Glyph size={size}><path d="M4 10h12M11 5l5 5-5 5" /></Glyph>;

/* CSS tricolor flags, real flags, never recoloured (DS exception). */
export const FLAGS: Record<string, string> = {
  Lithuania: "linear-gradient(#FDB913 0 33.33%, #006A44 33.33% 66.66%, #C1272D 66.66%)",
  Germany: "linear-gradient(#111 0 33.33%, #DD0000 33.33% 66.66%, #FFCE00 66.66%)",
  Poland: "linear-gradient(#fff 0 50%, #DC143C 50%)",
  Russia: "linear-gradient(#fff 0 33.33%, #0039A6 33.33% 66.66%, #D52B1E 66.66%)",
  Hungary: "linear-gradient(#CD2A3E 0 33.33%, #fff 33.33% 66.66%, #436F4D 66.66%)",
  Latvia: "linear-gradient(#9E3039 0 40%, #fff 40% 60%, #9E3039 60%)",
};

export function Flag({ country, open }: { country: string; open?: boolean }) {
  return (
    <div
      style={{
        width: 42,
        height: 30,
        borderRadius: 5,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
        background: FLAGS[country] ?? "var(--grey-tint)",
        filter: open ? "none" : "grayscale(.55) opacity(.72)",
        flex: "none",
      }}
    />
  );
}
