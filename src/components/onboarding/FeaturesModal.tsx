"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@heroui/react";
import { PLANS } from "@/lib/plans";
import { t as translate } from "@/lib/onboarding/darija";
import { useLang } from "@/lib/onboarding/lang";
import { Portal } from "@/components/ds";

/* Both plans, feature for feature. Same source as the plan cards — this only
   shows the full lists the cards trim to five.

   It keeps its own EN/ع toggle on top of the header's language switcher, and
   that is deliberate: this sheet is the one place a student reads a long list
   closely before spending money, and being able to flip that list alone into
   the other language, without changing the language of the flow behind it, is
   worth a second control. It OPENS in whatever the header is set to.

   Opened from PlanPicker, which sits inside .onb-card — and .onb-card carries
   a transform (the "How much help" step's zoom-out) that makes it the
   containing block for any plain `position: fixed` descendant. Without the
   Portal below, this sheet would be sized and clipped against the shrunk
   card instead of the viewport, cutting off the phone-only Done button at
   the bottom exactly as Portal's own doc comment describes. */
export default function FeaturesModal({ onClose }: { onClose: () => void }) {
  const { lang: pageLang, t } = useLang();
  const [lang, setLang] = useState<"en" | "ar">(pageLang);
  const ar = lang === "ar";
  /* This sheet's own toggle overrides the page, so its content is translated
     against the local choice rather than the page's. */
  const tr = (s: string) => translate(lang, s);

  return (
    <Portal>
      <div className="onb-modal onb-modal-focus" lang={ar ? "ary" : "en"} role="dialog" aria-modal aria-label={t("Plan features")} onClick={onClose}>
        <div className="onb-feat" onClick={(e) => e.stopPropagation()}>
          <header className="onb-feat-head">
            <div>
              <h2>{tr("Your plans, compared in full")}</h2>
              <p>{tr("Everything each plan includes.")}</p>
            </div>
            <div className="onb-feat-lang" role="group" aria-label={t("Language")}>
              <button type="button" onClick={() => setLang("en")} aria-pressed={!ar} data-on={!ar || undefined}>EN</button>
              <button type="button" onClick={() => setLang("ar")} aria-pressed={ar} data-on={ar || undefined}>ع</button>
            </div>
            <button type="button" className="onb-prosheet-x" onClick={onClose} aria-label={t("Close")}><X size={18} strokeWidth={2} /></button>
          </header>

          <div className="onb-feat-cols" dir={ar ? "rtl" : "ltr"}>
            {PLANS.map((p) => (
              <section key={p.id}>
                {/* The plan name is protected in both languages. */}
                <h3>{p.name}</h3>
                <p className="onb-feat-tag">{tr(p.tagline)}</p>
                <ul>
                  {p.features.map((f, i) => (
                    <li key={i}><span className="onb-feat-tick"><Check size={11} strokeWidth={3} /></span>{tr(f)}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Phone only. Full screen means the X at the top is off-screen by the
              time you reach the last line, so the way out sits at the end too. */}
          <div className="onb-feat-foot">
            <Button className="onb-next onb-feat-done" size="lg" fullWidth onPress={onClose}>
              {tr("Done")}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
