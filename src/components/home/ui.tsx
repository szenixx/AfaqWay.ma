import type { CSSProperties, ReactNode } from "react";
import { Circle, Plane, Clock3, Check, Compass, FileText, SquareCheckBig, CalendarDays, MessageCircle, Video, ArrowRight, Zap } from "lucide-react";

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

/* Unified icon set (Lucide). Same export names + { size } signature as before, so
   every homepage section keeps working; colour still inherits via currentColor. */
export const IconRing = ({ size = 22 }: { size?: number }) => <Circle size={size} />;
export const IconPlane = ({ size = 22 }: { size?: number }) => <Plane size={size} />;
export const IconClock = ({ size = 22 }: { size?: number }) => <Clock3 size={size} />;
export const IconCheck = ({ size = 22 }: { size?: number }) => <Check size={size} />;
export const IconCompass = ({ size = 22 }: { size?: number }) => <Compass size={size} />;
export const IconDoc = ({ size = 22 }: { size?: number }) => <FileText size={size} />;
export const IconTracker = ({ size = 22 }: { size?: number }) => <SquareCheckBig size={size} />;
export const IconCalendar = ({ size = 22 }: { size?: number }) => <CalendarDays size={size} />;
export const IconChat = ({ size = 22 }: { size?: number }) => <MessageCircle size={size} />;
export const IconVideo = ({ size = 22 }: { size?: number }) => <Video size={size} />;
export const IconArrow = ({ size = 22 }: { size?: number }) => <ArrowRight size={size} />;
export const IconSpark = ({ size = 22 }: { size?: number }) => <Zap size={size} />;

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
