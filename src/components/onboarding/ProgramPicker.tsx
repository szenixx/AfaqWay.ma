"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Info, TriangleAlert, X } from "lucide-react";
import { Button, Input, Radio, RadioGroup, TextField } from "@heroui/react";
import { Emoji } from "./Emoji";
import { PROGRAMS } from "@/lib/programs/catalog";
import { findUniversity } from "@/lib/universities";
import { logoPath } from "@/lib/universityAssets";
import { recommend } from "@/lib/programs/engine";
import type { MatchReason, Program, StudentProfile } from "@/lib/programs/types";
import { useLang, useT } from "@/lib/onboarding/lang";

/* One programme, picked either way: ranked against the answers so far, or
   searched by name for a student who already knows what they want. */

const SHOWN = 14;

const money = (p: Program) => (p.tuition_eur != null ? `€${p.tuition_eur.toLocaleString("en-US")}/yr` : null);
/* The university and the field. Tuition is rendered separately so it can carry
   its own weight, but it belongs to THIS line, right after the university. */
const metaTail = (p: Program) => [p.field].filter(Boolean).join(" · ");
const logoOf = (name: string) => logoPath(findUniversity(name)?.slug);

/* Only a perfect match earns colour. Every other score is a number the student
   should weigh, not a verdict the interface has already reached for them. */
const band = (perfect: boolean) => (perfect ? "perfect" : "plain");

/* The score as a dial, not a number in a box: the ring fills to the match and
   takes the band's colour, so the row is readable before it is read. */
function Score({ score, perfect }: { score: number; perfect: boolean }) {
  return (
    <span className="onb-score" data-band={band(perfect)}>
      <span className="onb-score-ring" style={{ ["--pct" as string]: `${perfect ? 100 : score}%` }} />
      {perfect ? "Perfect match" : `${score}%`}
    </span>
  );
}

/* The catalogue holds facts, not prose, so the panel shows the facts. Nothing
   here is written for the student — it is the programme's own record. */
const BLANK = new Set(["", "-", ".", "n/a", "N/A"]);
const real = (v: string | null | undefined) => (v && !BLANK.has(v.trim()) ? v.trim() : null);

function facts(p: Program): [string, string][] {
  const out: [string, string][] = [
    ["Field", p.field],
    ["Tuition", p.tuition_eur != null ? `€${p.tuition_eur.toLocaleString("en-US")} per year` : "Not published"],
  ];
  if (p.app_fee_eur != null) out.push(["Application fee", `€${p.app_fee_eur.toLocaleString("en-US")}`]);
  if (real(p.intake)) out.push(["Intake", p.intake]);
  if (real(p.study_period)) out.push(["Study period", p.study_period]);
  if (real(p.deadline)) out.push(["Deadline", p.deadline]);
  if (p.min_grade != null) out.push(["Minimum grade", `${(p.min_grade * 20).toFixed(1).replace(/\.0$/, "")} / 20`]);
  const english = [
    p.cefr_min ? `CEFR ${p.cefr_min}` : null,
    p.duolingo_min != null ? `Duolingo ${p.duolingo_min}` : null,
    real(p.english_core) ? `English Core ${p.english_core}` : null,
  ].filter(Boolean).join(" · ");
  if (english) out.push(["English required", english]);
  return out;
}

function ProgramSheet({ program, reasons, onClose }: { program: Program; reasons?: MatchReason[]; onClose: () => void }) {
  /* document.body only exists on the client. Read once at first render rather
     than set from an effect, which is both a lint error and a wasted paint. */
  const [mounted] = useState(() => typeof document !== "undefined");
  const { lang, t } = useLang();

  /* Escape closes it, the same as the X and the backdrop. A dialog that can
     only be dismissed by hitting a 32px target is a dialog a phone can trap
     someone in. */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const sheet = (
    <div className="onb-portal onb-modal" lang={lang === "ar" ? "ary" : "en"} role="dialog" aria-modal aria-label={program.name} onClick={onClose}>
      <div className="onb-prosheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="onb-prosheet-x" onClick={onClose} aria-label={t("Close")}><X size={18} strokeWidth={2} /></button>

        <header className="onb-prosheet-head">
          <span className="onb-prosheet-tag">{program.degree}</span>
          <h2>{program.name}</h2>
          <p>{program.university}</p>
        </header>

        <dl className="onb-prosheet-facts">
          {facts(program).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>

        {reasons && reasons.length > 0 && (
          <div className="onb-prosheet-gaps">
            <TriangleAlert size={17} strokeWidth={2} />
            <div>
              <h3>{t("Where you fall short today")}</h3>
              <ul>{reasons.map((r, i) => <li key={i}>{r.text}</li>)}</ul>
            </div>
          </div>
        )}

        <Button className="onb-next onb-prosheet-done" size="lg" fullWidth onPress={onClose}>{t("Got it")}</Button>
      </div>
    </div>
  );

  /* Mounted on <body>, not where it is written.

     The sheet is `position: fixed`, but the stage it lives in is a framer
     motion div that carries a transform, and a transformed ancestor becomes
     the containing block for fixed descendants. Inside the stage the overlay
     was therefore sized to the step card rather than to the viewport, which is
     what trapped it in the frame. A portal is the only thing that escapes that,
     since the transform is applied by the animation and cannot be removed.

     `.onb-portal` carries the token block it no longer inherits from the root. */
  return mounted ? createPortal(sheet, document.body) : null;
}

const MODES = [
  { value: "help", label: "Help me choose", sub: "Ranked against your answers", emoji: "compass" as const },
  { value: "know", label: "I'll choose myself", sub: "Search the full catalogue", emoji: "map" as const },
];

export default function ProgramPicker({ profile, selected, onSelect }: {
  profile: StudentProfile;
  selected: number[];
  onSelect: (ids: number[]) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<"help" | "know">("help");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<number | null>(null);
  const ready = profile.fields.length > 0 && profile.maxBudget != null;

  const ranked = useMemo(() => (ready ? recommend(profile, PROGRAMS) : []), [profile, ready]);
  const scoreOf = useMemo(() => new Map(ranked.map((r) => [r.program.id, r])), [ranked]);

  const list = useMemo(() => {
    if (mode === "help") return (ready ? ranked.map((r) => r.program) : PROGRAMS).slice(0, SHOWN);
    const q = query.trim().toLowerCase();
    if (!q) return PROGRAMS.slice(0, SHOWN);
    return PROGRAMS.filter((p) => `${p.name} ${p.field} ${p.university}`.toLowerCase().includes(q)).slice(0, SHOWN);
  }, [mode, query, ranked, ready]);

  // A chosen programme stays in view even when the current filter excludes it.
  const chosen = PROGRAMS.find((p) => p.id === selected[0]) ?? null;
  const rows = chosen && !list.some((p) => p.id === chosen.id) ? [chosen, ...list] : list;

  const note = mode === "help"
    ? ready
      ? `Your ${Math.min(SHOWN, ranked.length)} closest matches out of ${ranked.length}, best first`
      : t("Fill in your field of interest and budget to see these ranked for you.")
    : query.trim()
      ? `${rows.length} programme${rows.length === 1 ? "" : "s"} matching “${query.trim()}”`
      : `Every programme we work with. Showing ${rows.length} of ${PROGRAMS.length}.`;

  return (
    <>
      <RadioGroup className="onb-opts onb-modes" data-cols="2" aria-label={t("How do you want to pick?")} value={mode} onChange={(v) => setMode(v as "help" | "know")}>
        {MODES.map((m) => (
          <Radio key={m.value} className="onb-opt" value={m.value}>
            {({ isSelected }) => (
              <Radio.Content className="onb-opt-in" data-on={isSelected || undefined}>
                <Emoji name={m.emoji} size={22} className="onb-opt-emoji" />
                <span className="onb-opt-text">
                  <span className="onb-opt-label">{t(m.label)}</span>
                  <span className="onb-opt-sub">{t(m.sub)}</span>
                </span>
              </Radio.Content>
            )}
          </Radio>
        ))}
      </RadioGroup>

      <hr className="onb-sep" />

      {mode === "know" && (
        <div className="onb-inputbox onb-searchbox">
          <Emoji name="magnifier" size={17} className="onb-input-emoji" />
          <TextField className="onb-field" aria-label={t("Search programmes")} value={query} onChange={setQuery}>
            <Input className="onb-input" placeholder={t("Search by name, field or university")} />
          </TextField>
        </div>
      )}

      <p className="onb-listnote">{note}</p>

      {rows.length === 0 ? (
        <p className="onb-empty">{t("Nothing matches that. Try a shorter word, or clear the search.")}</p>
      ) : (
        <RadioGroup
          className="onb-opts" aria-label={t("Programme")}
          value={selected[0] != null ? String(selected[0]) : ""}
          onChange={(v) => onSelect(v ? [Number(v)] : [])}
        >
          {rows.map((p) => {
            const r = mode === "help" ? scoreOf.get(p.id) : undefined;
            return (
              /* The info button sits outside the Radio's label, so opening the
                 panel never also picks the programme. */
              <div key={p.id} className="onb-opt onb-prorow">
                <Radio className="onb-prochoice" value={String(p.id)}>
                  {({ isSelected }) => (
                    <Radio.Content className="onb-opt-in" data-on={isSelected || undefined}>
                      {/* The university's own mark, sunk into the corner of its
                          row: recognisable at a glance, never competing. */}
                      {logoOf(p.university) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="onb-prowatermark" src={logoOf(p.university)!} alt="" aria-hidden loading="lazy" decoding="async" />
                      )}
                      <span className="onb-opt-text">
                        <span className="onb-opt-label">{p.name}</span>
                        {/* One fee per programme, on the secondary line beside
                            the university it belongs to. The name above stays
                            the only thing competing for the eye. */}
                        <span className="onb-opt-sub">
                          {p.university}
                          {money(p) && <> · <span className="onb-profee">{money(p)}</span></>}
                          {metaTail(p) && ` · ${metaTail(p)}`}
                        </span>
                      </span>
                      {r && <Score score={r.score} perfect={r.perfect} />}
                    </Radio.Content>
                  )}
                </Radio>
                <button type="button" className="onb-proinfo" onClick={() => setDetail(p.id)} aria-label={`About ${p.name}`}>
                  <Info size={18} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {detail != null && (() => {
        const p = PROGRAMS.find((x) => x.id === detail);
        if (!p) return null;
        return <ProgramSheet program={p} reasons={scoreOf.get(p.id)?.reasons} onClose={() => setDetail(null)} />;
      })()}
    </>
  );
}
