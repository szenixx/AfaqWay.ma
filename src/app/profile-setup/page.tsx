"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox } from "@heroui/react";
import { supabase } from "@/lib/supabase/client";
import { fetchAdminRole } from "@/lib/admin";
import { useSingleSession } from "@/lib/useSingleSession";
import { ensureGeneratedAvatar } from "@/lib/avatarProfile";
import type { Gender } from "@/lib/avatarIdentity";
import { countryByCode } from "@/components/profile-setup/countries";
import { getCountryFlow } from "@/lib/onboarding/countryFlows";
import {
  EMPTY_PERSONAL, cfaFromJson, cfaToJson, hasCfaData, personalFromRow, personalPatch, str,
  type Cfa, type Personal,
} from "@/lib/onboarding/profileState";
import {
  applyForceRules, buildScreens, groupLabels, readSlot, screenAnswered,
  type Screen, type Slot,
} from "@/lib/onboarding/journey";
import { Emoji } from "@/components/onboarding/Emoji";
import type { EmojiName } from "@/lib/onboarding/emoji";
import { Answer, PhoneAnswer } from "@/components/onboarding/Answer";
import { BackButton, BrandMark, Footer, Head, Progress, SaveNote, Stage, TopUtilities } from "@/components/onboarding/OnboardingShell";
import ProgramPicker from "@/components/onboarding/ProgramPicker";
import { PlanStep } from "@/components/onboarding/PlanPicker";
import { BlueprintGrid } from "@/components/godui/blueprint-grid";
import PaymentStep from "@/components/onboarding/PaymentStep";
import { LegalDocModal } from "@/components/legal/LegalContent";
import { PROGRAMS } from "@/lib/programs/catalog";
import { planById } from "@/lib/plans";
import { intakeByValue } from "@/config/intakes";
import type { StudentProfile } from "@/lib/programs/types";

/* ── AfaqWay onboarding ────────────────────────────────────────────────
   One question per screen. The screen list is derived from the SAME country
   flow registry the platform has always used (src/lib/onboarding/countryFlows)
   and writes the SAME columns — this file only decides how a question is put
   to a student, never which questions exist or where the answer goes.

   The previous wizard is still live at /profile-setup/classic, on the same
   profile row, so the two can be compared against one account.

   Position is persisted the way it always was (onboarding_phase +
   onboarding_step, one entry per flow step), but re-entry does not trust it
   blindly: it lands on the first screen that is genuinely unanswered, so a
   half-finished step resumes where it stopped rather than at its top. */

const numOrNull = (v: string | undefined) => { const n = parseFloat(v ?? ""); return Number.isNaN(n) ? null : n; };
const degreeLabel = (s: string) => (s === "high_school" ? "High school" : s === "bachelor" ? "Bachelor's degree" : s === "master" ? "Master's degree" : "—");

export default function ProfileSetup() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<Personal>(EMPTY_PERSONAL);
  const [cfa, setCfa] = useState<Cfa>({});
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [screenId, setScreenId] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showError, setShowError] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [priceSub, setPriceSub] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [legalError, setLegalError] = useState(false);
  const [legalView, setLegalView] = useState<null | "terms" | "refund">(null);
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const pRef = useRef(personal);
  const cRef = useRef(cfa);
  const uidRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moving = useRef(false); // re-entrancy guard: a double tap must not skip a screen

  useSingleSession(sessionUserId);

  const flow = getCountryFlow(personal.destination_country);
  const labels = groupLabels(flow);
  const screens = useMemo(() => buildScreens(personal, cfa, flow), [personal, cfa, flow]);
  const selectedPrograms = (cfa.program_setup?.selected_programs ?? "").split("|").filter(Boolean).map(Number);

  const idx = Math.max(0, screens.findIndex((s) => s.id === screenId));
  const screen: Screen | undefined = screens[idx];

  /* ── Load ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const admin = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (admin.role) { router.replace("/admin"); return; }
      uidRef.current = user.id;
      setSessionUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (cancelled) return;
      const row = (data ?? {}) as Record<string, unknown>;
      if (row.onboarding_completed_at) { router.replace("/dashboard"); return; }

      const p = personalFromRow(row);
      const c = cfaFromJson(row.country_flow_answers);
      pRef.current = p; cRef.current = c;
      setUserNumber(typeof row.user_number === "number" ? row.user_number : null);
      setPersonal(p); setCfa(c);

      /* Re-entry lands on the first screen that is genuinely unanswered, rather
         than on whatever position was last written: a step abandoned halfway
         resumes halfway. A student who has answered nothing yet is not
         resuming at all, so they get the opening screen. */
      const list = buildScreens(p, c, getCountryFlow(p.destination_country));
      const picked = (c.program_setup?.selected_programs ?? "").split("|").filter(Boolean).map(Number);
      const started = list.some((s) => s.kind === "question" && screenAnswered(s, p, c, picked));
      const first = started ? list.find((s) => !screenAnswered(s, p, c, picked)) : list[0];
      setScreenId((first ?? list[list.length - 1]).id);
      setPriceSub(str(c.pricing?.plan) ? 1 : 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Every screen change starts at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [screenId]);

  /* ── Saving ─────────────────────────────────────────────────────────── */
  async function save(retry = true) {
    const id = uidRef.current;
    if (!id) return;
    setSaveState("saving");
    const patch = { id, ...personalPatch(pRef.current), country_flow_answers: cfaToJson(getCountryFlow(pRef.current.destination_country), cRef.current) };
    let { error } = await supabase.from("profiles").upsert(patch);
    if (error && /gender/i.test(error.message)) {
      // The avatar migration has not been applied yet: save everything else.
      const { gender: _gender, ...withoutGender } = patch;
      void _gender;
      ({ error } = await supabase.from("profiles").upsert(withoutGender));
    }
    if (error) { if (retry) { setTimeout(() => save(false), 1000); return; } setSaveState("error"); return; }
    setSaveState("saved");
  }
  function scheduleSave() { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void save(), 600); }
  function flushSave() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } void save(); }

  /* ── Writing an answer ──────────────────────────────────────────────── */
  /* Answers are mirrored into refs as they are written. The debounced save
     fires after the component has moved on, so it needs the newest values, not
     the ones captured in the render that scheduled it. */
  function writeSlot(slot: Slot, value: string) {
    if (slot.type === "personal") {
      const next = { ...pRef.current, [slot.key]: value };
      pRef.current = next;
      setPersonal(next);
    } else {
      const step = flow?.steps.find((s) => s.id === slot.stepId);
      const vals = { ...(cRef.current[slot.stepId] ?? {}), [slot.key]: value };
      const next = { ...cRef.current, [slot.stepId]: step ? applyForceRules(step, vals) : vals };
      cRef.current = next;
      setCfa(next);
    }
    scheduleSave();
  }

  /* Switching destination throws away the answers that belong to the country
     being left, so it asks first — but only once there is something to lose. */
  function setDestination(code: string) {
    if (code === personal.destination_country) return;
    if (hasCfaData(cfa)) { setSwitchTo(code); return; }
    writeSlot({ type: "personal", key: "destination_country" }, code);
  }
  async function applySwitch(code: string) {
    const next = { ...pRef.current, destination_country: code };
    pRef.current = next; cRef.current = {};
    setPersonal(next); setCfa({}); setSwitchTo(null); setPriceSub(0);
    const id = uidRef.current;
    if (id) await supabase.from("profiles").update({ destination_country: code, country_flow_answers: {}, onboarding_phase: "universal", onboarding_step: 1 }).eq("id", id);
  }

  /* ── Navigation ─────────────────────────────────────────────────────── */
  async function persistPosition(group: number) {
    const id = uidRef.current;
    if (!id) return;
    await supabase.from("profiles").update({ onboarding_phase: group === 0 ? "universal" : "country_flow", onboarding_step: group === 0 ? 1 : group }).eq("id", id);
  }

  const canContinue = !screen ? false : screenAnswered(screen, personal, cfa, selectedPrograms);

  /* `advance` moves; `goNext` is advance with the answer gate in front of it.
     They are separate because the payment sub-flow advances on its own signal:
     approval arrives from Supabase realtime and calls back synchronously, so
     the gate would still be reading the pre-approval answers and refuse. */
  function advance() {
    if (moving.current || !screen) return;
    const next = screens[idx + 1];
    if (!next) return;
    flushSave();
    moving.current = true;
    setShowError(false);
    setDirection(1);
    setScreenId(next.id);
    if (next.group !== screen.group) void persistPosition(next.group);
    setTimeout(() => { moving.current = false; }, 240);
  }
  function goNext() {
    if (!canContinue) { setShowError(true); return; }
    advance();
  }
  function goBack() {
    if (moving.current || idx === 0) return;
    moving.current = true;
    setShowError(false);
    setDirection(-1);
    setScreenId(screens[idx - 1].id);
    setTimeout(() => { moving.current = false; }, 240);
  }

  async function finish() {
    if (!(agreeTerms && agreeRefund)) { setLegalError(true); return; }
    setFinishing(true);
    const id = uidRef.current;
    if (id) {
      await supabase.from("profiles").update({ onboarding_completed_at: new Date().toISOString(), onboarding_phase: "country_flow", onboarding_step: flow?.steps.length ?? 1 }).eq("id", id);
      // Nobody leaves onboarding without an avatar.
      await ensureGeneratedAvatar(id, (personal.gender || "prefer_not_to_say") as Gender);
    }
    router.replace("/dashboard");
  }

  if (loading || !screen) {
    return <div className="onb-boot">Loading your profile…</div>;
  }

  // One bar for the whole journey; the group name only labels it for a screen reader.
  const overallPct = (idx / Math.max(1, screens.length - 1)) * 100;

  const isPricing = screen.kind === "pricing";
  const isSummary = screen.kind === "summary";
  const back = idx > 0 ? goBack : undefined;

  return (
    <div className="onb-root" data-wide={screen.kind === "program" || isPricing || undefined}>
      <BrandMark />
      <TopUtilities />

      <main className="onb-card">
        {/* The plan screen is the one decision with a price on it, so the card
            gets a drafting-table field behind it. Nowhere else. */}
        {isPricing && priceSub === 0 && <BlueprintGrid variant="dots" size={22} />}
        {finishing && (
          <div className="onb-done" role="status" aria-live="assertive">
            <svg className="onb-done-mark" viewBox="0 0 52 52" aria-hidden>
              <circle cx="26" cy="26" r="23" />
              <path d="M15 26.5 L22.5 34 L37.5 18.5" />
            </svg>
            <p className="onb-done-title">You&apos;re all set</p>
            <p className="onb-done-sub">Building your workspace…</p>
          </div>
        )}
        <Progress pct={overallPct} label={labels[screen.group]} />

        <Stage screenKey={screen.id} direction={direction}>
          {screen.kind === "note" && (
            <div className="onb-note">
              {/* A breath, not a question: no info button, but Back still has to
                  work — these sit mid-journey, not only at the start. */}
              {back ? <BackButton onBack={back} className="onb-note-back" /> : <span className="onb-note-back" aria-hidden />}
              <div className="onb-note-body">
                <Emoji name={screen.emoji} size={84} className="onb-note-emoji" />
                <h1 className="onb-q onb-q-big">{screen.title}</h1>
                <p className="onb-sub">{screen.body}</p>
              </div>
            </div>
          )}

          {screen.kind === "question" && (() => {
            const q = screen.question;
            const value = readSlot(q.slot, personal, cfa);
            const bad = showError && !(value !== "" && q.isValid(value));
            const isDestination = q.slot.type === "personal" && q.slot.key === "destination_country";
            return (
              <>
                <Head title={q.title} subtitle={q.subtitle} hint={q.hint} onBack={back} />
                <div className="onb-answer">
                  {q.control.kind === "phone" ? (
                    <PhoneAnswer
                      code={personal.whatsapp_country_code}
                      number={personal.whatsapp_number}
                      emoji={q.emoji}
                      invalid={bad}
                      onCode={(v) => writeSlot({ type: "personal", key: "whatsapp_country_code" }, v)}
                      onNumber={(v) => writeSlot({ type: "personal", key: "whatsapp_number" }, v)}
                      onCommit={flushSave}
                      onEnter={goNext}
                    />
                  ) : (
                    <Answer
                      control={q.control}
                      value={value}
                      label={q.title}
                      emoji={q.emoji}
                      invalid={bad}
                      onChange={(v) => (isDestination ? setDestination(v) : writeSlot(q.slot, v))}
                      onCommit={flushSave}
                      onEnter={goNext}
                    />
                  )}
                  {q.note && <p className="onb-note-line">{q.note}</p>}
                  {bad && <p className="onb-err" role="alert">{q.error}</p>}

                  {/* Revealed by this screen's own answer, and part of it: the
                      same Continue waits for these too. */}
                  {(q.followUps ?? []).filter((f) => f.applies?.(cfa) ?? true).map((f) => {
                    const fv = readSlot(f.slot, personal, cfa);
                    const fbad = showError && !(fv !== "" && f.isValid(fv));
                    return (
                      <div className="onb-followup" key={f.slot.type === "flow" ? f.slot.key : f.title}>
                        <h2 className="onb-followup-label">{f.title}</h2>
                        {f.control.kind !== "phone" && (
                          <Answer
                            control={f.control}
                            value={fv}
                            label={f.title}
                            emoji={f.emoji}
                            invalid={fbad}
                            onChange={(v) => writeSlot(f.slot, v)}
                            onCommit={flushSave}
                            onEnter={goNext}
                          />
                        )}
                        {fbad && <p className="onb-err" role="alert">{f.error}</p>}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {screen.kind === "program" && (
            <>
              <Head title={screen.title} subtitle={screen.subtitle} onBack={back} />
              <div className="onb-answer">
                <ProgramPicker
                  profile={programProfile(cfa)}
                  selected={selectedPrograms}
                  onSelect={(ids) => { writeSlot({ type: "flow", stepId: screen.stepId, key: "selected_programs" }, ids.join("|")); flushSave(); }}
                />
              </div>
            </>
          )}

          {isPricing && screen.kind === "pricing" && (
            <>
              <Head
                title={priceSub === 0 ? "How much help do you want?" : "Complete your payment"}
                subtitle={priceSub === 0 ? "Two ways to do this: drive it yourself, or hand the paperwork to an advisor. You can change plan later." : "Transfer the amount, then upload the receipt. We verify it by hand."}
                onBack={back}
              />
              {priceSub === 0 ? (
                <div className="onb-answer">
                  <PlanStep
                    current={cfa.pricing?.plan}
                    ref_={cfa.pricing?.ref}
                    setPricing={(key, value) => writeSlot({ type: "flow", stepId: screen.stepId, key }, value)}
                    setPriceSub={setPriceSub}
                  />
                </div>
              ) : (
                <PaymentStep
                  userId={sessionUserId ?? ""}
                  pricing={cfa.pricing ?? {}}
                  setPricing={(key, value) => writeSlot({ type: "flow", stepId: screen.stepId, key }, value)}
                  onApproved={() => { setPriceSub(0); advance(); }}
                  onBackToPlans={() => setPriceSub(0)}
                />
              )}
            </>
          )}

          {isSummary && (
            <Summary
              personal={personal} cfa={cfa} userNumber={userNumber} onBack={back} saveState={saveState}
              agreeTerms={agreeTerms} agreeRefund={agreeRefund} legalError={legalError}
              onTerms={() => { setAgreeTerms((v) => !v); setLegalError(false); }}
              onRefund={() => { setAgreeRefund((v) => !v); setLegalError(false); }}
              onRead={setLegalView}
            />
          )}
        </Stage>

        {/* Pricing draws its own action row inside the frame, so the card hides its own. */}
        {!isPricing && (
          <Footer
            onNext={isSummary ? finish : goNext}
            nextLabel={screen.kind === "note" ? screen.cta : isSummary ? "Enter my dashboard" : "Continue"}
            canNext={isSummary ? true : canContinue}
            busy={finishing}
            saveState={isSummary ? undefined : saveState}
          />
        )}
      </main>

      {switchTo && (
        <div className="onb-modal" role="dialog" aria-modal>
          <div className="onb-modal-card">
            <h2>Switch destination?</h2>
            <p>Switching to {countryByCode(switchTo)?.name} clears the {countryByCode(personal.destination_country)?.name} answers you have given so far.</p>
            <div className="onb-modal-foot">
              <Button variant="ghost" onPress={() => setSwitchTo(null)}>Cancel</Button>
              <Button variant="danger" onPress={() => applySwitch(switchTo)}>Switch anyway</Button>
            </div>
          </div>
        </div>
      )}
      {legalView && <LegalDocModal doc={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

function programProfile(cfa: Cfa): StudentProfile {
  return {
    degree: cfa.timing_education?.target_degree === "master" ? "Master" : "Bachelor",
    fields: (cfa.program_setup?.field_of_interest ?? "").split("|").filter(Boolean),
    maxBudget: numOrNull(cfa.program_setup?.max_budget),
    grade20: numOrNull(cfa.timing_education?.last_degree_grade),
    englishLevel: cfa.program_setup?.english_level ?? null,
    hasTest: cfa.program_setup?.has_english_test === "yes",
    testType: cfa.program_setup?.english_test_type ?? null,
    testScore: numOrNull(cfa.program_setup?.english_test_score),
  };
}

/* The last screen is the point of the whole thing: it hands back what the
   student just built, in their own answers, rather than announcing that a form
   was submitted. */
function Summary({
  personal, cfa, userNumber, onBack, saveState, agreeTerms, agreeRefund, legalError, onTerms, onRefund, onRead,
}: {
  personal: Personal; cfa: Cfa; userNumber: number | null; onBack?: () => void;
  saveState?: "idle" | "saving" | "saved" | "error";
  agreeTerms: boolean; agreeRefund: boolean; legalError: boolean;
  onTerms: () => void; onRefund: () => void; onRead: (d: "terms" | "refund") => void;
}) {
  const country = countryByCode(personal.destination_country);
  const plan = planById(cfa.pricing?.plan);
  const programId = Number((cfa.program_setup?.selected_programs ?? "").split("|").filter(Boolean)[0]);
  const program = PROGRAMS.find((p) => p.id === programId) ?? null;
  const intake = intakeByValue(cfa.timing_education?.intake_term)?.label ?? "—";
  const rows: { emoji: EmojiName; label: string; value: string }[] = [
    { emoji: country?.code === "LT" ? "flag-lt" : "globe", label: "Destination", value: country?.name ?? "—" },
    { emoji: "target", label: "Study goal", value: degreeLabel(cfa.timing_education?.target_degree ?? "") },
    { emoji: "graduation", label: "Programme", value: program ? program.name : "To be chosen with your advisor" },
    { emoji: "calendar", label: "Start", value: intake },
    { emoji: "card", label: "Service", value: plan?.name ?? "—" },
    { emoji: "handshake", label: "Advisor support", value: plan?.id === "full_service" ? "Included, end to end" : "On request, you drive it" },
  ];

  const who = personal.full_name ? `${personal.full_name.trim().split(/\s+/)[0]}, this` : "This";
  return (
    <div className="onb-summary">
      {onBack ? <BackButton onBack={onBack} className="onb-note-back" /> : <span className="onb-note-back" aria-hidden />}

      <div className="onb-summary-body">
        <Emoji name="party" size={72} className="onb-note-emoji" />
        <h1 className="onb-q onb-q-big">Your AfaqWay plan is ready.</h1>
        <p className="onb-sub">
          {who} is what we build from here{userNumber != null ? `, under student number AWU-${String(userNumber).padStart(3, "0")}` : ""}.
        </p>

        <ul className="onb-recap">
          {rows.map((r) => (
            <li key={r.label}>
              <Emoji name={r.emoji} size={22} />
              <span className="onb-recap-label">{r.label}</span>
              <span className="onb-recap-value">{r.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The two agreements sit against the button they gate, not at the end of
          a scroll: nobody should have to hunt for what is blocking Done. */}
      <div className="onb-legal" data-bad={legalError || undefined}>
        <SaveNote state={saveState} />
        <LegalLine checked={agreeTerms} onToggle={onTerms} onRead={() => onRead("terms")} text="I have read and agree to the Terms of Service." />
        <LegalLine checked={agreeRefund} onToggle={onRefund} onRead={() => onRead("refund")} text="I have read the Refund Policy." />
        {legalError && <p className="onb-err" role="alert">Please accept both before we start your file.</p>}
      </div>
    </div>
  );
}

function LegalLine({ checked, onToggle, onRead, text }: { checked: boolean; onToggle: () => void; onRead: () => void; text: string }) {
  return (
    <div className="onb-legal-line">
      <Checkbox isSelected={checked} onChange={onToggle} aria-label={text}>
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {text}
        </Checkbox.Content>
      </Checkbox>
      <button type="button" className="onb-legal-read" onClick={onRead}>Read</button>
    </div>
  );
}
