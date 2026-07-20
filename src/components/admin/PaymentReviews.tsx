"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { planById, methodById } from "@/lib/plans";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { fileUrl } from "@/lib/r2";

type Payment = { id: string; user_id: string; plan: string; amount: number; currency: string; method: string; status: string; receipt_path: string | null; reference: string | null; rejection_comment: string | null; created_at: string; reviewed_at: string | null };
type UserInfo = { full_name: string | null; email: string | null; destination_country: string | null };

function Stat({ label, value, tone, icon }: { label: string; value: number; tone?: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 140, border: "1px solid var(--line)", borderRadius: 18, background: "var(--card)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-card)" }}>
      <span style={{ width: 38, height: 38, borderRadius: 14, background: "var(--indigo-tint)", color: tone ?? "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{icon}</span>
      <div>
        <div style={{ font: "700 22px/26px var(--font-sans)", color: tone ?? "var(--ink)" }}>{value}</div>
        <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}
const rIcon = (d: React.ReactNode) => <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

export default function PaymentReviews({ highlightId, onHighlightDone }: { highlightId?: string | null; onHighlightDone?: () => void } = {}) {
  const [all, setAll] = useState<Payment[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [query, setQuery] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");
  const [since, setSince] = useState(0);
  const [countryFilter, setCountryFilter] = useState<"all" | string>("all");
  const [planFilter, setPlanFilter] = useState<"all" | "self_service" | "full_service">("all");
  const [viewer, setViewer] = useState<{ url: string; pdf: boolean } | null>(null);
  const [askReset, setAskReset] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select("id, user_id, plan, amount, currency, method, status, receipt_path, reference, rejection_comment, created_at, reviewed_at").order("created_at", { ascending: false });
    const list = (data ?? []) as Payment[];
    setAll(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email, destination_country").in("id", ids);
      const map: Record<string, UserInfo> = {};
      (profs ?? []).forEach((p) => { const r = p as { id: string; full_name: string | null; email: string | null; destination_country: string | null }; map[r.id] = { full_name: r.full_name, email: r.email, destination_country: r.destination_country }; });
      setUsers(map);
    }
    setLoading(false);
    loadedOnce.current = true;
  }, []);
  useEffect(() => { void load(); }, [load]);

  // A7: a report's "Check" jumps here and flashes the matching payment row.
  useEffect(() => {
    if (!highlightId || !loadedOnce.current) return;
    const pay = all.find((r) => r.id === highlightId);
    if (!pay) return;
    setTab(pay.status === "under_review" ? "pending" : "history");
    setCountryFilter("all"); setPlanFilter("all"); setQuery("");
    setFlashId(highlightId);
    const t1 = setTimeout(() => { document.getElementById(`pay-${highlightId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
    const t2 = setTimeout(() => { setFlashId(null); onHighlightDone?.(); }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [highlightId, all, onHighlightDone]);

  const stats = useMemo(() => {
    const after = (t: string | null) => !since || (t ? new Date(t).getTime() >= since : false);
    return {
      pending: all.filter((r) => r.status === "under_review" && after(r.created_at)).length,
      approved: all.filter((r) => r.status === "approved" && after(r.reviewed_at)).length,
      rejected: all.filter((r) => r.status === "rejected" && after(r.reviewed_at)).length,
    };
  }, [all, since]);

  const list = useMemo(() => {
    const base = all.filter((r) =>
      (tab === "pending" ? r.status === "under_review" : r.status !== "under_review")
      && (countryFilter === "all" || users[r.user_id]?.destination_country === countryFilter)
      && (planFilter === "all" || r.plan === planFilter));
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) => (r.reference ?? "").toLowerCase().includes(q) || (users[r.user_id]?.email ?? "").toLowerCase().includes(q) || (users[r.user_id]?.full_name ?? "").toLowerCase().includes(q));
  }, [all, tab, query, users, countryFilter, planFilter]);

  async function viewReceipt(path: string | null) {
    if (!path) return;
    const url = await fileUrl(path, "receipts");
    if (url) setViewer({ url, pdf: /\.pdf$/i.test(path) });
  }
  async function decide(r: Payment, status: "approved" | "rejected") {
    setBusy(r.id);
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id };
    if (status === "rejected") {
      patch.rejection_comment = comment.trim() || "Your receipt could not be verified.";
      if (r.receipt_path) { if (!r.receipt_path.startsWith("r2:")) await supabase.storage.from("receipts").remove([r.receipt_path]); patch.receipt_path = null; } // reject = delete now (R2 objects expire unused)
    }
    await supabase.from("payments").update(patch).eq("id", r.id);
    setBusy(""); setRejectId(null); setComment("");
    void load();
  }

  const statusPill = (s: string) => s === "approved" ? "pill pill-green" : s === "rejected" ? "pill pill-red" : s === "cancelled" ? "pill pill-grey" : "pill pill-amber";
  const statusLabel = (s: string) => s === "under_review" ? "Under review" : s.charAt(0).toUpperCase() + s.slice(1);
  const statusIcon = (s: string) => {
    const P = { width: 12, height: 12, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (s === "approved") return <svg {...P}><circle cx="10" cy="10" r="7.5" /><path d="M6.5 10.5 9 13l4.5-5" /></svg>;
    if (s === "rejected") return <svg {...P}><circle cx="10" cy="10" r="7.5" /><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" /></svg>;
    if (s === "cancelled") return <svg {...P}><circle cx="10" cy="10" r="7.5" /><path d="M6.5 6.5l7 7" /></svg>;
    return <svg {...P}><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4.3l2.8 1.6" /></svg>;
  };
  const badge = (cls: string, children: React.ReactNode) => <span className={cls} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Payment reviews</h1>
        <button type="button" onClick={() => setAskReset(true)} title="Reset the statistics counters" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4v4h-4M4 16v-4h4" /><path d="M15.5 8a6 6 0 0 0-11-1M4.5 12a6 6 0 0 0 11 1" /></svg>
          Reset stats
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <Stat label="Pending" value={stats.pending} tone="var(--amber)" icon={rIcon(<><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></>)} />
        <Stat label="Approved" value={stats.approved} tone="var(--green)" icon={rIcon(<><circle cx="10" cy="10" r="7" /><path d="M7 10l2 2 4-4" /></>)} />
        <Stat label="Rejected" value={stats.rejected} tone="var(--red)" icon={rIcon(<><circle cx="10" cy="10" r="7" /><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" /></>)} />
        <Stat label="Processed" value={stats.approved + stats.rejected} icon={rIcon(<><path d="M4 10h12M10 4v12" /></>)} />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "inline-flex", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 14, padding: 3 }}>
          {(["pending", "history"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ height: 34, padding: "0 16px", borderRadius: 11, border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--ink)" : "var(--ink-soft)", boxShadow: tab === t ? "var(--shadow-card)" : "none" }}>{t === "pending" ? "Pending" : "History"}</button>
          ))}
        </div>
        <input className="af" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by payment ID, name or email" style={{ flex: "1 1 220px", maxWidth: 340 }} />
        <select className="af" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPlanFilter("all"); }} style={{ height: 40, maxWidth: 180 }}>
          <option value="all">All countries</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        {countryFilter !== "all" && (
          <select className="af" value={planFilter} onChange={(e) => setPlanFilter(e.target.value as "all" | "self_service" | "full_service")} style={{ height: 40, maxWidth: 190 }}>
            <option value="all">All {countryByCode(countryFilter)?.name ?? ""} plans</option>
            <option value="self_service">Self Service</option>
            <option value="full_service">Full Service</option>
          </select>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-faint)", font: "400 14px var(--font-sans)" }}>Loading…</p>
      ) : list.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 16, padding: 28, textAlign: "center", color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>{tab === "pending" ? "No pending payments right now." : "No processed payments yet."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((r) => {
            const u = users[r.user_id];
            const plan = planById(r.plan);
            const method = methodById(r.method);
            const flash = flashId === r.id;
            return (
              <div key={r.id} id={`pay-${r.id}`} style={{ border: `1px solid ${flash ? "var(--indigo-600)" : "var(--line)"}`, borderRadius: 18, background: flash ? "var(--indigo-tint)" : "var(--card)", padding: 18, boxShadow: flash ? "0 0 0 4px var(--indigo-tint)" : "var(--shadow-card)", transition: "background 500ms ease, border-color 500ms ease, box-shadow 500ms ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ font: "600 15px/21px var(--font-sans)", color: "var(--ink)" }}>{u?.full_name || "Unnamed user"}</div>
                    <div style={{ font: "400 13px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{u?.email || r.user_id}</div>
                    {r.reference && <div style={{ font: "600 11px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>ID {r.reference}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", height: "fit-content" }}>
                    <span className="pill pill-indigo">{plan?.name ?? r.plan}</span>
                    <span className="pill pill-grey">{r.amount.toLocaleString("en-US")} {r.currency === "MAD" ? "DH" : r.currency}</span>
                    <span className="pill pill-grey">{method?.name ?? r.method}</span>
                    {badge(statusPill(r.status), <>{statusIcon(r.status)}{statusLabel(r.status)}</>)}
                  </div>
                </div>
                <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 8 }}>Submitted {new Date(r.created_at).toLocaleString()}{r.reviewed_at ? ` · reviewed ${new Date(r.reviewed_at).toLocaleString()}` : ""}</div>
                {r.status === "rejected" && r.rejection_comment && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--red)", marginTop: 6 }}>Reason: {r.rejection_comment}</div>}

                {tab === "pending" && (rejectId === r.id ? (
                  <div style={{ marginTop: 14 }}>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason shown to the user (e.g. amount doesn't match, receipt unreadable)…" rows={3} className="af" style={{ width: "100%", resize: "vertical", font: "400 13px/20px var(--font-sans)" }} />
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" onClick={() => { setRejectId(null); setComment(""); }} style={btnGhost}>Cancel</button>
                      <button type="button" disabled={busy === r.id} onClick={() => decide(r, "rejected")} style={btnRed}>Confirm reject</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => viewReceipt(r.receipt_path)} disabled={!r.receipt_path} style={{ ...btnGhost, opacity: r.receipt_path ? 1 : 0.5 }}>View receipt</button>
                    <button type="button" onClick={() => setRejectId(r.id)} style={btnRedGhost}>Reject</button>
                    <button type="button" disabled={busy === r.id} onClick={() => decide(r, "approved")} style={btnPrimary}>{busy === r.id ? "…" : "Approve"}</button>
                  </div>
                ))}
                {tab === "history" && r.receipt_path && (
                  <div style={{ marginTop: 14 }}><button type="button" onClick={() => viewReceipt(r.receipt_path)} style={btnGhost}>View receipt</button></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,35,58,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 860, height: "88vh", background: "var(--card)", borderRadius: 18, boxShadow: "0 24px 70px rgba(23,35,58,.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Receipt</span>
              <button type="button" onClick={() => setViewer(null)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 999, border: "none", cursor: "pointer", background: "var(--subtle)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: "var(--subtle)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
              {viewer.pdf
                ? <iframe src={viewer.url} title="Receipt" style={{ width: "100%", height: "100%", border: "none" }} />
                /* eslint-disable-next-line @next/next/no-img-element */
                : <img src={viewer.url} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
            </div>
          </div>
        </div>
      )}

      {askReset && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", padding: 24 }}>
            <h2 style={{ font: "700 17px/23px var(--font-sans)", color: "var(--ink)", margin: "0 0 8px" }}>Reset the statistics?</h2>
            <p style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink-soft)", margin: 0 }}>The counters go back to zero from now on. Your pending and history of requests are kept.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setAskReset(false)} style={{ height: 40, padding: "0 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "var(--ink)" }}>Cancel</button>
              <button type="button" onClick={() => { setSince(Date.now()); setAskReset(false); }} style={{ height: 40, padding: "0 16px", borderRadius: 14, border: "none", background: "var(--indigo-600)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "#fff" }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const base = { height: 40, padding: "0 16px", borderRadius: 14, cursor: "pointer", font: "600 13.5px/1 var(--font-sans)" } as const;
const btnPrimary = { ...base, border: "none", background: "var(--indigo-600)", color: "#fff" };
const btnGhost = { ...base, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" };
const btnRed = { ...base, border: "none", background: "var(--red)", color: "#fff" };
const btnRedGhost = { ...base, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)" };
