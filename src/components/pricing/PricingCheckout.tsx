"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import FeaturesDoc from "@/components/pricing/FeaturesDoc";
import { PLANS, planById, PAY_METHODS, type Plan, type PayMethod } from "@/lib/plans";
import { uploadUserFile } from "@/lib/r2";

/* Pricing & Checkout. Renders its own af-frame-body + af-frame-footer so the
   Back/primary buttons stay pinned to the bottom of the frame on every view.
   State persists in cfa.pricing → resume mid-transfer on any device. Manual
   methods create a payments row (under_review) and wait for the superadmin,
   watched over Supabase realtime.

   NOTE: the plan cards use a user-requested iOS-style glass treatment and the
   under-review state uses blur — a deliberate exception scoped to this step. */

type Pricing = { plan?: string; method?: string; payment_id?: string; status?: string; reject_comment?: string; ref?: string };
const genRef = () => "AFQ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
type Props = {
  userId: string;
  pricing: Pricing;
  setPricing: (key: string, value: string) => void;
  priceSub: number;
  setPriceSub: (n: number) => void;
  onApproved: () => void;
  onBackStep: () => void;
};

const money = (n: number, c: string) => `${n.toLocaleString("en-US")} ${c}`;

function CheckDot() {
  return (
    <span aria-hidden style={{ flex: "none", width: 20, height: 20, borderRadius: 999, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
      <Check size={12} />
    </span>
  );
}

function GlassPlanCard({ plan, onChoose, onSeeAll }: { plan: Plan; onChoose: () => void; onSeeAll: () => void }) {
  return (
    <div className="af-glass-card af-plan-card">
      {plan.popular && <span className="af-plan-tab">Most popular</span>}
      <div className="af-plan-split">
        {/* left: badge, price, tagline, CTA */}
        <div className="af-plan-left">
          <span style={{ alignSelf: "flex-start", font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px" }}>{plan.name}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "14px 0 2px" }}>
            <span style={{ font: "700 40px/44px var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.02em" }}>{plan.price.toLocaleString("en-US")}</span>
            <span style={{ font: "700 22px/28px var(--font-sans)", color: "var(--ink-faint)" }}>{plan.currency}</span>
          </div>
          <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginBottom: 18 }}>{plan.tagline}</div>
          <button type="button" onClick={onChoose} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 12, border: "none", cursor: "pointer", font: "600 14px/1 var(--font-sans)", background: "var(--indigo-600)", color: "#fff", boxShadow: "0 6px 16px rgba(43,76,155,.28)" }}>
            Buy now
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="af-plan-divider" />
        {/* right: highlight features + see-all */}
        <div className="af-plan-right">
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
            {plan.highlights.map((f, i) => (
              <li key={i} style={{ display: "flex", gap: 10, font: "400 13.5px/20px var(--font-sans)", color: "var(--ink)" }}><CheckDot />{f}</li>
            ))}
          </ul>
          <button type="button" onClick={onSeeAll} style={{ alignSelf: "flex-start", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--indigo-600)", padding: 0 }}>
            See all features
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MethodLogo({ m, size = 40 }: { m: PayMethod; size?: number }) {
  // transparent logos, normalized to the same visual box, no background
  return (
    <span style={{ flex: "none", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.logoSrc} alt="" style={{ maxWidth: size - 6, maxHeight: size - 6, objectFit: "contain" }} />
    </span>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{label}</div>
        <div style={{ font: "600 13.5px/20px var(--font-sans)", color: "var(--ink)", wordBreak: "break-all" }}>{value}</div>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`} style={{ flex: "none", width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", color: copied ? "var(--green)" : "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {copied
          ? <Check size={16} />
          : <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>}
      </button>
    </div>
  );
}

function RefBadge({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px", font: "600 12px/16px var(--font-sans)", marginBottom: 14 }}>
      <span style={{ color: "var(--ink-faint)" }}>Payment ID</span>
      <span style={{ color: "var(--ink)", letterSpacing: ".02em" }}>{value}</span>
    </div>
  );
}

function Footer({ onBack, right }: { onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="af-frame-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      {onBack ? <button type="button" onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--indigo-600)", padding: "10px 4px" }}>Back</button> : <span />}
      {right ?? <span />}
    </div>
  );
}

export default function PricingCheckout({ userId, pricing, setPricing, priceSub, setPriceSub, onApproved, onBackStep }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState("");
  const [showAll, setShowAll] = useState(false);
  type Extra = { title: string; value: string; copyable: boolean };
  const [pm, setPm] = useState<Record<string, { enabled: boolean; beneficiary?: string | null; rib?: string | null; note?: string | null; extra_details?: Extra[] }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_methods").select("id, enabled, beneficiary, rib, note, extra_details");
      const map: Record<string, { enabled: boolean; beneficiary?: string | null; rib?: string | null; note?: string | null; extra_details?: Extra[] }> = {};
      (data ?? []).forEach((r) => { const x = r as { id: string; enabled: boolean; beneficiary: string | null; rib: string | null; note: string | null; extra_details: Extra[] }; map[x.id] = x; });
      setPm(map);
    })();
  }, []);

  // merge static config (logo, color, kind) with super-admin overrides (enabled + details)
  const methods = PAY_METHODS.map((m) => {
    const o = pm[m.id];
    const extra: Extra[] = o && Array.isArray(o.extra_details) ? o.extra_details : [];
    if (!o) return { ...m, extra };
    return { ...m, available: o.enabled, account: (o.beneficiary || o.rib || o.note) ? { beneficiary: o.beneficiary ?? "", rib: o.rib ?? undefined, note: o.note ?? undefined } : m.account, extra };
  });
  const plan = planById(pricing.plan);
  const method = methods.find((x) => x.id === pricing.method) ?? null;
  const underReview = pricing.status === "under_review";

  useEffect(() => {
    if (!underReview || !pricing.payment_id) return;
    let done = false;
    const apply = (status?: string, comment?: string) => {
      if (done) return;
      if (status === "approved") { done = true; setPricing("status", "approved"); onApproved(); }
      else if (status === "rejected") { done = true; setPricing("status", "rejected"); setPricing("reject_comment", comment ?? ""); }
    };
    // Catch up on the current status now (in case approval happened while the tab
    // was closed / realtime missed the event), then keep polling as a fallback.
    const check = async () => {
      const { data } = await supabase.from("payments").select("status, rejection_comment").eq("id", pricing.payment_id).maybeSingle();
      if (data) apply(data.status, data.rejection_comment ?? "");
    };
    void check();
    const poll = setInterval(() => { if (done) { clearInterval(poll); return; } void check(); }, 6000);
    const ch = supabase
      .channel(`pay-${pricing.payment_id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments", filter: `id=eq.${pricing.payment_id}` }, (payload) => {
        const row = payload.new as { status?: string; rejection_comment?: string };
        apply(row.status, row.rejection_comment ?? "");
      })
      .subscribe();
    return () => { clearInterval(poll); supabase.removeChannel(ch); };
  }, [underReview, pricing.payment_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sub-step 0: choose a plan (iOS glass cards, no outer frame) ──────
  if (priceSub === 0) {
    return (
      <>
        <div className="af-frame-body">
          <div style={{ background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ font: "500 13px/19px var(--font-sans)", color: "var(--ink)" }}>Please read what each plan includes before you choose.</span>
              <button type="button" onClick={() => setShowAll(true)} style={{ background: "none", border: "none", cursor: "pointer", font: "600 13px/19px var(--font-sans)", color: "var(--indigo-600)", textDecoration: "underline", padding: 0 }}>Explore more</button>
            </div>
            <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)", marginTop: 6 }}>Once you agree to the features and pay, the payment is non-refundable. (-)</div>
            <div dir="rtl" style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", marginTop: 3 }}>بمجرد موافقتك على مزايا الخطة والدفع، يصبح المبلغ غير قابل للاسترجاع.</div>
          </div>
          <div className="af-plan-grid">
            {PLANS.map((p) => <GlassPlanCard key={p.id} plan={p} onChoose={() => { setPricing("plan", p.id); if (!pricing.ref) setPricing("ref", genRef()); setPriceSub(1); }} onSeeAll={() => setShowAll(true)} />)}
          </div>
          <div style={{ marginTop: 22 }}>
            <button type="button" onClick={onBackStep} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--ink)" }}>
              <ChevronLeft size={16} />
              Back
            </button>
          </div>
        </div>
        {showAll && <FeaturesDoc onClose={() => setShowAll(false)} />}
      </>
    );
  }

  // ── Sub-step 1: checkout ────────────────────────────────────────────
  async function submitPayment() {
    if (!file || !plan || !method) return;
    setBusy(true); setError("");
    try {
      // Receipts upload to Cloudflare R2 (with a Supabase fallback if R2 is unset).
      const up = await uploadUserFile(file, { fallbackBucket: "receipts", fallbackPrefix: userId, folder: "receipts" });
      const ins = await supabase.from("payments").insert({ user_id: userId, plan: plan.id, amount: plan.price, currency: "MAD", method: method.id, status: "under_review", receipt_path: up.path, reference: pricing.ref ?? null }).select("id").single();
      if (ins.error) {
        // Insert refused (e.g. the 3-per-6h receipt limit) — remove the orphaned Supabase file (R2 objects expire unused).
        if (up.storage === "supabase") await supabase.storage.from("receipts").remove([up.path]);
        throw ins.error;
      }
      setPricing("payment_id", ins.data.id as string);
      setPricing("reject_comment", "");
      setPricing("status", "under_review");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed, please try again.";
      setError(/limit of 3 receipt/i.test(msg) ? "You have reached the limit of 3 receipt uploads. Please wait up to 6 hours before submitting another receipt." : msg);
    } finally { setBusy(false); }
  }
  async function cancelPayment() {
    if (pricing.payment_id) await supabase.from("payments").update({ status: "cancelled" }).eq("id", pricing.payment_id);
    setPricing("payment_id", ""); setPricing("status", ""); setConfirmCancel(false); setFile(null);
  }

  // Under review — blur overlay fills the whole frame; Back is hidden.
  if (underReview) {
    return (
      <>
        <div className="af-frame-body" aria-hidden style={{ opacity: 0.5 }}>
          <div style={{ font: "600 15px/20px var(--font-sans)", color: "var(--ink)" }}>{plan?.name} · {plan ? money(plan.price, plan.currency) : ""}</div>
          <div style={{ height: 160, borderRadius: 12, background: "var(--subtle)", marginTop: 12 }} />
        </div>
        <div className="af-review-overlay" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, background: "rgba(255,255,255,.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          {!confirmCancel ? (
            <>
              <span style={{ width: 56, height: 56, borderRadius: 999, border: "3px solid var(--amber-line)", borderTopColor: "var(--amber)", animation: "afSpin 1s linear infinite", display: "inline-block" }} />
              <div style={{ font: "600 18px/24px var(--font-sans)", color: "var(--ink)", marginTop: 18 }}>Under review</div>
              <p style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 380, margin: "8px 0 20px" }}>We received your receipt and our team is verifying your payment. This usually takes a few hours, you can safely close this page and come back, your progress is saved.</p>
              <button type="button" onClick={() => setConfirmCancel(true)} style={{ background: "none", border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink-faint)", textDecoration: "underline" }}>Cancel this payment</button>
              <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 999, background: "#25D366", color: "#fff", font: "600 13.5px/1 var(--font-sans)", textDecoration: "none", boxShadow: "0 6px 16px rgba(37,211,102,.3)" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1 3.7 3.8-1A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.3.6.6-2.2-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" /></svg>
                Chat with support
              </a>
            </>
          ) : (
            <>
              <p style={{ font: "600 14px/21px var(--font-sans)", color: "var(--red)", maxWidth: 360, marginBottom: 18 }}>If you cancel, we won&apos;t process your invoice and you&apos;ll have to submit your receipt again.</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setConfirmCancel(false)} style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--ink)" }}>Keep waiting</button>
                <button type="button" onClick={cancelPayment} style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "none", background: "var(--red)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "#fff" }}>Yes, cancel</button>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  // Method not chosen — grid + Continue in the footer.
  if (!method) {
    return (
      <>
        <div className="af-frame-body">
          <RefBadge value={pricing.ref} />
          <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 12 }}>Choose a payment method</div>
          <div className="af-method-grid">
            {methods.map((m) => {
              const sel = pending === m.id;
              return (
                <button key={m.id} type="button" disabled={!m.available} onClick={() => setPending(m.id)}
                  style={{ position: "relative", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: 13, borderRadius: 12, border: sel ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: sel ? "var(--indigo-tint)" : "var(--card)", cursor: m.available ? "pointer" : "not-allowed", opacity: m.available ? 1 : 0.55 }}>
                  <MethodLogo m={m} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ font: "600 14px/19px var(--font-sans)", color: "var(--ink)" }}>{m.name}</span>
                      {m.recommended && <span style={{ font: "600 9px/12px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--indigo-text)", background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 999, padding: "2px 6px" }}>Recommended</span>}
                      {!m.available && <span style={{ font: "600 9px/12px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-soft)", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 999, padding: "2px 6px" }}>Coming soon</span>}
                    </span>
                    <span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{m.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Footer onBack={() => setPriceSub(0)} right={<button type="button" disabled={!pending} onClick={() => setPricing("method", pending)} style={{ height: 44, padding: "0 22px", borderRadius: 12, border: "none", cursor: pending ? "pointer" : "not-allowed", font: "600 14px/1 var(--font-sans)", background: "var(--indigo-600)", color: "#fff", opacity: pending ? 1 : 0.5 }}>Continue</button>} />
      </>
    );
  }

  // Method chosen — details view.
  const isManual = method.kind === "manual";
  const submit = <button type="button" onClick={submitPayment} disabled={!file || busy} style={{ height: 44, padding: "0 22px", borderRadius: 12, border: "none", cursor: !file || busy ? "not-allowed" : "pointer", font: "600 14px/1 var(--font-sans)", background: "var(--indigo-600)", color: "#fff", opacity: !file || busy ? 0.5 : 1 }}>{busy ? "Submitting…" : "Submit for review"}</button>;

  return (
    <>
      <div className="af-frame-body">
        <RefBadge value={pricing.ref} />
        {/* header: logo + line (left), plan + price + method (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><LogoMark size={26} /><span style={{ font: "700 18px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span></div>
            <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 6 }}>Complete your payment to unlock your roadmap.</div>
          </div>
          <div style={{ textAlign: "right", flex: "none" }}>
            <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{plan?.name}</div>
            <div style={{ font: "700 18px/24px var(--font-sans)", color: "var(--indigo-600)" }}>{plan ? money(plan.price, plan.currency) : ""}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <MethodLogo m={method} size={20} />
              <span style={{ font: "600 12px/16px var(--font-sans)", color: method.color }}>{method.name}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2 4 5v5c0 3.5 2.5 6 6 8 3.5-2 6-4.5 6-8V5l-6-3z" /><path d="M7.5 10 9.5 12l3.5-4" /></svg>
          This is a secure, trusted payment page.
        </div>
        <div style={{ height: 1, background: "var(--line-soft)", margin: "16px 0" }} />

        {pricing.status === "rejected" && (
          <div style={{ background: "var(--red-tint)", border: "1px solid var(--red-line)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ font: "600 13px/19px var(--font-sans)", color: "var(--red)" }}>Your payment was rejected</div>
            {pricing.reject_comment && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink)", marginTop: 4 }}>{pricing.reject_comment}</div>}
            <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)", marginTop: 6 }}>Please upload a valid receipt and submit again, or contact support.</div>
            <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, font: "600 12.5px/1 var(--font-sans)", color: "#128C4B", textDecoration: "none" }}>Chat with support</a>
          </div>
        )}

        {!isManual ? (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: 20, font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)" }}>{method.name} will be available soon. For now, please pick Cash Plus or a bank transfer to complete your payment.</div>
        ) : (
          <>
            {/* Invoice Details */}
            <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginBottom: 4 }}>Invoice Details</div>
            <div style={{ height: 1, background: "var(--line-soft)" }} />
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 22 }}>
              <CopyRow label="Amount" value={plan ? `${plan.price.toLocaleString("en-US")} ${plan.currency}` : ""} />
              {method.account?.rib && <CopyRow label="RIB" value={method.account.rib} />}
              <CopyRow label="Full name" value={method.account?.beneficiary ?? ""} />
              {method.extra?.map((e, i) => e.copyable
                ? <CopyRow key={i} label={e.title} value={e.value} />
                : <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", font: "400 13px/20px var(--font-sans)" }}><span style={{ color: "var(--ink-faint)" }}>{e.title}</span><span style={{ color: "var(--ink)", fontWeight: 600 }}>{e.value}</span></div>)}
            </div>

            {method.account?.note && (
              <>
                <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginBottom: 4 }}>Note</div>
                <div style={{ height: 1, background: "var(--line-soft)" }} />
                <div style={{ font: "400 13.5px/21px var(--font-sans)", color: "var(--ink)", padding: "10px 0 22px" }}>{method.account.note}</div>
              </>
            )}

            {/* Invoice Receipt */}
            <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginBottom: 4 }}>Invoice Receipt</div>
            <div style={{ height: 1, background: "var(--line-soft)", marginBottom: 12 }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="af-upload-stripes" style={{ width: "100%", border: "1.5px dashed var(--indigo-line)", borderRadius: 14, padding: "26px 16px", backgroundColor: "var(--card)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Upload size={26} />
              <span style={{ font: "600 12.5px/18px var(--font-sans)", letterSpacing: ".03em", color: file ? "var(--ink)" : "var(--ink-soft)", textTransform: file ? "none" : "uppercase" }}>{file ? file.name : "Upload the receipt / reçu here"}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && f.size > 4 * 1024 * 1024) { setError("File is larger than 4 MB. Please upload a smaller receipt."); return; } setError(""); setFile(f); }} />
            <div style={{ height: 1, background: "var(--line-soft)", marginTop: 12 }} />
            <ul style={{ margin: "12px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <li style={{ font: "400 11.5px/17px var(--font-sans)", color: "var(--ink-faint)" }}>Do not send fake or edited receipts, they will be rejected.</li>
              <li style={{ font: "400 11.5px/17px var(--font-sans)", color: "var(--ink-faint)" }}>Your receipt must clearly show the transaction number.</li>
              <li style={{ font: "400 11.5px/17px var(--font-sans)", color: "var(--ink-faint)" }}>Image or PDF, maximum 4 MB.</li>
            </ul>
            {error && <div style={{ font: "500 13px/18px var(--font-sans)", color: "var(--red)", marginTop: 10 }}>{error}</div>}
          </>
        )}
      </div>
      <Footer onBack={() => { setPricing("method", ""); setPending(""); setFile(null); }} right={isManual ? submit : undefined} />
    </>
  );
}
