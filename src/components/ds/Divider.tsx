/* Not in the DS as a named component, built from tokens only: a 1px --line rule,
   optional centered uppercase label (section-eyebrow style). */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div style={{ height: 1, background: "var(--line)" }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}
