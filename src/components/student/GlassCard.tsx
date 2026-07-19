import type { CSSProperties, ReactNode } from "react";

/* ============================================================================
   ⚠️  INTENTIONAL DESIGN-SYSTEM EXCEPTION — SCOPED TO THE STUDENT WORKSPACE
   ----------------------------------------------------------------------------
   The AfaqWay design system forbids gradients, textures, blur and transparency
   on product surfaces. This component deliberately breaks that rule: rounded,
   frosted "liquid glass" panels (iOS 26 style), used ONLY for the student
   workspace — the onboarding wizard, the dashboard, and future student pages.

   Do NOT use this in: /admin (flat + ambient background only, no blur on its
   cards), marketing/homepage pages (they use ds/Card), or any future
   document/product page outside the student app. Those stay 100% inside the
   strict DS: --paper/--card, no blur, per CLAUDE.md.

   Fonts and colors are untouched — same Poppins stack and ink/indigo palette
   as the rest of the DS. Only the panel material changes.
   ========================================================================== */

export const GLASS_BG = "rgba(255,255,255,.62)";
export const GLASS_BORDER = "1px solid rgba(255,255,255,.75)";
export const GLASS_BLUR = "blur(22px) saturate(1.6)";
export const GLASS_SHADOW = "0 12px 36px rgba(23,35,58,.16), inset 0 1px 0 rgba(255,255,255,.65)";
export const GLASS_RADIUS = 20;

export const glassPanelStyle: CSSProperties = {
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  WebkitBackdropFilter: GLASS_BLUR,
  border: GLASS_BORDER,
  borderRadius: GLASS_RADIUS,
  boxShadow: GLASS_SHADOW,
};

export function GlassCard({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ ...glassPanelStyle, padding: 24, ...style }}>
      {children}
    </div>
  );
}
