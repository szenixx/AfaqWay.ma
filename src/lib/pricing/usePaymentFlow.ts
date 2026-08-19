"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PAY_METHODS, planById, type PayMethod } from "@/lib/plans";
import { uploadUserFile, deleteUserFile } from "@/lib/storage/client";

/* The payment path, once.

   Two screens render it — the classic wizard's PricingCheckout and the
   journey's PaymentStep — and it moves real money, so the receipt upload, the
   payments row, the cancel and the approval watcher live here rather than being
   written twice. The two callers differ only in markup. */

export type Pricing = {
  plan?: string;
  method?: string;
  payment_id?: string;
  status?: string;
  reject_comment?: string;
  ref?: string;
};

export type Extra = { title: string; value: string; copyable: boolean };
type MethodRow = { enabled: boolean; beneficiary?: string | null; rib?: string | null; note?: string | null; extra_details?: Extra[] };

export function usePaymentFlow({ userId, pricing, setPricing, onApproved }: {
  userId: string;
  pricing: Pricing;
  setPricing: (key: string, value: string) => void;
  onApproved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState("");
  const [pm, setPm] = useState<Record<string, MethodRow>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_methods").select("id, enabled, beneficiary, rib, note, extra_details");
      const map: Record<string, MethodRow> = {};
      (data ?? []).forEach((r) => { const x = r as MethodRow & { id: string }; map[x.id] = x; });
      setPm(map);
    })();
  }, []);

  // Static config (logo, colour, kind) merged with the super-admin's overrides.
  const methods: (PayMethod & { extra: Extra[] })[] = PAY_METHODS.map((m) => {
    const o = pm[m.id];
    const extra: Extra[] = o && Array.isArray(o.extra_details) ? o.extra_details : [];
    if (!o) return { ...m, extra };
    return {
      ...m,
      available: o.enabled,
      account: (o.beneficiary || o.rib || o.note)
        ? { beneficiary: o.beneficiary ?? "", rib: o.rib ?? undefined, note: o.note ?? undefined }
        : m.account,
      extra,
    };
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
    // Catch up on the current status now (approval may have happened while the
    // tab was closed, or realtime may have missed the event), then keep polling
    // as a fallback.
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

  async function submitPayment() {
    if (!file || !plan || !method) return;
    setBusy(true); setError("");
    try {
      // Receipts upload to Cloudflare R2 through /api/upload.
      const up = await uploadUserFile(file, { folder: "receipts" });
      const ins = await supabase.from("payments").insert({
        user_id: userId, plan: plan.id, amount: plan.price, currency: "MAD",
        method: method.id, status: "under_review", receipt_path: up.path, reference: pricing.ref ?? null,
      }).select("id").single();
      if (ins.error) {
        // Insert refused (e.g. the 3-per-6h receipt limit) — drop the orphaned object.
        await deleteUserFile(up.path).catch(() => {});
        /* supabase-js's PostgrestError is a plain {message,details,hint,code}
           object, not an actual Error — throwing it directly made the catch
           below's `e instanceof Error` check always fail, so every DB rejection
           (the rate limit included) fell through to the generic "Upload failed"
           text instead of the one message that said what went wrong. */
        throw new Error(ins.error.message);
      }
      setPricing("payment_id", ins.data.id as string);
      setPricing("reject_comment", "");
      setPricing("status", "under_review");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed, please try again.";
      setError(
        /limit of 3 receipt/i.test(msg)
          ? "You have reached the limit of 3 receipt uploads. Please wait up to 6 hours before submitting another receipt."
          : /storage|upload/i.test(msg)
            ? `${msg} If it keeps happening, contact support and we will submit your receipt for you.`
            : msg,
      );
    } finally { setBusy(false); }
  }

  async function cancelPayment() {
    if (pricing.payment_id) await supabase.from("payments").update({ status: "cancelled" }).eq("id", pricing.payment_id);
    setPricing("payment_id", ""); setPricing("status", ""); setConfirmCancel(false); setFile(null);
  }

  return {
    methods, plan, method, underReview,
    file, setFile, busy, error, setError,
    pending, setPending, confirmCancel, setConfirmCancel,
    submitPayment, cancelPayment,
  };
}
