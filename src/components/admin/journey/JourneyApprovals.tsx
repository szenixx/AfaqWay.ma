"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Eye, Inbox, RotateCcw, XCircle, MessageCircle } from "lucide-react";
import { Button, Chip, Skeleton, Tooltip } from "@heroui/react";
import { supabase } from "@/lib/supabase/client";
import { stepApproveOnly, stepIsSupport, subscribeJourney, type DbStep, type Plan } from "@/lib/journeyDb";
import { whatsappLink } from "@/lib/whatsapp";
import { deriveStudy } from "@/lib/studyApplication";
import { ReviewModal, type ReviewTarget } from "./ReviewModal";
import { ReplyDialog, type ReplyAction } from "./ReplyDialog";
import { reviewStep } from "@/lib/journeyDb";
import { notifyReview } from "@/lib/journeyNotify";
import { emailJourneyDecision } from "@/lib/email/client";
import { refreshReviewAlerts } from "@/lib/reviewAlerts";

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
    // The sidebar badge counts this same row: dropping it here means the dot
    // clears the moment the decision lands, instead of waiting on a Realtime
    // event that depends on this table's replication being live.
    void refreshReviewAlerts();
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
    void refreshReviewAlerts();
    setBusy(null);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-16 w-full rounded-2xl" key={i} />)}
      </div>
    );
  }

  const empty = steps.length === 0 && stages.length === 0;

  return (
    <div className="afq-mini-card" style={{ gap: 12 }}>
      <div className="afq-mini-head">
        <div style={{ minWidth: 0 }}>
          <div className="afq-mini-title" style={{ fontSize: 14 }}>Review queue</div>
          <div className="afq-mini-sub">Steps and stages students have submitted. A step only turns completed once you approve it here.</div>
        </div>
        <Chip color={steps.length + stages.length > 0 ? "warning" : "default"} size="sm" variant="soft">
          {steps.length + stages.length} waiting
        </Chip>
      </div>

      {empty ? (
        <div className="afq-empty">
          <Inbox size={20} />
          <p>Nothing waiting for review. Submitted steps and stage approval requests appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((row) => (
            <div className="afq-mini-card" key={row.id} style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
              <Chip color="warning" size="sm" variant="soft">Stage</Chip>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div className="afq-mini-title">{row.stage_title}</div>
                <div className="afq-mini-sub">{row.student} asked for stage approval</div>
              </div>
              <Button isDisabled={busy === row.id} onPress={() => decideStage(row, false)} size="sm" variant="secondary">
                <XCircle size={14} /> Request changes
              </Button>
              <Button isDisabled={busy === row.id} onPress={() => decideStage(row, true)} size="sm" variant="primary">
                <CircleCheck size={14} /> Approve stage
              </Button>
            </div>
          ))}

          {steps.map((row) => (
            <div className="afq-mini-card" key={row.id} style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
              <Chip color={row.supportRequest ? "warning" : "accent"} size="sm" variant="soft">
                {row.supportRequest ? "Support" : "Step"}
              </Chip>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="afq-mini-title">{row.step_title}</div>
                <div className="afq-mini-sub">
                  {row.student} · {row.stage_title}
                  {/* The Excel asks the request to carry who is asking, from
                      where, and on what number, so the reply needs no lookup. */}
                  {row.supportRequest && row.university && ` · ${row.university}`}
                  {row.supportRequest && row.target.whatsapp && ` · ${row.target.whatsapp}`}
                </div>
              </div>

              <Button onPress={() => setReview(row.target)} size="sm" variant="tertiary">
                <Eye size={14} /> View Details
              </Button>

              {row.supportRequest && (
                <Tooltip isDisabled={!!row.target.whatsapp}>
                  <Tooltip.Trigger>
                    <Button
                      isDisabled={!row.target.whatsapp}
                      onPress={() => row.target.whatsapp && window.open(
                        whatsappLink(
                          row.target.whatsapp,
                          `Hello ${row.student}, welcome to Lithuania! This is the AfaqWay support team. How can we help you settle in?`,
                        ),
                        "_blank", "noopener,noreferrer",
                      )}
                      size="sm" variant="secondary"
                    >
                      <MessageCircle size={14} /> Chat with Student
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>This student has no WhatsApp number on file.</Tooltip.Content>
                </Tooltip>
              )}

              {/* "Do NOT display a Reject button." A request for help is not
                  work that can fail review, so neither refusal nor a request
                  for changes is offered on one. */}
              {!row.approveOnly && (
                <>
                  <Button isDisabled={busy === row.id} onPress={() => setAction({ row, kind: "changes" })} size="sm" variant="secondary">
                    <RotateCcw size={14} /> Request Changes
                  </Button>
                  <Button isDisabled={busy === row.id} onPress={() => setAction({ row, kind: "reject" })} size="sm" variant="danger-soft">
                    <XCircle size={14} /> Reject
                  </Button>
                </>
              )}

              <Button isDisabled={busy === row.id} onPress={() => setAction({ row, kind: "approve" })} size="sm" variant="primary">
                <CircleCheck size={14} /> Approve
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Read-only information. */}
      {review && <ReviewModal onClose={() => setReview(null)} target={review} />}

      {/* One dialog per decision, all sharing the same layout. */}
      {action && (
        <ReplyDialog
          action={action.kind}
          initialNote={action.row.target.advisorNote}
          onCancel={() => setAction(null)}
          onConfirm={confirmAction}
          stageId={action.row.target.stageId}
          stageTitle={action.row.stage_title}
          stepId={action.row.step_id}
          stepTitle={action.row.step_title}
          student={action.row.student}
          studentEmail={action.row.target.studentEmail}
          whatsappNumber={action.row.target.whatsapp}
        />
      )}
    </div>
  );
}

export default JourneyApprovals;
