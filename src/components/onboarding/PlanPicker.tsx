"use client";

import { useState } from "react";
import { Check, ChevronRight, FileText } from "lucide-react";
import { MagicButton } from "@/components/godui/magic-button";
import { SpotlightCard } from "@/components/ds/SpotlightCard";
import FeaturesModal from "./FeaturesModal";
import { Emoji } from "./Emoji";
import type { EmojiName } from "@/lib/onboarding/emoji";
import { PLANS, genRef, type Plan } from "@/lib/plans";
import { useIsPhone } from "@/lib/useIsPhone";
import { whatsappLink } from "@/lib/socialLinks";
import { WhatsAppIcon } from "@/components/ds/WhatsAppIcon";
import { useT, withLinks } from "@/lib/onboarding/lang";

const PLAN_EMOJI: Record<string, EmojiName> = { self_service: "compass", full_service: "handshake" };

/* The brand blue at low opacity. The beam already owns the border, so the
   spotlight is the soft fill only. */
const SPOT = "rgba(46, 59, 199, .13)";


function Highlights({ items }: { items: string[] }) {
  const t = useT();
  return (
    <ul className="onb-plan-list">
      {items.map((f, i) => (
        <li key={i}><span className="onb-feat-tick"><Check size={11} strokeWidth={3} /></span>{t(f)}</li>
      ))}
    </ul>
  );
}

/* How much of a plan a phone card shows once it is picked. Four lines is enough
   to tell the two apart; the rest is one tap away in the full sheet. */
const PEEK = 4;

/* Opens the support thread already on this step's subject rather than blank.
   Null when no support number is configured, and then the row does not render
   at all, never a button that goes nowhere. */
const HELP_URL = whatsappLink("Hello AfaqWay, I am choosing a plan and I would like a free consultation about which one fits me.");

/* Choosing a plan. The payment itself stays in PricingCheckout — this is only
   the decision that comes before it. */
export default function PlanPicker({ current, onChoose, onSeeAll }: {
  current?: string;
  onChoose: (plan: Plan) => void;
  onSeeAll: () => void;
}) {
  const phone = useIsPhone();
  const t = useT();
  /* Phone only: what the student has tapped but not yet confirmed. Desktop
     commits on the card's own button, so it never reads this.

     It opens on the recommended plan rather than on nothing: an unpicked pair
     is two closed rows above an empty half-card, and the screen would be
     asking a question it has not shown the material for. */
  const [picked, setPicked] = useState<string | undefined>(
    current ?? PLANS.find((p) => p.popular)?.id ?? PLANS[0]?.id,
  );
  const pickedPlan = PLANS.find((p) => p.id === picked);

  return (
    <>
      {/* Slim, and first thing on the screen: the student who does not know
          which plan is theirs needs the offer BEFORE they start reading two
          feature lists, not after they have given up on them. */}
      {!phone && HELP_URL && (
        <div className="onb-plan-help">
          <a className="onb-quickbtn onb-quickbtn-wa" href={HELP_URL} target="_blank" rel="noopener noreferrer">
            <span className="onb-quickico"><WhatsAppIcon size={19} /></span>
            {t("Free consultation about the plans")}
          </a>
        </div>
      )}

      {phone ? (
        <>
          <p className="onb-readfirst">
            <strong>{t("Important:")}</strong>{" "}
            {withLinks(t("Read what each plan includes before you choose, and our Refund Policy before you pay."), [
              { phrase: t("Refund Policy"), render: (x) => <a href="/refund" target="_blank" rel="noopener">{x}</a> },
            ])}
          </p>
          {/* The two things a student reaches for before choosing: read the
              detail, or ask someone. One row, one pill each, same size. */}
          <div className="onb-plan-quick">
            <button type="button" className="onb-quickbtn" onClick={onSeeAll}>
              <FileText size={17} strokeWidth={2} />
              Compare plans
            </button>
            {HELP_URL && (
              <a className="onb-quickbtn onb-quickbtn-wa" href={HELP_URL} target="_blank" rel="noopener noreferrer">
                <span className="onb-quickico"><WhatsAppIcon size={17} /></span>
                Free consultation
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="onb-readfirst">
          <strong>{t("Important:")}</strong>{" "}
          {/* Darija puts these clauses in its own order, so the sentence is
              translated whole and the two live phrases are split back out of
              it rather than concatenated around them. */}
          {withLinks(t("Please read what each plan includes before you choose, and our Refund Policy before you pay."), [
            { phrase: t("what each plan includes"), render: (x) => <button type="button" onClick={onSeeAll}>{x}</button> },
            { phrase: t("Refund Policy"), render: (x) => <a href="/refund" target="_blank" rel="noopener">{x}</a> },
          ])}
        </p>
      )}

      <div className="onb-plans">
        {PLANS.map((p) => {
          const on = phone ? picked === p.id : current === p.id;
          const head = (
            <>
              <header className="onb-plan-head">
                {/* Phone only — hidden on desktop, so the selected state is never
                    carried by colour alone on the surface that has no hover. */}
                <span className="onb-plan-radio" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <Emoji name={PLAN_EMOJI[p.id] ?? "card"} size={26} />
                <h3>{p.name}</h3>
                {p.popular && <span className="onb-plan-tab">{t("Most popular")}</span>}
              </header>
              <p className="onb-plan-tagline">{t(p.tagline)}</p>
              <p className="onb-plan-price">
                <strong>{p.price.toLocaleString("en-US")}</strong>
                <span>{p.currency}</span>
              </p>
            </>
          );

          return (
            <SpotlightCard key={p.id} className="onb-plan" glowColor={SPOT} border={false} data-on={on || undefined}>
              {phone ? (
                <button
                  type="button" className="onb-plan-pick" aria-pressed={on}
                  aria-label={`${p.name}, ${p.price.toLocaleString("en-US")} ${p.currency}. ${t(p.tagline)}`}
                  onClick={() => setPicked(p.id)}
                >
                  {head}
                </button>
              ) : head}

              {/* A phone card opens only once it is picked, and then shows a
                  peek rather than the whole list: the pair has to stay short
                  enough to read one against the other without scrolling past
                  the one you are comparing it to. */}
              {!phone && <Highlights items={p.highlights} />}
              {phone && on && (
                <div className="onb-plan-more">
                  <Highlights items={p.highlights.slice(0, PEEK)} />
                  <button type="button" className="onb-plan-readmore" onClick={onSeeAll}>
                    {t("Read all {n} features").replace("{n}", String(p.features.length))}
                    <ChevronRight size={15} strokeWidth={2} />
                  </button>
                </div>
              )}

              {!phone && (
                <MagicButton className="onb-plan-cta" onClick={() => onChoose(p)}>
                  {/* The plan NAME is protected in both languages, so it is
                      substituted into the sentence, not translated with it. */}
                  {t("Choose {planName}").replace("{planName}", p.name)}
                </MagicButton>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      {/* One action, pinned where the thumb is, never scrolled off. */}
      {phone && (
        <div className="onb-plan-bar">
          <MagicButton
            className="onb-plan-cta" disabled={!pickedPlan}
            onClick={() => pickedPlan && onChoose(pickedPlan)}
          >
            {pickedPlan
              ? t("Continue with {planName}").replace("{planName}", pickedPlan.name)
              : t("Pick a plan to continue")}
          </MagicButton>
        </div>
      )}
    </>
  );
}

/** Wires the picker to the onboarding's answer store. */
export function PlanStep({ current, ref_, setPricing, setPriceSub }: {
  current?: string;
  ref_?: string;
  setPricing: (key: string, value: string) => void;
  setPriceSub: (n: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  return (
    <>
      <PlanPicker
        current={current}
        onSeeAll={() => setShowAll(true)}
        onChoose={(p) => {
          setPricing("plan", p.id);
          if (!ref_) setPricing("ref", genRef());
          setPriceSub(1);
        }}
      />
      {showAll && <FeaturesModal onClose={() => setShowAll(false)} />}
    </>
  );
}
