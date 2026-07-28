"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown, CircleCheck, Clock3, FileText, GraduationCap, Landmark, Lock,
  Plane, Route, SkipForward,
} from "lucide-react";
import { assembleRoadmap, roadmapProgress, stepDocuments, STATE_BADGE, type JourneyStage, type JourneyStep } from "@/lib/journey";
import {
  fetchApprovals, fetchDocuments, fetchProgress, fetchStages, fetchSteps, logEvent,
  requestStageApproval, setStepState, subscribeJourney, type DbDocument, type Plan,
} from "@/lib/journeyDb";
import { Loader, Pill } from "@/components/ds";
import type { WsProfile } from "../Modules";
import { JourneyStepModal } from "./JourneyStepModal";
import { MarkDoneDialog } from "./MarkDoneDialog";
import { InfoCard, JrButton, StepStatusIcon } from "./parts";

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
  const [confirming, setConfirming] = useState<{ stage: JourneyStage; step: JourneyStep } | null>(null);
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
    const built = assembleRoadmap(dbStages, dbSteps, progress, approvals);
    setStages(built);
    setUploads(docs);
    setExpanded((cur) => cur ?? built.find((s) => s.state === "current" || s.state === "waiting_approval")?.id ?? built[0]?.id ?? null);
    setLoading(false);
  }, [profile.plan, profile.userId, profile.academic?.targetDegree]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  /* Live sync: any journey change an administrator makes, new content, a new
     document requirement, an approval, arrives here with no page refresh. */
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

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

  const openDocuments = (stage: JourneyStage, step: JourneyStep) => {
    // Hand the Documents module the exact step so nothing has to be searched for.
    try {
      sessionStorage.setItem("af.journey.focus", JSON.stringify({ stageId: stage.id, stepId: step.id, stepTitle: step.title }));
    } catch { /* storage blocked */ }
    setDetail(null);
    onNav("documents");
  };

  /* A student submits work; an administrator approves it. */
  const submitStep = async (stage: JourneyStage, step: JourneyStep, comment: string) => {
    setBusy(step.id);
    await setStepState(profile.userId, step.id, "in_progress", comment);
    await logEvent({
      user_id: profile.userId, step_id: step.id, stage_id: stage.id,
      kind: "submitted", actor: "student", message: comment || "Marked the step as done.",
    });
    setConfirming(null);
    await load();
    setBusy(null);
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
          const locked = s.state === "locked";
          return (
            <button
              key={s.id} type="button" disabled={locked}
              className={`jr-navcard ${s.state}${expanded === s.id ? " open" : ""}`}
              onClick={() => !locked && setExpanded(expanded === s.id ? null : s.id)}
              aria-label={`Stage ${s.index}: ${s.title}`}
            >
              <span className="jr-navtop">
                <span className={`jr-navico tone-${s.tone}`}>{locked ? <Lock size={15} /> : <Icon size={17} />}</span>
                <span className="jr-navnum">Stage {String(s.index).padStart(2, "0")}</span>
              </span>
              <span className="jr-navtitle">{s.title}</span>
              <span className="jr-navfoot">
                <Pill tone={STATE_BADGE[s.state].tone} size="sm" className="jr-navbadge">{STATE_BADGE[s.state].label}</Pill>
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
                <Pill tone={locked ? "grey" : badge.tone}>{locked ? "Locked" : badge.label}</Pill>
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
                    {stage.steps.map((step) => {
                      const docs = stepDocuments(step, uploads);
                      const blocked = docs.missingRequired > 0;
                      const actionable = step.state === "pending" || step.state === "rejected";
                      return (
                        <li key={step.id} className={`jr-step ${step.state}`}>
                          <div className="jr-step-main">
                            <StepStatusIcon state={step.state} />
                            <div className="jr-step-body">
                              <span className="jr-step-num">
                                Step {step.index}{step.due ? ` · ${step.due}` : ""}
                                {docs.required > 0 && ` · ${docs.verified}/${docs.required} documents`}
                              </span>
                              <div className="jr-step-title">{step.title}</div>
                              <p className="jr-step-desc">{step.description}</p>
                              {blocked && actionable && (
                                <p className="jr-step-block">Complete document upload first.</p>
                              )}
                            </div>
                          </div>

                          <div className="jr-step-acts">
                            {actionable && (
                              <JrButton
                                tone="primary" disabled={busy === step.id || blocked}
                                title={blocked ? "Complete document upload first." : undefined}
                                onClick={() => (blocked ? undefined : docs.required > 0 ? submitStep(stage, step, "") : setConfirming({ stage, step }))}
                              >
                                {busy === step.id ? "Saving…" : "Mark as Done"}
                              </JrButton>
                            )}
                            {step.state === "submitted" && (
                              <JrButton disabled={busy === step.id} onClick={() => undoSubmit(step)}>Undo submit</JrButton>
                            )}
                            {actionable && step.allowSkip && (
                              <JrButton icon={<SkipForward size={14} />} disabled={busy === step.id} onClick={() => skipStep(stage, step)}>
                                Skip
                              </JrButton>
                            )}
                            <JrButton tone="outline" onClick={() => setDetail({ stage, step })}>View Details</JrButton>
                          </div>
                        </li>
                      );
                    })}
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
          onClose={() => setDetail(null)} onOpenDocuments={openDocuments}
          onOpenChat={() => { setDetail(null); onNav("messages"); }}
        />
      )}

      {confirming && (
        <MarkDoneDialog
          step={confirming.step} open
          onCancel={() => setConfirming(null)}
          onConfirm={(comment) => submitStep(confirming.stage, confirming.step, comment)}
        />
      )}
    </div>
  );
}

export default JourneyRoadmap;
