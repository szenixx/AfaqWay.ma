"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Eye, Inbox, RotateCcw, XCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Loader, Pill } from "@/components/ds";
import { stepApproveOnly, stepIsSupport, subscribeJourney, type DbStep, type Plan } from "@/lib/journeyDb";
import { whatsappLink } from "@/lib/whatsapp";
import { deriveStudy } from "@/lib/studyApplication";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { ReviewModal, type ReviewTarget } from "./ReviewModal";
import { ReplyDialog, type ReplyAction } from "./ReplyDialog";
import { reviewStep } from "@/lib/journeyDb";
import { notifyReview } from "@/lib/journeyNotify";
import { emailJourneyDecision } from "@/lib/email/client";

/* Journey review queue.

   A student can submit a step and request a stage approval, but only an
   administrator moves either one forward. This is where that happens: every
   pending submission for the plan, with the student it belongs to.

   Row level security already restricts these tables to administrators, so a
   student never reaches this data even if the component were rendered. */

type PendingStep = {
  id: string; user_id: string; step_id: string;
  step_title: string; stage_title: string; student: string;
  /**
   * A support request rather than a piece of work to judge.
   *
   * Stage 5's first step is the student asking for help after they land. There
   * is nothing to reject — the answer is a conversation — so the row offers
   * WhatsApp and Approve, and the queue does not pretend otherwise.
   */
  supportRequest: boolean;
  approveOnly: boolean;
  university: string;
  /** Everything the review modal needs, so opening it costs no extra query. */
  target: ReviewTarget;
};
type PendingStage = {
  id: string; user_id: string; stage_id: string;
  stage_title: string; student: string;
};

export function JourneyApprovals({ plan }: { plan: Plan }) {
  const [steps, setSteps] = useState<PendingStep[]>([]);
  const [stages, setStages] = useState<PendingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewTarget | null>(null);
  /* Each decision is its own dialog, opened from the row. View Details stays
     read-only, so information and action never share a screen. */
  const [action, setAction] = useState<{ row: PendingStep; kind: ReplyAction } | null>(null);

  const load = useCallback(async () => {
    // Scope everything to this plan's published configuration.
    const { data: stageRows } = await supabase
      .from("journey_stages").select("id, title").eq("plan", plan).neq("status", "archived");
    const stageList = (stageRows ?? []) as { id: string; title: string }[];
    const stageTitle = new Map(stageList.map((s) => [s.id, s.title]));

    const { data: stepRows } = await supabase
      .from("journey_steps").select("*").in("stage_id", stageList.map((s) => s.id));
    const stepList = (stepRows ?? []) as DbStep[];
    const stepById = new Map(stepList.map((s) => [s.id, s]));

    const [{ data: progRows }, { data: apprRows }] = await Promise.all([
      supabase.from("journey_progress")
        .select("id, user_id, step_id, state, student_comment, advisor_note, submitted_at, completed_at")
        .eq("state", "in_progress").in("step_id", stepList.map((s) => s.id)),
      supabase.from("journey_stage_approvals").select("id, user_id, stage_id").eq("state", "waiting")
        .in("stage_id", stageList.map((s) => s.id)),
    ]);
    const progress = (progRows ?? []) as {
      id: string; user_id: string; step_id: string; state: string;
      student_comment: string | null; advisor_note: string | null;
      submitted_at: string | null; completed_at: string | null;
    }[];
    const approvals = (apprRows ?? []) as { id: string; user_id: string; stage_id: string }[];

    // One lookup for every student mentioned in the queue.
    const userIds = [...new Set([...progress.map((p) => p.user_id), ...approvals.map((a) => a.user_id)])];
    const { data: people } = userIds.length
      ? await supabase.from("profiles").select("id, full_name, email, whatsapp_country_code, whatsapp_number, country_flow_answers, destination_country").in("id", userIds)
      : { data: [] };
    const person = new Map(((people ?? []) as {
      id: string; full_name: string | null; email: string | null;
      whatsapp_country_code: string | null; whatsapp_number: string | null;
      country_flow_answers: Record<string, unknown> | null; destination_country: string | null;
    }[]).map((p) => [p.id, p]));
    const name = new Map([...person].map(([id, p]) => [id, p.full_name || p.email || "Student"]));

    setSteps(progress.flatMap((p) => {
      const step = stepById.get(p.step_id);
      if (!step) return [];
      const student = name.get(p.user_id) ?? "Student";
      const stage_title = stageTitle.get(step.stage_id) ?? "";
      return [{
        id: p.id, user_id: p.user_id, step_id: p.step_id,
        step_title: step.title, stage_title, student,
        supportRequest: stepIsSupport(step),
        approveOnly: stepApproveOnly(step) || stepIsSupport(step),
        university: (() => {
          /* Derived, not stored: the university lives in the onboarding answers,
             through the same helper the student workspace uses. */
          const who = person.get(p.user_id);
          return deriveStudy(who?.country_flow_answers ?? null, who?.destination_country ?? null)?.university ?? "";
        })(),
        target: {
          progressId: p.id, userId: p.user_id, student,
          studentEmail: person.get(p.user_id)?.email ?? "",
          whatsapp: (() => {
            const who = person.get(p.user_id);
            return who?.whatsapp_number ? `${who.whatsapp_country_code ?? ""}${who.whatsapp_number}` : null;
          })(),
          stageId: step.stage_id, stageTitle: stage_title, step,
          state: p.state,
          studentComment: p.student_comment ?? "",
          advisorNote: p.advisor_note ?? "",
          submittedAt: p.submitted_at,
          completedAt: p.completed_at,
        },
      }];
    }));
    setStages(approvals.map((a) => ({
      id: a.id, user_id: a.user_id, stage_id: a.stage_id,
      stage_title: stageTitle.get(a.stage_id) ?? "Stage",
      student: name.get(a.user_id) ?? "Student",
    })));
    setLoading(false);
  }, [plan]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  // New submissions appear in the queue without a refresh.
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  /* One place performs a step decision, whichever dialog asked for it. */
  const ACTION_STATE = { approve: "completed", reject: "rejected", changes: "pending" } as const;
  const ACTION_OUTCOME = { approve: "approved", reject: "rejected", changes: "changes_requested" } as const;

  const confirmAction = async (input: { message: string; note: string; sendWhatsApp: boolean; sendEmail: boolean }) => {
    if (!action) return;
    const { row, kind } = action;
    setBusy(row.id);
    await reviewStep(row.user_id, row.step_id, ACTION_STATE[kind], input.message, input.note);
    await notifyReview(
      {
        userId: row.user_id, stageId: row.target.stageId, stageTitle: row.stage_title,
        stepId: row.step_id, stepTitle: row.step_title,
        outcome: ACTION_OUTCOME[kind], message: input.message,
      },
      // WhatsApp accompanies approvals only; notifyReview enforces it as well.
      { whatsapp: input.sendWhatsApp ? row.target.whatsapp ?? null : null },
    );
    // Email is off by default on every outcome — only sent when the admin
    // explicitly turns it on for this decision.
    if (input.sendEmail && row.target.studentEmail) {
      void emailJourneyDecision({
        to: row.target.studentEmail,
        studentName: row.student,
        outcome: ACTION_OUTCOME[kind],
        stageTitle: row.stage_title,
        stepTitle: row.step_title,
        note: input.note,
      });
    }
    setAction(null);
    await load();
    setBusy(null);
  };

  const decideStage = async (row: PendingStage, approve: boolean) => {
    setBusy(row.id);
    const { data } = await supabase.auth.getUser();
    await supabase.from("journey_stage_approvals").update({
      state: approve ? "approved" : "rejected",
      reviewed_by: data.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", row.id);
    await load();
    setBusy(null);
  };

  if (loading) return <section className="jm"><Loader block label="Loading the review queue" /></section>;

  const empty = steps.length === 0 && stages.length === 0;

  return (
    <section className="jm">
      <header className="jm-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="jm-title">Review queue</h2>
          <p className="jm-sub">
            Steps and stages students have submitted. A step only turns completed once you approve it here.
          </p>
        </div>
        <span className="jm-count">{steps.length + stages.length} waiting</span>
      </header>

      {empty ? (
        <div className="jm-empty">
          <span className="jm-empty-ico"><Inbox size={24} /></span>
          <div className="jm-empty-title">Nothing waiting for review</div>
          <p className="jm-empty-text">Submitted steps and stage approval requests appear here.</p>
        </div>
      ) : (
        <>
          {stages.map((row) => (
            <div key={row.id} className="jm-review">
              <Pill tone="amber" className="jm-review-tag">Stage</Pill>
              <div className="jm-review-body">
                <div className="jm-review-title">{row.stage_title}</div>
                <div className="jm-review-sub">{row.student} asked for stage approval</div>
              </div>
              <JrButton icon={<XCircle size={14} />} disabled={busy === row.id} onClick={() => decideStage(row, false)}>
                Request changes
              </JrButton>
              <JrButton tone="success" icon={<CircleCheck size={14} />} disabled={busy === row.id} onClick={() => decideStage(row, true)}>
                Approve stage
              </JrButton>
            </div>
          ))}

          {steps.map((row) => (
            <div key={row.id} className={`jm-review${row.supportRequest ? " support" : ""}`}>
              <Pill tone={row.supportRequest ? "amber" : "indigo"} className="jm-review-tag">
                {row.supportRequest ? "Support" : "Step"}
              </Pill>
              <div className="jm-review-body">
                <div className="jm-review-title">{row.step_title}</div>
                <div className="jm-review-sub">
                  {row.student} · {row.stage_title}
                  {/* The Excel asks the request to carry who is asking, from
                      where, and on what number, so the reply needs no lookup. */}
                  {row.supportRequest && row.university && ` · ${row.university}`}
                  {row.supportRequest && row.target.whatsapp && ` · ${row.target.whatsapp}`}
                </div>
              </div>

              <JrButton tone="outline" icon={<Eye size={14} />} onClick={() => setReview(row.target)}>
                View Details
              </JrButton>

              {row.supportRequest && (
                <JrButton
                  icon={<MessageCircle size={14} />}
                  disabled={!row.target.whatsapp}
                  title={row.target.whatsapp ? undefined : "This student has no WhatsApp number on file."}
                  onClick={() => row.target.whatsapp && window.open(
                    whatsappLink(
                      row.target.whatsapp,
                      `Hello ${row.student}, welcome to Lithuania! This is the AfaqWay support team. How can we help you settle in?`,
                    ),
                    "_blank", "noopener,noreferrer",
                  )}
                >
                  Chat with Student
                </JrButton>
              )}

              {/* "Do NOT display a Reject button." A request for help is not
                  work that can fail review, so neither refusal nor a request
                  for changes is offered on one. */}
              {!row.approveOnly && (
                <>
                  <JrButton icon={<RotateCcw size={14} />} disabled={busy === row.id} onClick={() => setAction({ row, kind: "changes" })}>
                    Request Changes
                  </JrButton>
                  <JrButton tone="danger" icon={<XCircle size={14} />} disabled={busy === row.id} onClick={() => setAction({ row, kind: "reject" })}>
                    Reject
                  </JrButton>
                </>
              )}

              <JrButton tone="success" icon={<CircleCheck size={14} />} disabled={busy === row.id} onClick={() => setAction({ row, kind: "approve" })}>
                Approve
              </JrButton>
            </div>
          ))}
        </>
      )}

      {/* Read-only information. */}
      {review && <ReviewModal target={review} onClose={() => setReview(null)} />}

      {/* One dialog per decision, all sharing the same layout. */}
      {action && (
        <ReplyDialog
          action={action.kind}
          student={action.row.student}
          stageTitle={action.row.stage_title}
          stepTitle={action.row.step_title}
          stageId={action.row.target.stageId}
          stepId={action.row.step_id}
          initialNote={action.row.target.advisorNote}
          whatsappNumber={action.row.target.whatsapp}
          studentEmail={action.row.target.studentEmail}
          onCancel={() => setAction(null)}
          onConfirm={confirmAction}
        />
      )}
    </section>
  );
}

export default JourneyApprovals;
