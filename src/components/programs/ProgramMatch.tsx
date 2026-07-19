"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/ds";
import { PROGRAMS } from "@/lib/programs/catalog";
import { recommend } from "@/lib/programs/engine";
import type { Program, Recommendation, StudentProfile } from "@/lib/programs/types";

/* Program Setup — "Path" section. Help-me-choose = ranked matches (with status).
   I-know-the-program = free search + shuffled suggestions, NO match status. */

const MAX_RESULTS = 12;
const MAX_PICKS = 3;

function scoreColor(score: number, perfect: boolean) {
  if (perfect) return { bg: "var(--green-tint)", fg: "var(--green)", bd: "var(--green-line)" };
  if (score >= 70) return { bg: "var(--indigo-tint)", fg: "var(--indigo-text)", bd: "var(--indigo-line)" };
  return { bg: "var(--amber-tint)", fg: "var(--amber)", bd: "var(--amber-line)" };
}

function PickBtn({ picked, order, canAdd, onToggle, small }: { picked: boolean; order: number; canAdd: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <button type="button" onClick={onToggle} disabled={!picked && !canAdd}
      style={{ flex: "none", height: small ? 30 : 34, padding: small ? "0 11px" : "0 14px", borderRadius: 999, cursor: !picked && !canAdd ? "not-allowed" : "pointer", font: `600 ${small ? 12 : 13}px/1 var(--font-sans)`, border: picked ? "none" : "1px solid var(--indigo-line)", background: picked ? "var(--indigo-600)" : "transparent", color: picked ? "#fff" : "var(--indigo-600)", opacity: !picked && !canAdd ? 0.45 : 1 }}>
      {picked ? `#${order}` : "Select"}
    </button>
  );
}

// Ranked card (help path) — keeps the % match status.
function ProgramCard({ rec, order, canAdd, onToggle }: { rec: Recommendation; order: number; canAdd: boolean; onToggle: () => void }) {
  const p = rec.program;
  const c = scoreColor(rec.score, rec.perfect);
  const picked = order > 0;
  return (
    <div style={{ border: picked ? "1.5px solid var(--indigo-line)" : "1px solid var(--line)", borderRadius: 12, background: picked ? "var(--indigo-tint)" : "var(--card)", padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "600 14px/19px var(--font-sans)", color: "var(--ink)" }}>{p.name}</div>
          <div style={{ font: "400 12.5px/17px var(--font-sans)", color: "var(--ink-soft)", marginTop: 1 }}>{p.university}</div>
        </div>
        <span style={{ flex: "none", font: "600 11.5px/1 var(--font-sans)", color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 999, padding: "5px 9px" }}>
          {rec.perfect ? "Perfect match" : `${rec.score}% match`}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
        <span className="pill pill-grey">{p.degree}</span>
        <span className="pill pill-grey">{p.field}</span>
        {p.tuition_eur != null && <span className="pill pill-grey">€{p.tuition_eur.toLocaleString("en-US")}/yr</span>}
        {p.intake && <span className="pill pill-grey">{p.intake}</span>}
      </div>
      {rec.reasons.length > 0 && (
        <ul style={{ listStyle: "none", margin: "9px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          {rec.reasons.map((r, i) => (
            <li key={i} style={{ display: "flex", gap: 8, font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}><span aria-hidden style={{ flex: "none", marginTop: 6, width: 6, height: 6, borderRadius: 999, background: "var(--amber)" }} />{r.text}</li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}><PickBtn picked={picked} order={order} canAdd={canAdd} onToggle={onToggle} /></div>
    </div>
  );
}

// Slim row (know path) — no status, one clean line, university clearly visible.
function SlimCard({ p, order, canAdd, onToggle }: { p: Program; order: number; canAdd: boolean; onToggle: () => void }) {
  const picked = order > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, border: picked ? "1.5px solid var(--indigo-line)" : "1px solid var(--line)", borderRadius: 10, background: picked ? "var(--indigo-tint)" : "var(--card)", padding: "9px 12px" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ font: "600 13.5px/18px var(--font-sans)", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ display: "flex", gap: 8, font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: "var(--indigo-600)", fontWeight: 600 }}>{p.university}</span>
          <span aria-hidden>·</span><span>{p.field}</span>
          <span aria-hidden>·</span><span>{p.degree}</span>
          {p.tuition_eur != null && <><span aria-hidden>·</span><span>€{p.tuition_eur.toLocaleString("en-US")}/yr</span></>}
        </div>
      </div>
      <PickBtn picked={picked} order={order} canAdd={canAdd} onToggle={onToggle} small />
    </div>
  );
}

export default function ProgramMatch({ profile, selected, onSelect }: { profile: StudentProfile; selected: number[]; onSelect: (ids: number[]) => void }) {
  const [path, setPath] = useState<"help" | "know">("help");
  const [query, setQuery] = useState("");

  const ready = profile.fields.length > 0 && profile.maxBudget != null;
  const ranked = useMemo(() => (ready ? recommend(profile, PROGRAMS) : []), [profile, ready]);
  const perfectCount = ranked.filter((r) => r.perfect).length;
  const shown = ranked.slice(0, MAX_RESULTS);
  const byId = useMemo(() => new Map(PROGRAMS.map((p) => [p.id, p])), []);

  // free-text search across name / field / university (know path)
  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PROGRAMS.filter((p) => `${p.name} ${p.field} ${p.university}`.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query]);
  // shuffled suggestions — different order each time the know path is opened
  const suggestions = useMemo(() => [...PROGRAMS].sort(() => Math.random() - 0.5).slice(0, 8), [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => {
    if (selected.includes(id)) onSelect(selected.filter((x) => x !== id));
    else if (selected.length < MAX_PICKS) onSelect([...selected, id]);
  };
  const orderOf = (id: number) => selected.indexOf(id) + 1;
  const canAdd = selected.length < MAX_PICKS;

  return (
    <div>
      <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Find your program</div>
      <div style={{ font: "600 18px/24px var(--font-sans)", color: "var(--ink)", margin: "4px 0 6px" }}>How do you want to pick?</div>
      <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 16px" }}>Pick up to {MAX_PICKS} programs in the order you prefer. We&apos;ll build your roadmap around them.</p>

      <div role="radiogroup" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {([["help", "Help me choose"], ["know", "I know the program"]] as const).map(([v, label]) => {
          const active = path === v;
          return (
            <button key={v} type="button" role="radio" aria-checked={active} onClick={() => setPath(v)}
              style={{ flex: "1 1 0", height: 46, borderRadius: 12, cursor: "pointer", font: "600 14px/1 var(--font-sans)", border: active ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: active ? "var(--indigo-tint)" : "var(--card)", color: active ? "var(--indigo-text)" : "var(--ink)" }}>
              {label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{ background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-text)", marginBottom: 6 }}>Your choices ({selected.length}/{MAX_PICKS})</div>
          <ol style={{ margin: 0, paddingLeft: 18, font: "400 13px/20px var(--font-sans)", color: "var(--ink)" }}>
            {selected.map((id) => <li key={id}>{byId.get(id)?.name ?? id}</li>)}
          </ol>
        </div>
      )}

      {path === "help" ? (
        !ready ? (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: 20, textAlign: "center", font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)" }}>Fill in your field of interest and budget above to see matched programs.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)" }}>
              {perfectCount > 0 ? `${perfectCount} perfect ${perfectCount === 1 ? "match" : "matches"}, then your ` : "No exact match yet, but here are your "}
              closest programs, ranked. Showing top {Math.min(MAX_RESULTS, ranked.length)} of {ranked.length}.
            </div>
            {shown.map((r) => <ProgramCard key={r.program.id} rec={r} order={orderOf(r.program.id)} canAdd={canAdd} onToggle={() => toggle(r.program.id)} />)}
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Field label="Search programs" placeholder="Search by name, field, or university" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.trim() ? (
            searchHits.length === 0
              ? <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-faint)", marginTop: 4 }}>No program matches “{query}”.</div>
              : searchHits.map((p) => <SlimCard key={p.id} p={p} order={orderOf(p.id)} canAdd={canAdd} onToggle={() => toggle(p.id)} />)
          ) : (
            <>
              <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-faint)", margin: "4px 0 2px" }}>Suggestions for you</div>
              {suggestions.map((p) => <SlimCard key={p.id} p={p} order={orderOf(p.id)} canAdd={canAdd} onToggle={() => toggle(p.id)} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
