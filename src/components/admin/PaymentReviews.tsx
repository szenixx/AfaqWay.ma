"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, CircleX, RotateCcw, RotateCw, ShieldCheck, Wallet, X, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Loader, Pill, Status, ImageZoom, Portal, type StatusState } from "@/components/ds";
import { planById, methodById } from "@/lib/plans";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { fileUrl, deleteUserFile } from "@/lib/storage/client";
import { Input, Select, MetricCard, trendBadge, fieldIcon } from "@/components/ds";

type Payment = { id: string; user_id: string; plan: string; amount: number; currency: string; method: string; status: string; receipt_path: string | null; reference: string | null; rejection_comment: string | null; created_at: string; reviewed_at: string | null };
/* Session-stable clock for the 30/60-day trend windows: the comparison must
   not shift between renders, and it keeps render pure. */
const NOW = Date.now();

type UserInfo = { full_name: string | null; email: string | null; destination_country: string | null };


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
  /* Zoom and rotation for the receipt viewer, reset each time it opens. */
  const [viewZoom, setViewZoom] = useState(1);
  const [viewRot, setViewRot] = useState(0);
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
    const now = NOW, day = 86_400_000;
    /* Trend = the last 30 days against the 30 before them. */
    const window = (rows: Payment[], field: "created_at" | "reviewed_at", from: number, to: number) =>
      rows.filter((r) => { const v = r[field] ? new Date(r[field] as string).getTime() : 0; return v >= from && v < to; }).length;

    const visible = all.filter((r) => after(r.status === "under_review" ? r.created_at : r.reviewed_at));
    const cancelled = visible.filter((r) => r.status === "rejected" || r.status === "cancelled");
    const approved = visible.filter((r) => r.status === "approved");
    const pending = visible.filter((r) => r.status === "under_review");

    const trend = (rows: Payment[], field: "created_at" | "reviewed_at") =>
      trendBadge(window(rows, field, now - 30 * day, now), window(rows, field, now - 60 * day, now - 30 * day));

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: cancelled.length,
      total: visible.length,
      totalTrend: trend(visible, "created_at"),
      approvedTrend: trend(approved, "reviewed_at"),
      pendingTrend: trend(pending, "created_at"),
      cancelledTrend: trend(cancelled, "reviewed_at"),
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
    // Each receipt opens at fit size, never at the previous one's zoom.
    if (url) { setViewZoom(1); setViewRot(0); setViewer({ url, pdf: /\.pdf$/i.test(path) }); }
  }
  async function decide(r: Payment, status: "approved" | "rejected") {
    setBusy(r.id);
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id };
    if (status === "rejected") {
      patch.rejection_comment = comment.trim() || "Your receipt could not be verified.";
      // Rejecting drops the receipt file itself (R2 for current rows, Supabase for legacy ones).
      if (r.receipt_path) {
        if (r.receipt_path.startsWith("r2:")) await deleteUserFile(r.receipt_path).catch(() => {});
        else await supabase.storage.from("receipts").remove([r.receipt_path]);
        patch.receipt_path = null;
      }
    }
    await supabase.from("payments").update(patch).eq("id", r.id);
    setBusy(""); setRejectId(null); setComment("");
    void load();
  }

  /* A payment's state maps onto the platform's shared status vocabulary. */
  const statusState = (s: string): StatusState =>
    s === "approved" ? "paid" : s === "rejected" ? "failed" : s === "cancelled" ? "cancelled" : "pending";
  const statusLabel = (s: string) => s === "under_review" ? "Under review" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Payment reviews</h1>
        <button type="button" onClick={() => setAskReset(true)} title="Reset the statistics counters" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>
          <RotateCcw size={15} />
          Reset stats
        </button>
      </div>

      <div className="mc-grid">
        <MetricCard
          tone="blue" title="Total Payments" subtitle="Total payments received"
          value={stats.total} icon={<Wallet size={24} strokeWidth={1.6} />} badge={stats.totalTrend}
          menu={[{ label: "Refresh", onSelect: () => { void load(); } }]}
        />
        <MetricCard
          tone="green" title="Approved Payments" subtitle="Successfully approved payments"
          value={stats.approved} icon={<ShieldCheck size={24} strokeWidth={1.6} />} badge={stats.approvedTrend}
          menu={[{ label: "Refresh", onSelect: () => { void load(); } }]}
        />
        <MetricCard
          tone="amber" title="Pending Payments" subtitle="Payments awaiting review"
          value={stats.pending} icon={<Clock size={24} strokeWidth={1.6} />} badge={stats.pendingTrend}
          menu={[{ label: "Refresh", onSelect: () => { void load(); } }]}
        />
        <MetricCard
          tone="red" title="Cancelled Payments" subtitle="Payments cancelled or rejected"
          value={stats.rejected} icon={<CircleX size={24} strokeWidth={1.6} />} badge={stats.cancelledTrend}
          menu={[{ label: "Refresh", onSelect: () => { void load(); } }]}
        />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "inline-flex", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 14, padding: 3 }}>
          {(["pending", "history"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ height: 34, padding: "0 16px", borderRadius: 11, border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--ink)" : "var(--ink-soft)", boxShadow: tab === t ? "var(--shadow-card)" : "none" }}>{t === "pending" ? "Pending" : "History"}</button>
          ))}
        </div>
        <Input icon={fieldIcon("search")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by payment ID, name or email" aria-label="Search payments" containerStyle={{ flex: "1 1 220px", maxWidth: 340 }} />
        <Select
          value={countryFilter} onChange={(v) => { setCountryFilter(v); setPlanFilter("all"); }} icon={fieldIcon("country")} ariaLabel="Filter by country"
          options={[{ value: "all", label: "All countries" }, ...COUNTRIES.map((c) => ({ value: c.code, label: c.name }))]}
          containerStyle={{ minWidth: 190 }}
        />
        {countryFilter !== "all" && (
          <Select
            value={planFilter} onChange={(v) => setPlanFilter(v as "all" | "self_service" | "full_service")} icon={fieldIcon("plan")} ariaLabel="Filter by plan"
            options={[{ value: "all", label: `All ${countryByCode(countryFilter)?.name ?? ""} plans` }, { value: "self_service", label: "Self Service" }, { value: "full_service", label: "Full Service" }]}
            containerStyle={{ minWidth: 200 }}
          />
        )}
      </div>

      {loading ? (
        <Loader block />
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
                    <Pill tone="indigo">{plan?.name ?? r.plan}</Pill>
                    <Pill tone="grey">{r.amount.toLocaleString("en-US")} {r.currency === "MAD" ? "DH" : r.currency}</Pill>
                    <Pill tone="grey">{method?.name ?? r.method}</Pill>
                    <Status state={statusState(r.status)} label={statusLabel(r.status)} variant="soft" />
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
        <Portal>
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,35,58,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 860, height: "88vh", background: "var(--card)", borderRadius: 18, boxShadow: "0 24px 70px rgba(23,35,58,.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Receipt</span>
              {/* Same zoom controls as the document viewer, so a receipt and a
                  passport are inspected the same way. */}
              <span className="dv-tools">
                <button type="button" className="dv-tool" title="Zoom out" onClick={() => setViewZoom((z) => Math.max(0.4, Number((z - 0.25).toFixed(2))))} disabled={viewZoom <= 0.4}><ZoomOut size={15} /></button>
                <span className="dv-zoom">{Math.round(viewZoom * 100)}%</span>
                <button type="button" className="dv-tool" title="Zoom in" onClick={() => setViewZoom((z) => Math.min(5, Number((z + 0.25).toFixed(2))))} disabled={viewZoom >= 5}><ZoomIn size={15} /></button>
                <button type="button" className="dv-tool" title="Rotate" onClick={() => setViewRot((r) => (r + 90) % 360)}><RotateCw size={15} /></button>
                <button type="button" className="dv-tool" title="Close" onClick={() => setViewer(null)} aria-label="Close"><X size={15} /></button>
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: "var(--subtle)", display: "flex" }}>
              <ImageZoom zoom={viewZoom} onZoomChange={setViewZoom} rotation={viewRot} label="Payment receipt">
                {viewer.pdf
                  ? <iframe src={viewer.url} title="Receipt" style={{ width: "80vw", maxWidth: 820, height: "78vh", border: "none" }} />
                  /* eslint-disable-next-line @next/next/no-img-element */
                  : <img src={viewer.url} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain" }} />}
              </ImageZoom>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {askReset && (
        <Portal>
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
        </Portal>
      )}
    </div>
  );
}

const base = { height: 40, padding: "0 16px", borderRadius: 14, cursor: "pointer", font: "600 13.5px/1 var(--font-sans)" } as const;
const btnPrimary = { ...base, border: "none", background: "var(--indigo-600)", color: "#fff" };
const btnGhost = { ...base, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" };
const btnRed = { ...base, border: "none", background: "var(--red)", color: "#fff" };
const btnRedGhost = { ...base, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)" };
