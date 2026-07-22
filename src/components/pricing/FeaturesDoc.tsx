"use client";

import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import { Ban, Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

/* Full-screen "document" comparing both plans in detail. Page 1 = English,
   page 2 = Arabic (meaning-based, not literal). Opened from the plan cards'
   "See all features" action; closed with the top-right button. */

function Tick({ ar }: { ar?: boolean }) {
  return (
    <span aria-hidden style={{ flex: "none", width: 18, height: 18, borderRadius: 999, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, marginLeft: ar ? 8 : 0, marginRight: ar ? 0 : 8 }}>
      <Check size={11} />
    </span>
  );
}

function Panel({ name, tagline, items, ar }: { name: string; tagline: string; items: string[]; ar?: boolean }) {
  return (
    <div>
      <div style={{ font: "700 16px/22px var(--font-sans)", color: "var(--ink)" }}>{name}</div>
      <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)", margin: "2px 0 12px" }}>{tagline}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((f, i) => (
          <li key={i} style={{ display: "flex", flexDirection: ar ? "row-reverse" : "row", gap: 0, font: "400 12.5px/18px var(--font-sans)", color: "var(--ink)", textAlign: ar ? "right" : "left" }}>
            <Tick ar={ar} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocPage({ ar }: { ar?: boolean }) {
  const [self, full] = PLANS;
  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "32px 36px", marginBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <LogoMark size={30} />
          <span style={{ font: "700 22px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span>
        </div>
        <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8 }}>
          {ar ? "مقارنة تفصيلية بين الخطتين" : "Your plans, compared in full detail"}
        </div>
      </div>
      <div style={{ height: 1, background: "var(--line-soft)", marginBottom: 22 }} />
      <div className="af-doc-cols">
        <Panel name={self.name} tagline={ar ? "أنت تقود، ونحن نوجّهك." : self.tagline} items={ar ? self.featuresAr : self.features} ar={ar} />
        <Panel name={full.name} tagline={ar ? "نحن نتولّى كل شيء، وأنت تتابع فقط." : full.tagline} items={ar ? full.featuresAr : full.features} ar={ar} />
      </div>
    </div>
  );
}

export default function FeaturesDoc({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(23,35,58,.55)", overflowY: "auto", padding: "48px 16px" }}>
      <button type="button" onClick={onClose} aria-label="Close" style={{ position: "fixed", top: 16, right: 16, zIndex: 101, width: 40, height: 40, borderRadius: 999, border: "none", cursor: "pointer", background: "var(--card)", boxShadow: "var(--shadow-card)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ban size={20} />
      </button>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <DocPage />
        <DocPage ar />
      </div>
    </div>
  );
}
