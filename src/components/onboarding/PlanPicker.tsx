"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MagicButton } from "@/components/godui/magic-button";
import { SpotlightCard } from "@/components/ds/SpotlightCard";
import FeaturesModal from "./FeaturesModal";
import { Emoji } from "./Emoji";
import type { EmojiName } from "@/lib/onboarding/emoji";
import { PLANS, genRef, type Plan } from "@/lib/plans";

const PLAN_EMOJI: Record<string, EmojiName> = { self_service: "compass", full_service: "handshake" };

/* The brand blue at low opacity. The beam already owns the border, so the
   spotlight is the soft fill only. */
const SPOT = "rgba(46, 59, 199, .13)";

/* Choosing a plan. The payment itself stays in PricingCheckout — this is only
   the decision that comes before it. */
export default function PlanPicker({ current, onChoose, onSeeAll }: {
  current?: string;
  onChoose: (plan: Plan) => void;
  onSeeAll: () => void;
}) {
  return (
    <>
      <p className="onb-readfirst">
        <strong>Important:</strong> Please read <button type="button" onClick={onSeeAll}>what each plan includes</button> before
        you choose, and our <a href="/refund" target="_blank" rel="noopener">Refund Policy</a> before you pay.
      </p>

      <div className="onb-plans">
        {PLANS.map((p) => (
          <SpotlightCard key={p.id} className="onb-plan" glowColor={SPOT} border={false} data-on={current === p.id || undefined}>
            <header className="onb-plan-head">
              <Emoji name={PLAN_EMOJI[p.id] ?? "card"} size={26} />
              <h3>{p.name}</h3>
              {p.popular && <span className="onb-plan-tab">Most popular</span>}
            </header>
            <p className="onb-plan-tagline">{p.tagline}</p>
            <p className="onb-plan-price">
              <strong>{p.price.toLocaleString("en-US")}</strong>
              <span>{p.currency}</span>
            </p>
            <ul className="onb-plan-list">
              {p.highlights.map((f, i) => (
                <li key={i}><span className="onb-feat-tick"><Check size={11} strokeWidth={3} /></span>{f}</li>
              ))}
            </ul>
            <MagicButton className="onb-plan-cta" onClick={() => onChoose(p)}>
              Choose {p.name}
            </MagicButton>
          </SpotlightCard>
        ))}
      </div>
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
