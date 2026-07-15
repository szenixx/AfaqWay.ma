const STATS = [
  { value: "4", label: "European destinations", note: "Lithuania open today" },
  { value: "24/7", label: "Support", note: "Real humans, not a bot" },
  { value: "48h", label: "Avg. document review", note: "By a human expert" },
  { value: "85%+", label: "Visa approved", note: "Depends on your documents" },
];

/* Slim marquee band — stats drift left → right like the hero trust strip. */
export default function Statistics() {
  const items = [...STATS, ...STATS];
  return (
    <div style={{ background: "var(--card)", padding: "32px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="af-marquee" style={{ position: "relative", overflow: "hidden", width: "100%" }}>
        <div className="af-marquee-track" style={{ display: "flex", alignItems: "center", gap: 56, width: "max-content", animation: "afMarquee 34s linear infinite" }}>
          {items.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ font: "700 40px/1 var(--font-sans)", color: "var(--indigo-600)", letterSpacing: "-0.01em" }}>{s.value}</span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ font: "600 14px/18px var(--font-sans)", color: "var(--ink)", whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)", whiteSpace: "nowrap" }}>{s.note}</span>
              </span>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--line)", marginLeft: 40 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
