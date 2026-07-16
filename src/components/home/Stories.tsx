const STORIES = [
  { quote: "AfaqWay turned a mountain of paperwork into a simple checklist, I always knew the next step.", name: "Youssef A.", route: "Casablanca → TU Berlin", initials: "YA" },
  { quote: "Having a real person review my documents before submission gave me real confidence.", name: "Salma M.", route: "Rabat → Vilnius University", initials: "SM" },
  { quote: "The tracker kept every deadline in front of me. Nothing slipped, and I got in.", name: "Omar B.", route: "Marrakesh → TU Delft", initials: "OB" },
];

function MoroccoChip() {
  return (
    <span style={{ width: 16, height: 12, borderRadius: 2, background: "#C1272D", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)", flex: "none" }}>
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0A5C36" strokeWidth="0.8">
        <path d="M5 1.4 5.9 4 8.6 4 6.4 5.7 7.2 8.3 5 6.7 2.8 8.3 3.6 5.7 1.4 4 4.1 4Z" />
      </svg>
    </span>
  );
}

const eyebrow = { font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--indigo-600)" };

/* Slim band, story bars drift left → right. */
export default function Stories() {
  const items = [...STORIES, ...STORIES];
  return (
    <div style={{ background: "var(--card)", padding: "48px 0" }}>
      <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 28 }}>
        <div style={eyebrow}>Student stories</div>
        <h2 style={{ font: "700 var(--font-sans)", fontSize: "clamp(24px, 3vw, 32px)", lineHeight: 1.25, color: "var(--ink)", margin: "8px 0 0" }}>They made it. You can too.</h2>
      </div>
      <div className="af-marquee" style={{ position: "relative", overflow: "hidden", width: "100%" }}>
        <div className="af-marquee-track" style={{ display: "flex", alignItems: "stretch", gap: 20, width: "max-content", animation: "afMarquee 46s linear infinite" }}>
          {items.map((s, i) => (
            <div key={i} style={{ width: 380, background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, flex: "none", boxSizing: "border-box" }}>
              <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{s.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
                <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--indigo-100)", color: "var(--indigo-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--font-sans)", flex: "none" }}>{s.initials}</span>
                <div>
                  <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>
                    <MoroccoChip />
                    {s.route}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
