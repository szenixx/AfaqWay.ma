"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown, CircleCheck, Clock3, Eye, FileText, FlaskConical, GraduationCap, Landmark, Lock,
  Plane, Play, Route, SkipForward,
} from "lucide-react";
import { assembleRoadmap, roadmapProgress, stepDocuments, STATE_BADGE, STATE_STATUS, type JourneyStage, type JourneyStep } from "@/lib/journey";
import { iconForStep } from "@/lib/journeyStepIcons";
/* Shared with the dashboard's Next Steps snapshot so the two cannot drift. */
import { STEP_ICON_TONE } from "./StepPreview";
import {
  fetchApprovals, fetchDocuments, fetchProgress, fetchStages, fetchSteps, logEvent,
  mergeStepMeta, requestStageApproval, setStepState, subscribeJourney,
  type DbDocument, type Plan, type StepMeta,
} from "@/lib/journeyDb";
import {
  announceStage, emitJourneyEvent, saveVfsAppointment, type Appointment,
} from "@/lib/journeyEvents";
import { Loader, Status } from "@/components/ds";
import type { WsProfile } from "../Modules";
import { JourneyStepModal } from "./JourneyStepModal";
import { MarkDoneDialog } from "./MarkDoneDialog";
import { CompleteDialog } from "./CompleteDialog";
import { VfsAppointmentDialog } from "./VfsAppointmentDialog";
import { TrpDecisionDialog, TrpCelebration, JourneyCompleteCelebration, type TrpOutcome } from "./TrpDecisionDialog";
import { OptionalModule, ModuleDialog, type ModuleDialogKind } from "./OptionalModule";
import { SUPPORT_WHATSAPP } from "@/config/support";
import { InfoCard, JrButton } from "./parts";

/* The Journey page — a roadmap of stages, not a checklist.

   One stage is unlocked at a time; steps inside it can be done in any order. A
   student submits a step and an advisor approves it. Everything rendered here
   comes from the database, and a realtime subscription keeps it current, so an
   administrator's edit appears without a refresh. */

const STAGE_ICONS = [Landmark, GraduationCap, Route, FileText, Plane, Clock3];

export function JourneyRoadmap({ profile, onNav, isAdmin }: { profile: WsProfile; onNav: (id: string) => void; isAdmin?: boolean }) {
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [uploads, setUploads] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ stage: JourneyStage; step: JourneyStep } | null>(null);
  /* One "what is being completed" slot, with the shape of dialog the step's own
     rules ask for. Four separate booleans is how two dialogs end up open at once. */
  const [acting, setActing] = useState<
    { kind: "submit" | "confirm" | "appointment" | "decision"; stage: JourneyStage; step: JourneyStep } | null
  >(null);
  const [celebrating, setCelebrating] = useState(false);
  /* Which optional modules are expanded, and which dialog one of them is asking.
     Expanded-by-default once enabled: a student who just switched it on wants to
     see what they got. */
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [moduleAsk, setModuleAsk] = useState<{ kind: ModuleDialogKind; step: JourneyStep } | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const plan = (profile.plan ?? "self_service") as Plan;
    // The journey is per degree: a Bachelor roadmap must not show to a Master
    // student. An unset degree sees everything, so nobody is locked out.
    const dbStages = await fetchStages(plan, "LT", false, profile.academic?.targetDegree);
    const dbSteps = await fetchSteps(dbStages.map((s) => s.id));
    const [progress, approvals, docs] = await Promise.all([
      fetchProgress(profile.userId), fetchApprovals(profile.userId), fetchDocuments(profile.userId),
    ]);
    const built = assembleRoadmap(dbStages, dbSteps, progress, approvals, {
      plan: profile.plan, tester: profile.tester,
    });
    setStages(built);
    setUploads(docs);
    setExpanded((cur) => {
      const inPlay = built.find((s) => s.state === "current" || s.state === "waiting_approval");
      /* Nothing left to work on and the only thing still ahead is a stage this
         plan excludes: a Self Service student who has just finished Stage 4 has
         reached the end of their journey, so Stage 5 opens itself rather than
         sitting shut under a padlock they have to think to click. */
      if (!inPlay) {
        const upsell = built.find((s) => s.planLocked && s.total > 0);
        if (upsell) return upsell.id;
      }
      return cur ?? inPlay?.id ?? built[0]?.id ?? null;
    });
    setLoading(false);
  }, [profile.plan, profile.userId, profile.tester, profile.academic?.targetDegree]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  /* Live sync: any journey change an administrator makes, new content, a new
     document requirement, an approval, arrives here with no page refresh. */
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  /* ── Stage unlock automation ──────────────────────────────────────────────
     "Immediately after the student completes Stage 3 and Stage 4 becomes
     unlocked: automatically send an Important Preparation notification … the
     platform notification and WhatsApp message should be sent only once."

     Once is enforced in the database by a dedupe key, not here: a second tab, a
     refresh or a realtime reload must not produce a second warning. The ref only
     keeps this from making the same no-op call on every render. */
  const announced = useRef(new Set<string>());
  useEffect(() => {
    const open = stages.find((s) => s.state === "current" || s.state === "waiting_approval");
    if (!open) return;

    const key = `stage:${open.id}`;
    if (!announced.current.has(key)) {
      announced.current.add(key);
      void emitJourneyEvent("stage_unlocked", {
        ctx: { stage: open.title }, stageId: open.id, once: key,
      });
    }

    for (const step of open.steps) {
      if (!step.announce || announced.current.has(step.id)) continue;
      announced.current.add(step.id);
      void announceStage({
        userId: profile.userId, stepId: step.id, stageId: open.id, announce: step.announce,
      });
    }
  }, [stages, profile.userId]);

  /* ── The end of the journey ───────────────────────────────────────────────
     Every stage the student can actually enter is complete. Plan-locked stages
     do not count: a Self Service student has finished their journey when Stage 4
     is done, and telling them otherwise because Stage 5 exists would be wrong.

     Shown once per browser. The database has no "journey finished" flag, and
     inventing one to drive a confetti burst would be a schema change for an
     animation. */
  useEffect(() => {
    if (!stages.length || finished) return;
    const reachable = stages.filter((s) => !s.planLocked && s.total > 0);
    if (!reachable.length || !reachable.every((s) => s.state === "completed")) return;
    try {
      const key = `af.journey.done.${profile.userId}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { /* storage blocked — show it, once per session is close enough */ }
    // Reacting to the roadmap reaching a terminal state, not deriving render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFinished(true);
  }, [stages, finished, profile.userId]);

  /* ── The optional-module reminder ─────────────────────────────────────────
     "When a student completes every normal Stage 3 step WITHOUT enabling the
     sponsorship module, display a reminder dialog."

     Offered once, at the moment the rest of the stage is finished — which is
     the last point at which enabling it still saves them a delay. "No Thanks"
     writes moduleReminderDismissed and it is never offered again.

     Deliberately does not fire while another dialog is open: interrupting a
     student mid-completion with an unrelated offer is how a prompt gets
     dismissed without being read. */
  useEffect(() => {
    if (moduleAsk || acting) return;
    for (const stage of stages) {
      if (stage.state !== "current" && stage.state !== "waiting_approval") continue;
      const modules = stage.steps.filter((s) => s.moduleKey);
      if (!modules.length) continue;
      // Every step that is not a module container, and not one of its children.
      const ordinary = stage.steps.filter((s) => !s.moduleKey);
      if (!ordinary.length || !ordinary.every((s) => s.state === "completed" || s.state === "skipped")) continue;

      const offer = modules.find((m) => !m.moduleEnabled && !m.moduleReminderDismissed && m.moduleDialogs.remind);
      if (offer) {
        // Reacting to the stage reaching a terminal state, not deriving render state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModuleAsk({ kind: "remind", step: offer });
        return;
      }
    }
  }, [stages, moduleAsk, acting]);

  /* Coming back from an upload reopens the step that sent the student away. */
  useEffect(() => {
    if (!stages.length) return;
    try {
      const raw = sessionStorage.getItem("af.journey.open");
      if (!raw) return;
      sessionStorage.removeItem("af.journey.open");
      const want = JSON.parse(raw) as { stepId?: string; stageId?: string };
      for (const stage of stages) {
        const step = stage.steps.find((s) => s.id === want.stepId);
        if (step) {
          // Reacting to a hand-off left in session storage by the Documents
          // module; this is external state, not derived render state.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setExpanded(stage.id);
          setDetail({ stage, step });
          return;
        }
      }
    } catch { /* storage blocked or malformed */ }
  }, [stages]);

  const overall = roadmapProgress(stages);

  /* A student submits work; an administrator approves it. */
  const submitStep = async (stage: JourneyStage, step: JourneyStep, comment: string) => {
    setBusy(step.id);
    await setStepState(profile.userId, step.id, "in_progress", comment);
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "submitted", actor: "student", message: comment || "Marked the step as done.",
    });
    setActing(null);
    await load();
    setBusy(null);
  };

  /* ── Self-completion ────────────────────────────────────────────────────────
     The steps the Excel hands to the student: "Do not require admin approval …
     automatically mark the step as Completed and unlock the next Journey step."

     The database guard checks the same rule, so this is the convenient path and
     not the only one: a request that skipped this function still could not
     complete a reviewed step. */
  const completeStep = async (
    stage: JourneyStage, step: JourneyStep, meta?: StepMeta, message = "Completed this step.",
  ) => {
    setBusy(step.id);
    await setStepState(profile.userId, step.id, "completed", undefined, meta);
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "completed", actor: "student", message,
    });
    await emitJourneyEvent("step_completed", {
      ctx: { step: step.title, stage: stage.title }, stepId: step.id, stageId: stage.id,
      once: `step-done:${step.id}`,
    });
    setActing(null);
    await load();
    setBusy(null);
  };

  /* "Save the appointment date, time, and timezone in the database. Automatically
     create a new event in the student's Schedule module … create automatic
     reminders." Then, and only then, the step completes. */
  const saveAppointment = async (stage: JourneyStage, step: JourneyStep, appointment: Appointment) => {
    setBusy(step.id);
    const eventId = await saveVfsAppointment({
      userId: profile.userId, stepId: step.id, stageId: stage.id,
      appointment, previousEventId: step.meta.eventId,
    });
    await completeStep(
      stage, step,
      { ...step.meta, appointment, eventId: eventId ?? step.meta.eventId },
      `Booked the VFS appointment for ${appointment.date} at ${appointment.time}.`,
    );
  };

  /* The residence permit outcome. Approved completes the step and opens the next
     stage; rejected deliberately does not — "keep the current step active" — and
     opens the conversation instead. */
  const decideTrp = async (stage: JourneyStage, step: JourneyStep, outcome: TrpOutcome) => {
    setBusy(step.id);
    if (outcome === "approved") {
      await emitJourneyEvent("trp_approved", { stepId: step.id, stageId: stage.id, once: `trp:${step.id}` });
      await completeStep(stage, step, { ...step.meta, decision: "approved" }, "Reported an approved residence permit.");
      setCelebrating(true);
      return;
    }

    await mergeStepMeta(profile.userId, step.id, { ...step.meta, decision: "rejected" });
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "trp_rejected", actor: "student", message: "Reported a rejected residence permit.",
    });
    await emitJourneyEvent("trp_rejected", { stepId: step.id, stageId: stage.id, once: `trp:${step.id}` });
    setActing(null);
    await load();
    setBusy(null);
    // "Automatically open the Platform Chat" — the support conversation is where
    // a rejection is handled, so the student is taken straight there.
    onNav("messages");
  };

  /**
   * "Chat with Support" — Stage 5's first step.
   *
   * The student is not reporting work done, they are asking for help after
   * landing in a new country. So this submits the step for review (which is what
   * puts it in the administrator's queue) carrying the details the Excel asks
   * the request to include, opens the conversation so they can start talking
   * straight away, and waits. Approving it is what unlocks the rest of Stage 5.
   */
  const requestSupport = async (stage: JourneyStage, step: JourneyStep) => {
    setBusy(step.id);
    const details = [
      `Support request from ${profile.fullName ?? "a student"}.`,
      profile.whatsapp ? `WhatsApp: ${profile.whatsapp}` : null,
      profile.study?.university && profile.study.university !== "—" ? `University: ${profile.study.university}` : null,
      "Journey: Bachelor · Lithuania",
      `Stage: ${stage.title}`,
      `Step: ${step.title}`,
    ].filter(Boolean).join("\n");

    await setStepState(profile.userId, step.id, "in_progress", details);
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "support_requested", actor: "student", message: details,
    });
    await load();
    setBusy(null);
    onNav("messages");
  };

  /* ── Optional modules ──────────────────────────────────────────────────────
     Enabling writes one flag on the container's own progress row. The child
     steps already exist in the database, so nothing is created or destroyed —
     they simply start counting, and start being shown.

     Disabling is the same write in reverse. Uploads are deliberately left
     alone: "Previously uploaded documents will remain stored in the Documents
     Module unless removed separately." A student who switches the module back
     on finds their work where they left it. */
  const setModuleEnabled = async (step: JourneyStep, enabled: boolean) => {
    setBusy(step.id);
    await mergeStepMeta(profile.userId, step.id, { ...step.meta, moduleEnabled: enabled });
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: null,
      kind: enabled ? "module_enabled" : "module_disabled", actor: "student",
      message: `${enabled ? "Enabled" : "Disabled"} the ${step.title} module.`,
    });
    setOpenModules((set) => {
      const next = new Set(set);
      if (enabled) next.add(step.id); else next.delete(step.id);
      return next;
    });
    setModuleAsk(null);
    await load();
    setBusy(null);
  };

  /** "No Thanks" on the reminder: never offer it again. */
  const dismissModuleReminder = async (step: JourneyStep) => {
    setModuleAsk(null);
    await mergeStepMeta(profile.userId, step.id, { ...step.meta, moduleReminderDismissed: true });
    await load();
  };

  /** Opens whichever dialog this step's rules call for. */
  const startCompletion = (stage: JourneyStage, step: JourneyStep) => {
    if (step.support) return void requestSupport(stage, step);
    if (step.completion === "decision") return setActing({ kind: "decision", stage, step });
    if (step.capture === "vfs_appointment") return setActing({ kind: "appointment", stage, step });
    if (step.completion === "self") {
      /* Most of Stage 4 asks a question first. Stage 5's steps are "Done" and
         nothing more, so a step with no question and no checklist completes on
         the click — opening a dialog with nothing in it would be a dead button. */
      if (!step.confirm && step.gate.length === 0) return void completeStep(stage, step);
      return setActing({ kind: "confirm", stage, step });
    }
    // The default: submit for review, with an optional note for the advisor.
    if (step.requirements.length > 0) return void submitStep(stage, step, "");
    return setActing({ kind: "submit", stage, step });
  };

  const undoSubmit = async (step: JourneyStep) => {
    setBusy(step.id);
    await setStepState(profile.userId, step.id, "pending");
    await load();
    setBusy(null);
  };

  const skipStep = async (stage: JourneyStage, step: JourneyStep) => {
    setBusy(step.id);
    await setStepState(profile.userId, step.id, "skipped");
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "skipped", actor: "student", message: "Skipped this step.",
    });
    await load();
    setBusy(null);
  };

  const submitStage = async (stage: JourneyStage) => {
    setBusy(stage.id);
    await requestStageApproval(profile.userId, stage.id);
    await logEvent({
      user_id: profile.userId, step_id: null, stage_id: stage.id,
      kind: "stage_submitted", actor: "student", message: "Sent the stage for approval.",
    });
    await load();
    setBusy(null);
  };


  /* One step row, used for ordinary steps AND for an optional module's
     sub-steps. Extracted rather than duplicated: the brief asks sub-steps to
     "use the same mini-step component used throughout the Journey", and a
     second copy is how the two quietly stop matching. */
  const renderStep = (stage: JourneyStage, step: JourneyStep) => {
    const docs = stepDocuments(step, uploads);
    const blocked = docs.missingRequired > 0;
    /* Held shut by the stage's own order (rules.requiresSteps): an earlier
       step in this stage is not approved yet. Distinct from `blocked`
       above, which is only about missing uploads on THIS step. */
    const gated = step.blockedBy.length > 0;
    const actionable = (step.state === "pending" || step.state === "rejected") && !gated;
    /* Full Service never reports the residence permit outcome:
       "hide the Mark as Completed button … the application
       status is managed entirely by administrators." */
    const adminOnly = step.completion === "decision" && profile.plan !== "self_service";
    /* A step that names its own button ("Chat with Support") carries that
       wording on the action inside the module, not out here — the card's
       job is only to get you in. See JourneyStepModal's footer. */

    const StepIcon = iconForStep(step.title);
    const iconTone = STEP_ICON_TONE[step.state] ?? "grey";

    return (
      <li key={step.id} className={`jr-step ${step.state}${gated ? " gated" : ""}`}>
        <span aria-hidden className={`jr-step-bg tone-${iconTone}`}><StepIcon size={110} /></span>
        <div className="jr-step-main">
          <span className={`jr-step-ico tone-${iconTone}`}><StepIcon size={16} /></span>
          <div className="jr-step-body">
            {/* The step's state is the shared Status, not a
                bespoke glyph: the word is always rendered, so
                colour is never the only carrier. */}
            <span className="jr-step-num">
              Step {step.index}{step.due ? ` · ${step.due}` : ""}
              {docs.required > 0 && ` · ${docs.verified}/${docs.required} documents`}
            </span>
            {/* The title leads: it is what the student is
                actually being asked to do. The state rides
                beside it, small enough not to compete. */}
            <div className="jr-step-title">
              {step.title}
              <Status state={STATE_STATUS[step.state]} label={STATE_BADGE[step.state].label} size="xs" />
            </div>
            <p className="jr-step-desc">{step.description}</p>

            {/* "Display a checklist showing any incomplete
                prerequisites." A locked step that says only
                "locked" tells the student nothing they can act on. */}
            {step.blockedBy.length > 0 && (
              <div className="jr-prereq">
                <span className="jr-prereq-head">Finish these first</span>
                <ul>{step.blockedBy.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}

            {blocked && actionable && (
              <p className="jr-step-block">Complete document upload first.</p>
            )}
            {adminOnly && step.state !== "completed" && (
              <p className="jr-step-block">
                Our team records this decision for you. You do not need to do anything.
              </p>
            )}
            {step.meta.appointment && (
              <p className="jr-step-note">
                Appointment saved for {step.meta.appointment.date} at {step.meta.appointment.time}.
              </p>
            )}
          </div>
        </div>

        <div className="jr-step-acts">
          {/* One way in. Everything the student does with a step — reading
              it, uploading to it, finishing it — happens inside the module
              this opens, so the card carries a single obvious action
              instead of a row of competing ones.

              Start and View are opposite invitations, so they get opposite
              weight: a step with work waiting reads as a solid call to
              action, one that is merely readable reads as quiet. Rendering
              both as the same solid primary is what made them feel
              interchangeable. */}
          {gated ? (
            /* Not startable yet. The real Start button is still rendered, then
               blurred out behind a crisp lock: the student sees the action that
               is coming and that it is held shut, rather than a button that
               simply is not there. The lock sits in its own layer so the blur
               never touches it. */
            <span className="jr-locked-act" title={`Finish first: ${step.blockedBy.join(", ")}`}>
              <JrButton tone="primary" size="md" icon={<Play size={15} />} disabled>
                Start
              </JrButton>
              <span className="jr-locked-badge" aria-hidden><Lock size={16} /></span>
            </span>
          ) : actionable && !adminOnly ? (
            <JrButton tone="primary" size="md" icon={<Play size={15} />} onClick={() => setDetail({ stage, step })}>
              {step.state === "rejected" ? "Fix it" : "Start"}
            </JrButton>
          ) : (
            <JrButton tone="outline" size="md" icon={<Eye size={15} />} onClick={() => setDetail({ stage, step })}>
              View
            </JrButton>
          )}

          {/* Secondary, and deliberately still on the card: each one is a way
              OUT of a state the module itself cannot offer — undoing a
              submission, moving a booked appointment, skipping an optional
              step. Small, so the primary action stays unmistakable. */}
          {step.capture === "vfs_appointment" && step.state === "completed" && (
            <JrButton
              disabled={busy === step.id}
              onClick={() => setActing({ kind: "appointment", stage, step })}
            >
              Change appointment
            </JrButton>
          )}
          {step.state === "submitted" && (
            <JrButton disabled={busy === step.id} onClick={() => undoSubmit(step)}>
              {step.support ? "Cancel request" : "Undo submit"}
            </JrButton>
          )}
          {actionable && step.allowSkip && (
            <JrButton icon={<SkipForward size={14} />} disabled={busy === step.id} onClick={() => skipStep(stage, step)}>
              Skip
            </JrButton>
          )}
        </div>
      </li>
    );
  };

  if (loading) return <div className="jr-root"><Loader size={48} block label="Loading your roadmap" /></div>;

  if (!stages.length) {
    return (
      <div className="jr-root">
        <div className="jr-empty">
          <span className="jr-empty-ico"><Route size={28} /></span>
          <h2 className="jr-empty-title">No journey has been configured yet</h2>
          <p className="jr-empty-text">
            Your roadmap appears here as soon as your advisor publishes it for the
            {profile.plan === "full_service" ? " Full Service" : " Self Service"} plan.
          </p>
          {isAdmin && <JrButton tone="primary" size="md" onClick={() => onNav("journey-manager")}>Go to Journey Manager</JrButton>}
        </div>
      </div>
    );
  }

  return (
    <div className="jr-root">
      {/* ── Header ── */}
      <header className="jr-head">
                <div style={{ minWidth: 0 }}>
          <h1 className="jr-title">Your roadmap</h1>
          <p className="jr-sub">
            {stages.length} stages from application to arrival. Work through the steps of your current
            stage in any order, then send the stage to your advisor.
          </p>
          {/* Unlocking the whole roadmap silently would read as a bug, and worse,
              a tester could mistake an open stage for one they had earned. */}
          {profile.tester && (
            <p className="jr-testerbar">
              <FlaskConical size={14} aria-hidden />
              <span>
                <b>Tester access.</b> Every stage and step is open for review, whatever your real
                progress. Other accounts are unaffected, and completing a step still follows the
                normal rules.
              </span>
            </p>
          )}
        </div>
        <div className="jr-overall">
          <span className="jr-overall-pct">{overall.pct}%</span>
          <span className="jr-overall-label">{overall.done} of {overall.total} steps</span>
        </div>
      </header>

      {/* ── Stage navigator: equal cards, status and progress on one row ── */}
      <nav className="jr-nav" aria-label="Stages">
        {stages.map((s, i) => {
          const Icon = STAGE_ICONS[i % STAGE_ICONS.length];
          /* A stage excluded by plan is locked exactly like a stage locked by
             sequence: one locked treatment, no special case. The upgrade lives
             on the stage card further down, not up here. */
          const locked = s.state === "locked";
          return (
            <button
              key={s.id} type="button" disabled={locked}
              className={`jr-navcard ${s.state}${s.planLocked ? " plan-locked" : ""}${expanded === s.id ? " open" : ""}`}
              onClick={() => !locked && setExpanded(expanded === s.id ? null : s.id)}
              aria-label={`Stage ${s.index}: ${s.title}${s.planLocked ? " — Full Service only" : ""}`}
            >
              {/* Locked like any other locked stage, but locked for a different
                  reason: this one never opens with time, only with a plan. The
                  badge is the only thing that says so up here. */}
              {s.planLocked && <span className="jr-navplan" aria-hidden>Full Service</span>}
              <span className="jr-navtop">
                <span className={`jr-navico tone-${s.tone}`}>{locked ? <Lock size={15} /> : <Icon size={17} />}</span>
                <span className="jr-navnum">Stage {String(s.index).padStart(2, "0")}</span>
              </span>
              <span className="jr-navtitle">{s.title}</span>
              <span className="jr-navfoot">
                <Status state={STATE_STATUS[s.state]} label={STATE_BADGE[s.state].label} variant="plain" className="jr-navbadge" />
                <span className="jr-navbar"><span style={{ width: `${s.pct}%` }} /></span>
                <span className="jr-navpct">{s.done}/{s.total}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Stages ── */}
      <div className="jr-stages">
        {stages.map((stage, i) => {
          const Icon = STAGE_ICONS[i % STAGE_ICONS.length];
          const locked = stage.state === "locked";
          const open = expanded === stage.id && !locked;
          const badge = STATE_BADGE[stage.state];

          /* A stage the plan excludes is shown, not hidden: the header stays
             sharp so a Self Service student can read what Stage 5 covers, and
             the steps behind it are blurred with the upgrade over them. Hiding
             it would make the roadmap look shorter than it is.

             It collapses like every other stage, and starts closed: the upgrade
             pitch is something a student opens, not something that sits open at
             the foot of the page. It shares the one `expanded` slot, so opening
             it closes whatever stage was open — the same rule as the rest. */
          if (stage.planLocked) {
            const openLocked = expanded === stage.id;
            return (
              <section key={stage.id} className={`jr-stage plan-locked${openLocked ? " open" : ""}`}>
                <button
                  type="button" className="jr-stage-head"
                  onClick={() => setExpanded(openLocked ? null : stage.id)}
                  aria-expanded={openLocked}
                >
                  <span className={`jr-stage-ico tone-${stage.tone}`}><Icon size={20} /></span>
                  <span className="jr-stage-meta">
                    <span className="jr-stage-num">Stage {stage.index}</span>
                    <span className="jr-stage-title">{stage.title}</span>
                  </span>
                  <Status state="neutral" label="Locked" />
                  <Lock size={16} className="jr-stage-lock" />
                  <ChevronDown size={17} className="jr-stage-chev" />
                </button>

                <div className="jr-planlock" hidden={!openLocked}>
                  {/* Inert and hidden from assistive technology: it is a texture
                      showing there is something here, not readable content. */}
                  <ol className="jr-planlock-ghost" aria-hidden inert>
                    {stage.steps.slice(0, 5).map((s) => (
                      <li key={s.id}>
                        <span className="jr-planlock-ghost-title">{s.title}</span>
                        <span className="jr-planlock-ghost-desc">{s.description}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="jr-planlock-card">
                    <span className="jr-planlock-ico"><Lock size={20} /></span>
                    <p className="jr-planlock-title">Not included in Self Service</p>
                    <p className="jr-planlock-text">
                      This stage is available only with the Full Service plan. {stage.total} steps that help
                      you settle in Lithuania after you arrive: accommodation, registration, banking,
                      healthcare, transport and university life.
                    </p>
                    <JrButton tone="primary" size="md" onClick={() => onNav("subscription")}>
                      Upgrade to Full Service
                    </JrButton>
                  </div>
                </div>
              </section>
            );
          }

          return (
            <section key={stage.id} className={`jr-stage ${stage.state}${open ? " open" : ""}`}>
              <button
                type="button" className="jr-stage-head" disabled={locked}
                onClick={() => !locked && setExpanded(open ? null : stage.id)}
                aria-expanded={open}
              >
                <span className={`jr-stage-ico tone-${stage.tone}`}><Icon size={20} /></span>
                <span className="jr-stage-meta">
                  <span className="jr-stage-num">Stage {stage.index}</span>
                  <span className="jr-stage-title">{stage.title}</span>
                </span>
                <Status state={locked ? "neutral" : STATE_STATUS[stage.state]} label={locked ? "Locked" : badge.label} />
                {!locked && <span className="jr-stage-count">{stage.done}/{stage.total}</span>}
                {locked ? <Lock size={16} className="jr-stage-lock" /> : <ChevronDown size={17} className="jr-stage-chev" />}
              </button>

              {!locked && (
                <div className="jr-stage-bar">
                  <span className="rp-progress"><span className="rp-progress-fill" style={{ width: `${stage.pct}%` }} /></span>
                </div>
              )}

              {open && (
                <div className="jr-stage-body">
                  <p className="jr-stage-desc">{stage.description}</p>

                  {stage.approval === "rejected" && (
                    <InfoCard title="Changes requested" tone="red">
                      Your advisor asked for changes before this stage can be approved. Review the steps
                      below, then send the stage for approval again.
                      <div style={{ marginTop: 10 }}>
                        <JrButton tone="primary" disabled={busy === stage.id} onClick={() => submitStage(stage)}>
                          {busy === stage.id ? "Sending…" : "Send for approval again"}
                        </JrButton>
                      </div>
                    </InfoCard>
                  )}

                  {stage.state === "waiting_approval" && stage.approval !== "rejected" && (
                    stage.approval === "waiting" ? (
                      <InfoCard title="Waiting for approval" tone="amber" icon={<Clock3 size={18} />}>
                        Every step is approved. Your advisor is now reviewing the stage, and the next one
                        unlocks after that approval.
                      </InfoCard>
                    ) : (
                      <InfoCard title="Ready for your advisor" tone="green" icon={<CircleCheck size={18} />}>
                        Every step in this stage is approved. Send it to your advisor to unlock the next stage.
                        <div style={{ marginTop: 10 }}>
                          <JrButton tone="primary" disabled={busy === stage.id} onClick={() => submitStage(stage)}>
                            {busy === stage.id ? "Sending…" : "Send stage for approval"}
                          </JrButton>
                        </div>
                      </InfoCard>
                    )
                  )}

                  {/* ── Steps: status icon and text left, actions right ── */}
                  <ol className="jr-timeline">
                    {stage.steps.map((step) => (
                      step.moduleKey
                        ? (
                          <OptionalModule
                            key={step.id} step={step}
                            open={openModules.has(step.id)}
                            onToggleOpen={() => setOpenModules((set) => {
                              const next = new Set(set);
                              if (next.has(step.id)) next.delete(step.id); else next.add(step.id);
                              return next;
                            })}
                            busy={busy === step.id}
                            onEnable={() => setModuleAsk({ kind: "enable", step })}
                            onDisable={() => setModuleAsk({ kind: "disable", step })}
                            renderStep={(child) => renderStep(stage, child)}
                          />
                        )
                        : renderStep(stage, step)
                    ))}
                  </ol>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {detail && (
        <JourneyStepModal
          stage={detail.stage} step={detail.step} open userId={profile.userId}
          plan={profile.plan} study={profile.study}
          onClose={() => setDetail(null)}
          onOpenChat={() => { setDetail(null); onNav("messages"); }}
          /* Delegates to the same router the card used to call, so a step
             with its own dialog (appointment, TRP decision, support
             request) still gets that dialog rather than a bare submit. */
          onMarkDone={() => { const d = detail; setDetail(null); startCompletion(d.stage, d.step); }}
          onChanged={() => { void load(); }}
          highlightChat={detail.stage.index === stages.length}
        />
      )}

      {/* One slot, four shapes: which one opens is decided by the step's own
          rules, so adding a fifth never means another boolean here. */}
      {acting?.kind === "submit" && (
        <MarkDoneDialog
          step={acting.step} open
          onCancel={() => setActing(null)}
          onConfirm={(comment) => submitStep(acting.stage, acting.step, comment)}
        />
      )}

      {acting?.kind === "confirm" && acting.step.confirm && (
        <CompleteDialog
          open title={acting.step.title}
          confirm={acting.step.confirm} gate={acting.step.gate}
          busy={busy === acting.step.id}
          onCancel={() => setActing(null)}
          onConfirm={(ticked) =>
            completeStep(acting.stage, acting.step, { ...acting.step.meta, gate: ticked })}
        />
      )}

      {acting?.kind === "appointment" && (
        <VfsAppointmentDialog
          open existing={acting.step.meta.appointment ?? null}
          busy={busy === acting.step.id}
          onCancel={() => setActing(null)}
          onSave={(appointment) => saveAppointment(acting.stage, acting.step, appointment)}
        />
      )}

      {acting?.kind === "decision" && (
        <TrpDecisionDialog
          open busy={busy === acting.step.id}
          onCancel={() => setActing(null)}
          onDecide={(outcome) => decideTrp(acting.stage, acting.step, outcome)}
        />
      )}

      {moduleAsk && (
        <ModuleDialog
          kind={moduleAsk.kind} step={moduleAsk.step} open
          busy={busy === moduleAsk.step.id}
          onCancel={() => (moduleAsk.kind === "remind"
            ? void dismissModuleReminder(moduleAsk.step)
            : setModuleAsk(null))}
          onConfirm={() => void setModuleEnabled(moduleAsk.step, moduleAsk.kind !== "disable")}
        />
      )}

      <TrpCelebration open={celebrating} onClose={() => setCelebrating(false)} />

      <JourneyCompleteCelebration
        open={finished}
        name={(profile.fullName ?? "").split(" ")[0]}
        whatsapp={SUPPORT_WHATSAPP}
        onClose={() => setFinished(false)}
      />
    </div>
  );
}

export default JourneyRoadmap;
