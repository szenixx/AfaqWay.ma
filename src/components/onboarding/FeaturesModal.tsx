"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PLANS } from "@/lib/plans";

/* Both plans, feature for feature. Same source as the plan cards — this only
   shows the full lists the cards trim to five. */
export default function FeaturesModal({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const ar = lang === "ar";

  return (
    <div className="onb-modal onb-modal-focus" role="dialog" aria-modal aria-label="Plan features" onClick={onClose}>
      <div className="onb-feat" onClick={(e) => e.stopPropagation()}>
        <header className="onb-feat-head">
          <div>
            <h2>{ar ? "مقارنة الخطتين" : "Your plans, compared in full"}</h2>
            <p>{ar ? "كل ما تحصل عليه في كل خطة." : "Everything each plan includes."}</p>
          </div>
          <div className="onb-feat-lang" role="group" aria-label="Language">
            <button type="button" onClick={() => setLang("en")} aria-pressed={!ar} data-on={!ar || undefined}>EN</button>
            <button type="button" onClick={() => setLang("ar")} aria-pressed={ar} data-on={ar || undefined}>ع</button>
          </div>
          <button type="button" className="onb-prosheet-x" onClick={onClose} aria-label="Close"><X size={18} strokeWidth={2} /></button>
        </header>

        <div className="onb-feat-cols" dir={ar ? "rtl" : "ltr"}>
          {PLANS.map((p) => (
            <section key={p.id}>
              <h3>{p.name}</h3>
              <p className="onb-feat-tag">{p.tagline}</p>
              <ul>
                {(ar ? p.featuresAr : p.features).map((f, i) => (
                  <li key={i}><span className="onb-feat-tick"><Check size={11} strokeWidth={3} /></span>{f}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
