"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@heroui/react";
import { FileDrop } from "@/components/ds";
import { LogoMark } from "@/components/ds/LogoMark";
import { Emoji } from "./Emoji";
import { usePaymentFlow, type Pricing } from "@/lib/pricing/usePaymentFlow";
import type { PayMethod } from "@/lib/plans";
import { useT } from "@/lib/onboarding/lang";

/* Paying, in the journey's own language. Every screen here is presentation:
   the receipt upload, the payments row, the cancel and the approval watcher
   come from usePaymentFlow, shared with the classic wizard. */

const money = (n: number, c: string) => `${n.toLocaleString("en-US")} ${c}`;

function MethodLogo({ m, size = 34 }: { m: PayMethod; size?: number }) {
  return (
    <span className="onb-paylogo" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.logoSrc} alt="" />
    </span>
  );
}

/* No brand glyphs in lucide, so WhatsApp's own mark is inline. */
function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15l-1 3.7 3.8-1A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.3.6.6-2.2-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
    </svg>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="onb-payrow">
      <span className="onb-payrow-text">
        <span className="onb-payrow-label">{label}</span>
        <span className="onb-payrow-value">{value}</span>
      </span>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`} className="onb-payrow-copy" data-done={copied || undefined}>
        {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2} />}
      </button>
    </div>
  );
}

export default function PaymentStep({ userId, pricing, setPricing, onApproved, onBackToPlans }: {
  userId: string;
  pricing: Pricing;
  setPricing: (key: string, value: string) => void;
  onApproved: () => void;
  onBackToPlans: () => void;
}) {
  const {
    methods, plan, method, underReview,
    file, setFile, busy, error, setError,
    pending, setPending, confirmCancel, setConfirmCancel,
    submitPayment, cancelPayment,
  } = usePaymentFlow({ userId, pricing, setPricing, onApproved });
  /* Bank names, the RIB, the beneficiary and every amount stay exactly as they
     are in both languages: they are account details a student copies out, not
     copy. Only the labels around them move. */
  const t = useT();

  /* ── Choosing a method ─────────────────────────────────────────────── */
  /* Rendered on its own while choosing, and again behind the review overlay,
     where it is the thing being blurred: a student waiting on a receipt should
     still see the frame they were just in, not a blank page. */
  const methodChoice = (dimmed?: boolean) => (
    <>
      <div className="onb-answer" aria-hidden={dimmed || undefined} inert={dimmed || undefined}>
        {pricing.ref && (
          <p className="onb-payref">{t("Payment ID")} <strong>{pricing.ref}</strong></p>
        )}
        {/* Six methods with short names: two across reads faster than one
            long column, and the grid falls back to one on a phone. */}
        <div className="onb-opts" data-cols="2">
          {methods.map((m) => {
            const on = pending === m.id;
            return (
              <button
                key={m.id} type="button" className="onb-opt-in onb-paymethod"
                disabled={!m.available} data-on={on || undefined}
                onClick={() => setPending(m.id)}
              >
                <MethodLogo m={m} />
                <span className="onb-opt-text">
                  <span className="onb-opt-label">
                    {m.name}
                    {m.recommended && <span className="onb-paytag">{t("Recommended")}</span>}
                    {!m.available && <span className="onb-paytag onb-paytag-soon">{t("Coming soon")}</span>}
                  </span>
                  <span className="onb-opt-sub">{t(m.desc)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="onb-payfoot" aria-hidden={dimmed || undefined} inert={dimmed || undefined}>
        <button type="button" className="onb-payback" onClick={onBackToPlans}>{t("Back to the plans")}</button>
        <Button className="onb-next onb-paynext" size="lg" isDisabled={!pending} onPress={() => setPricing("method", pending)}>{t("Continue")}</Button>
      </div>
    </>
  );

  if (!method) return methodChoice();

  /* ── Waiting on the review ─────────────────────────────────────────── */
  /* The overlay is absolute against .onb-screen, so it covers the back arrow
     and the step's own title as well as the methods: everything behind goes
     soft and the wait is the only thing in focus. */
  if (underReview) {
    return (
      <>
        {methodChoice(true)}
        <div className="onb-payoverlay" role="dialog" aria-modal aria-label={t("Payment under review")}>
          {!confirmCancel ? (
            <>
              <LogoMark size={64} />
              <h2>{t("Under review")}</h2>
              <p>{t("Verifying your payment, usually a few hours. Safe to close this page, we'll save your place.")}</p>
              <a className="onb-paywa" href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon />
                {t("Chat with support")}
              </a>
              <button type="button" className="onb-paycancel" onClick={() => setConfirmCancel(true)}>{t("Cancel this payment")}</button>
            </>
          ) : (
            <>
              <Emoji name="no" size={56} />
              <h2>{t("Cancel this payment?")}</h2>
              <p>{t("We won't process your invoice, and you'll have to submit your receipt again.")}</p>
              <div className="onb-payconfirm">
                <Button variant="secondary" size="lg" onPress={() => setConfirmCancel(false)}>{t("Keep waiting")}</Button>
                <Button variant="danger" size="lg" onPress={cancelPayment}>{t("Yes, cancel")}</Button>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  /* ── Transferring, then the receipt ────────────────────────────────── */
  const isManual = method.kind === "manual";
  return (
    <>
      <div className="onb-answer">
        <div className="onb-paysum">
          <MethodLogo m={method} size={38} />
          <span className="onb-opt-text">
            <span className="onb-opt-label">{method.name}</span>
            <span className="onb-opt-sub">{plan?.name}{pricing.ref ? ` · ${pricing.ref}` : ""}</span>
          </span>
          <span className="onb-paysum-amount">{plan ? money(plan.price, plan.currency) : ""}</span>
        </div>

        {pricing.status === "rejected" && (
          <div className="onb-payreject">
            <strong>{t("Your payment was rejected")}</strong>
            {pricing.reject_comment && <span>{pricing.reject_comment}</span>}
            <span>{t("Please upload a valid receipt and submit again, or contact support.")}</span>
          </div>
        )}

        {!isManual ? (
          <p className="onb-payempty">{method.name} will be available soon. For now, please pick Cash Plus or a bank transfer to complete your payment.</p>
        ) : (
          <>
            <h3 className="onb-payhead">{t("Invoice details")}</h3>
            <div className="onb-payrows">
              <CopyRow label={t("Amount")} value={plan ? `${plan.price.toLocaleString("en-US")} ${plan.currency}` : ""} />
              {method.account?.rib && <CopyRow label="RIB" value={method.account.rib} />}
              <CopyRow label={t("Full name")} value={method.account?.beneficiary ?? ""} />
              {method.extra?.map((e, i) => e.copyable
                ? <CopyRow key={i} label={e.title} value={e.value} />
                : (
                  <div key={i} className="onb-payrow">
                    <span className="onb-payrow-text">
                      <span className="onb-payrow-label">{e.title}</span>
                      <span className="onb-payrow-value">{e.value}</span>
                    </span>
                  </div>
                ))}
            </div>

            {method.account?.note && (
              <>
                <h3 className="onb-payhead">{t("Note")}</h3>
                <p className="onb-paynote">{method.account.note}</p>
              </>
            )}

            <h3 className="onb-payhead">{t("Invoice receipt")}</h3>
            <FileDrop file={file} onFile={setFile} accept="image/*,application/pdf" maxSizeMb={4} hint={t("Upload the receipt / reçu here")} onError={setError} />
            <ul className="onb-payrules">
              <li>{t("Do not send fake or edited receipts, they will be rejected.")}</li>
              <li>{t("Your receipt must clearly show the transaction number.")}</li>
              <li>{t("Image or PDF, maximum 4 MB.")}</li>
            </ul>
            {error && <p className="onb-err" role="alert">{error}</p>}
          </>
        )}
      </div>

      <div className="onb-payfoot">
        <button type="button" className="onb-payback" onClick={() => { setPricing("method", ""); setPending(""); setFile(null); }}>{t("Back to payment methods")}</button>
        {isManual && (
          <Button className="onb-next onb-paynext" size="lg" isDisabled={!file || busy} isPending={busy} onPress={submitPayment}>
            {t(busy ? "Submitting…" : "Submit for review")}
          </Button>
        )}
      </div>
    </>
  );
}
