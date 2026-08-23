"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Info, LogOut } from "lucide-react";
import { Button, ProgressBar } from "@heroui/react";
import { LogoMark } from "@/components/ds/LogoMark";
import { Emoji } from "./Emoji";
import type { EmojiName } from "@/lib/onboarding/emoji";
import type { OnbLang } from "@/lib/onboarding/darija";
import { supabase } from "@/lib/supabase/client";
import { useLang, useT } from "@/lib/onboarding/lang";

/* The onboarding chrome.

   Two layers, and they never mix: the PAGE frame (blue field, brand mark, the
   two top-corner utilities) and the CARD (progress, one question, one primary
   action). The card is the only thing that changes between screens, which is
   what makes the journey feel like an app rather than a run of pages.

   Deliberately isolated from the rest of the platform: no sidebar, no dashboard
   header, no workspace navigation. A student in here has exactly one thing to
   do. */

const EASE = [0.32, 0.72, 0, 1] as const;
const SHIFT = 26; // px of horizontal travel — enough to read as direction, not as a slide

/* ── Page frame utilities ─────────────────────────────────────────────── */

/* 56px of SVG box draws a ~30px-wide visible mark: the chevrons fill a little
   over half of the square viewBox, and the rest is transparent margin. The
   offset that lands it at 24 x 22 on the page is in .onb-logo. */
export function BrandMark() {
  return (
    <span className="onb-logo" aria-label="AfaqWay">
      <LogoMark size={56} color="#FFFFFF" />
    </span>
  );
}

/* Darija, not Modern Standard Arabic, and the option says so. MSA is the
   language Moroccan students are taught to write and not the one they think in;
   the onboarding asks personal questions, and it should sound like a person
   asking them. The label is the name of the language as it is actually spoken,
   next to the flag of the people who speak it.

   Flags here are emoji artwork, not the design system's Flag: that component
   draws a flag from horizontal stripes, which a Union Jack is not, and neither
   the UK nor Morocco is a destination with stripe data behind it. */
const LANGUAGES: { code: OnbLang; label: string; short: string; flag: EmojiName }[] = [
  { code: "en", label: "English", short: "English", flag: "flag-gb" },
  /* Two labels, because the two places have different jobs. The MENU names the
     language in full, so someone opening it knows exactly what they are
     picking. The BADGE is a 90px chip in a crowded corner and only has to say
     which one is on, so it carries the short form. */
  { code: "ar", label: "دارجة / العربية", short: "العربية", flag: "flag-ma" },
];

function useDismiss(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) close(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open, close]);
  return box;
}

export function TopUtilities() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const { lang, setLang, t } = useLang();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  async function logout() {
    setLeaving(true);
    await supabase.auth.signOut();
    router.replace("/signup");
  }

  return (
    <div className="onb-topright" ref={box}>
      {/* It sits one tap from every question, so it asks first. Nothing is lost
          either way, and the dialog is where that gets said. */}
      <button type="button" className="onb-pill onb-pill-round onb-pill-danger" onClick={() => setConfirmOut(true)} title={t("Log out")}>
        <LogOut size={16} strokeWidth={2} />
        <span className="onb-sr">{t("Log out")}</span>
      </button>

      {confirmOut && (
        <div className="onb-modal" role="dialog" aria-modal aria-label={t("Log out")} onClick={() => !leaving && setConfirmOut(false)}>
          <div className="onb-modal-card" data-center onClick={(e) => e.stopPropagation()}>
            <Emoji name="wave" size={64} className="onb-modal-emoji" />
            <h2>{t("Log out?")}</h2>
            <p>{t("Every answer so far is saved. Sign back in and you will land on this exact question.")}</p>
            <div className="onb-modal-foot">
              <Button variant="secondary" size="lg" isDisabled={leaving} onPress={() => setConfirmOut(false)}>{t("Stay here")}</Button>
              <Button variant="danger" size="lg" isPending={leaving} onPress={logout}>{t("Log out")}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="onb-pop-anchor">
        <button type="button" className="onb-pill" aria-haspopup="menu" aria-expanded={open}
          aria-label={`${t("Language")}: ${current.short}`}
          onClick={() => setOpen((v) => !v)}>
          {/* The active language's own flag, not a generic globe: the flag is
              the fastest read of which language is on, and it swaps the moment
              the choice does. Only ever one language here — the other lives in
              the menu, never beside it. */}
          <Emoji name={current.flag} size={16} />
          {current.short}
        </button>
        {open && (
          <div className="onb-pop" role="menu">
            {LANGUAGES.map((l) => (
              <button
                key={l.code} type="button" role="menuitem" className="onb-pop-item"
                aria-current={l.code === lang || undefined}
                onClick={() => { setLang(l.code); setOpen(false); }}
              >
                <Emoji name={l.flag} size={18} />
                {l.label}
                {l.code === lang && <span className="onb-pop-tag">Current</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Progress ─────────────────────────────────────────────────────────
   One quiet bar across the top of the card. It answers "am I getting
   somewhere", and nothing more — it never competes with the question. */
export function Progress({ pct, label }: { pct: number; label: string }) {
  const t = useT();
  return (
    <ProgressBar className="onb-progress" aria-label={`${t("Setup progress")}, ${t(label)}`} value={Math.round(pct)}>
      <div className="onb-progress-track" aria-hidden>
        <span className="onb-progress-fill" style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }} />
      </div>
    </ProgressBar>
  );
}

/* ── Question header ──────────────────────────────────────────────────
   Back, the question, and the fine print behind an info button — so the
   question itself never has to carry a second paragraph. */
export function BackButton({ onBack, className }: { onBack: () => void; className?: string }) {
  const t = useT();
  return (
    <button type="button" className={`onb-iconbtn${className ? ` ${className}` : ""}`} onClick={onBack} aria-label={t("Back to the previous question")}>
      <ArrowLeft size={18} strokeWidth={2} />
    </button>
  );
}

export function Head({ title, subtitle, hint, onBack }: { title: string; subtitle?: string; hint?: string; onBack?: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const { lang, t } = useLang();
  /* The English builds its help line by sentence-casing the hint and gluing a
     second sentence on. Darija is written as whole sentences and is not
     case-bearing, so it is looked up as one string and left alone. */
  const help = lang === "ar"
    ? [hint && t(hint), t("Your answers save as you go, and you can change any of them later with your advisor.")].filter(Boolean).join(" ")
    : hint
      ? `${hint[0].toUpperCase()}${hint.slice(1)}. Your answers save as you go, and you can change them later with your advisor.`
      : "Your answers save as you go, and you can change any of them later with your advisor.";

  return (
    <div className="onb-head">
      <div className="onb-headrow">
        {onBack
          ? <button type="button" className="onb-iconbtn" onClick={onBack} aria-label={t("Back to the previous question")}><ArrowLeft size={18} strokeWidth={2} /></button>
          : <span className="onb-iconbtn onb-iconbtn-ghost" aria-hidden />}
        <h1 className="onb-q">{t(title)}</h1>
        <div className="onb-pop-anchor" ref={box}>
          <button type="button" className="onb-iconbtn" aria-haspopup="dialog" aria-expanded={open} aria-label={t("About this question")} onClick={() => setOpen((v) => !v)}>
            <Info size={19} strokeWidth={2} />
          </button>
          {open && <div className="onb-pop onb-pop-help" role="dialog" aria-label={t("About this question")}>{help}</div>}
        </div>
      </div>
      {subtitle && <p className="onb-sub">{t(subtitle)}</p>}
    </div>
  );
}

/* ── The animated stage ───────────────────────────────────────────────
   Forward: the screen leaving fades out toward the left while the next one
   fades in from the right. Back reverses it. `mode="wait"` keeps the two from
   overlapping, so the card never grows to fit both and the layout never jumps
   mid-transition. */
export function Stage({ screenKey, direction, children }: { screenKey: string; direction: 1 | -1; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  /* aria-live rather than a focus jump: the text screens autofocus their own
     input, and stealing that focus back to the heading would make a keyboard
     user tab forward again on every single question. */
  return (
    <div className="onb-stage" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="onb-screen"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * SHIFT }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -SHIFT }}
          transition={{ duration: reduced ? 0.12 : 0.22, ease: EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────
   One primary action, pinned to the bottom of the card, the same width and in
   the same place on every screen. Back lives in the header, so nothing sits
   beside it competing for the tap. */
export function Footer({ onNext, nextLabel = "Continue", canNext, busy, saveState }: {
  onNext: () => void;
  nextLabel?: string;
  canNext: boolean;
  busy?: boolean;
  saveState?: "idle" | "saving" | "saved" | "error";
}) {
  const t = useT();
  return (
    <div className="onb-foot">
      <SaveNote state={saveState} />
      <Button className="onb-next" size="lg" fullWidth isDisabled={!canNext || busy} isPending={busy} onPress={onNext}>{t(nextLabel)}</Button>
    </div>
  );
}

export function SaveNote({ state }: { state?: "idle" | "saving" | "saved" | "error" }) {
  const t = useT();
  if (!state || state === "idle" || state === "saved") return <span className="onb-save" />;
  return <span className={`onb-save${state === "error" ? " onb-save-err" : ""}`}>{t(state === "saving" ? "Saving…" : "Couldn’t save, retrying")}</span>;
}
