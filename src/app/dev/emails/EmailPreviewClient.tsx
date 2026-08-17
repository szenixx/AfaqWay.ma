"use client";

import { useMemo, useState } from "react";
import { PREVIEW_REGISTRY } from "@/lib/email/preview/registry";

const CATEGORY_LABEL: Record<string, string> = {
  auth: "Authentication",
  advisor: "Advisor",
  admin: "Admin",
  notifications: "Notifications",
  billing: "Billing",
};

export function EmailPreviewClient() {
  const [selected, setSelected] = useState(PREVIEW_REGISTRY[0]?.id ?? "");
  const [format, setFormat] = useState<"html" | "text">("html");

  const groups = useMemo(() => {
    const byCategory = new Map<string, typeof PREVIEW_REGISTRY>();
    for (const entry of PREVIEW_REGISTRY) {
      const list = byCategory.get(entry.meta.category) ?? [];
      list.push(entry);
      byCategory.set(entry.meta.category, list);
    }
    return [...byCategory.entries()];
  }, []);

  const entry = PREVIEW_REGISTRY.find((e) => e.id === selected);
  const src = entry ? `/dev/emails/${entry.id}${format === "text" ? "?format=text" : ""}` : "";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <aside style={{ width: 280, flex: "none", borderRight: "1px solid #DCE2EA", overflowY: "auto", padding: "20px 0" }}>
        <div style={{ padding: "0 20px 16px", fontSize: 13, fontWeight: 700, color: "#8695AB", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Email templates
        </div>
        {groups.map(([category, entries]) => (
          <div key={category} style={{ marginBottom: 18 }}>
            <div style={{ padding: "0 20px 6px", fontSize: 11, fontWeight: 700, color: "#8695AB", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {CATEGORY_LABEL[category] ?? category}
            </div>
            {entries.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelected(e.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "9px 20px",
                  border: "none", cursor: "pointer", fontSize: 13.5,
                  background: selected === e.id ? "var(--indigo-tint)" : "transparent",
                  color: selected === e.id ? "var(--indigo-text)" : "var(--ink)",
                  fontWeight: selected === e.id ? 700 : 500,
                }}
              >
                {e.label}
                <span style={{ display: "block", fontSize: 11, color: "#8695AB", fontWeight: 400 }}>
                  {e.meta.id} · v{e.meta.version}
                </span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #DCE2EA" }}>
          <div style={{ fontSize: 13.5, color: "#5A6B85" }}>
            {entry ? `${entry.label} — no email is sent by this page` : "Select a template"}
          </div>
          <div style={{ display: "inline-flex", background: "#F1F4F7", borderRadius: 10, padding: 3 }}>
            {(["html", "text"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                style={{
                  height: 28, padding: "0 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600,
                  background: format === f ? "#FFFFFF" : "transparent",
                  color: format === f ? "#17233A" : "#8695AB",
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {src && (
          <iframe key={src} src={src} title="Email preview" style={{ flex: 1, border: "none", background: format === "html" ? "#ECEFF3" : "#FFFFFF" }} />
        )}
      </main>
    </div>
  );
}
