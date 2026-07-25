"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input, Toggle, fieldIcon } from "@/components/ds";
import { PAY_METHODS, methodById } from "@/lib/plans";

type Extra = { title: string; value: string; copyable: boolean };
type PM = { id: string; enabled: boolean; beneficiary: string | null; rib: string | null; note: string | null; sort: number; extra_details: Extra[] };


function MethodRow({ pm, onSaved }: { pm: PM; onSaved: () => void }) {
  const meta = methodById(pm.id);
  const [beneficiary, setBeneficiary] = useState(pm.beneficiary ?? "");
  const [rib, setRib] = useState(pm.rib ?? "");
  const [note, setNote] = useState(pm.note ?? "");
  const [extra, setExtra] = useState<Extra[]>(Array.isArray(pm.extra_details) ? pm.extra_details : []);
  const [enabled, setEnabled] = useState(pm.enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(next?: Partial<PM>) {
    setSaving(true); setSaved(false);
    const payload = { beneficiary: beneficiary.trim() || null, rib: rib.trim() || null, note: note.trim() || null, enabled, extra_details: extra.filter((e) => e.title.trim() || e.value.trim()), updated_at: new Date().toISOString(), ...next };
    await supabase.from("payment_methods").update(payload).eq("id", pm.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
    onSaved();
  }
  async function toggle() { const v = !enabled; setEnabled(v); await save({ enabled: v }); }
  const setEx = (i: number, p: Partial<Extra>) => setExtra(extra.map((e, j) => j === i ? { ...e, ...p } : e));

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)", padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {meta && <img src={meta.logoSrc} alt="" style={{ maxWidth: 34, maxHeight: 34, objectFit: "contain" }} />}
          </span>
          <div>
            <div style={{ font: "600 15px/21px var(--font-sans)", color: "var(--ink)" }}>{meta?.name ?? pm.id}</div>
            <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{meta?.kind === "manual" ? "Manual transfer" : "Instant"}</div>
          </div>
        </div>
        <Toggle checked={enabled} onChange={() => void toggle()} ariaLabel={`${meta?.name ?? pm.id} enabled`}
          label={<span style={{ font: "600 12.5px/1 var(--font-sans)", color: enabled ? "var(--green)" : "var(--ink-faint)" }}>{enabled ? "On" : "Off"}</span>} />
      </div>

      {meta?.kind === "manual" && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Beneficiary" icon={fieldIcon("name")} value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
            <Input label="RIB" icon={fieldIcon("reference")} value={rib} onChange={(e) => setRib(e.target.value)} />
          </div>
          <Input label="Note (optional)" icon={fieldIcon("note")} value={note} onChange={(e) => setNote(e.target.value)} />

          <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 4 }}>Extra details</div>
          {extra.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Input icon={fieldIcon("text")} value={e.title} onChange={(ev) => setEx(i, { title: ev.target.value })} placeholder="Title" containerStyle={{ flex: "1 1 120px" }} />
              <Input icon={fieldIcon("note")} value={e.value} onChange={(ev) => setEx(i, { value: ev.target.value })} placeholder="Detail" containerStyle={{ flex: "2 1 160px" }} />
              <Toggle checked={e.copyable} onChange={(v) => setEx(i, { copyable: v })} ariaLabel="Copyable detail"
                label={<span style={{ font: "600 12px/1 var(--font-sans)", color: e.copyable ? "var(--green)" : "var(--ink-faint)" }}>Copy {e.copyable ? "on" : "off"}</span>} />
              <button type="button" onClick={() => setExtra(extra.filter((_, j) => j !== i))} style={{ height: 38, width: 38, borderRadius: 13, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setExtra([...extra, { title: "", value: "", copyable: true }])} style={{ alignSelf: "flex-start", height: 34, padding: "0 12px", borderRadius: 13, border: "1px dashed var(--line)", background: "var(--card)", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", color: "var(--indigo-600)" }}>+ Add detail</button>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center", marginTop: 4 }}>
            {saved && <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--green)" }}>Saved</span>}
            <button type="button" disabled={saving} onClick={() => save()} style={{ height: 38, padding: "0 16px", borderRadius: 14, border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", background: "var(--indigo-600)", color: "#fff" }}>{saving ? "Saving…" : "Save details"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentMethodsAdmin() {
  const [rows, setRows] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_methods").select("id, enabled, beneficiary, rib, note, sort, extra_details").order("sort", { ascending: true });
    const dbRows = ((data ?? []) as PM[]).map((r) => ({ ...r, extra_details: Array.isArray(r.extra_details) ? r.extra_details : [] }));
    const known = new Set(dbRows.map((r) => r.id));
    const extra = PAY_METHODS.filter((m) => !known.has(m.id)).map((m, i) => ({ id: m.id, enabled: m.available, beneficiary: m.account?.beneficiary ?? null, rib: m.account?.rib ?? null, note: m.account?.note ?? null, sort: 100 + i, extra_details: [] }));
    setRows([...dbRows, ...extra]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: "0 0 4px" }}>Payment methods</h1>
      <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 20px" }}>Turn methods on or off, edit account details, and add custom detail rows (each can be copyable). Changes apply to checkout immediately.</p>
      {loading ? <p style={{ color: "var(--ink-faint)", font: "400 14px var(--font-sans)" }}>Loading…</p> : (
        <div className="af-method-grid">
          {rows.map((pm) => <MethodRow key={pm.id} pm={pm} onSaved={load} />)}
        </div>
      )}
    </div>
  );
}
