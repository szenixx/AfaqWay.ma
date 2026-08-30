"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import { Button, Chip, Label, ListBox, Select, Skeleton } from "@heroui/react";
import { supabase } from "@/lib/supabase/client";
import { emitJourneyEvent } from "@/lib/journeyEvents";
import { reviewStep, logEvent, fetchStages, fetchSteps, type Plan } from "@/lib/journeyDb";
import { refreshReviewAlerts } from "@/lib/reviewAlerts";

/* The administrator's half of the residence permit decision.
 *
 * The Excel splits this step by plan. Self Service students report the outcome
 * themselves in a modal; for Full Service, "the application status is managed
 * entirely by administrators", and "the step must be automatically marked as
 * Completed only when an administrator updates the student's application status
 * to Residence Permit Approved or Residence Permit Rejected".
 *
 * So this is not a display field. Recording the outcome here is what:
 *   · completes the "Waiting for Final Decision" step;
 *   · unlocks the next stage, when approved;
 *   · sends the platform notification, the chat message, the email and the
 *     WhatsApp message — all through the one event bus, so the words are the
 *     same ones a Self Service student would have triggered.
 */

export type TrpStatus = "none" | "approved" | "rejected";

const OPTIONS = [
  { value: "none", label: "No decision recorded" },
  { value: "approved", label: "Residence Permit Approved" },
  { value: "rejected", label: "Residence Permit Rejected" },
] as const;

const ICON: Record<TrpStatus, typeof CircleCheck> = {
  none: ShieldQuestion, approved: CircleCheck, rejected: CircleX,
};
const TONE: Record<TrpStatus, "default" | "success" | "danger"> = {
  none: "default", approved: "success", rejected: "danger",
};

export function TrpStatusCard({ userId, plan, degree }: {
  userId: string;
  plan: string | null;
  degree?: string | null;
}) {
  const [status, setStatus] = useState<TrpStatus>("none");
  const [choice, setChoice] = useState<TrpStatus>("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("trp_status").eq("id", userId).maybeSingle();
    const current = ((data as { trp_status?: string } | null)?.trp_status ?? "none") as TrpStatus;
    setStatus(current);
    setChoice(current);
    setLoading(false);
  }, [userId]);
  // Reading the current value from Supabase; the state is the query result.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /** Finds the step this decision settles, by the rule it carries. */
  const findDecisionStep = async () => {
    const stages = await fetchStages((plan ?? "self_service") as Plan, "LT", false, degree);
    const steps = await fetchSteps(stages.map((s) => s.id));
    const step = steps.find((s) => (s.rules as { decision?: string })?.decision === "trp");
    return step ? { step, stageId: step.stage_id } : null;
  };

  const record = async () => {
    setBusy(true);
    setNote("");

    const { error } = await supabase.from("profiles").update({ trp_status: choice }).eq("id", userId);
    if (error) { setNote(`Could not save: ${error.message}`); setBusy(false); return; }

    const target = await findDecisionStep();

    if (choice === "approved" && target) {
      /* An administrator's approval completes the step the ordinary way, so the
         review trail records who decided it and when. Stage 5 then opens on its
         own: the stage is marked to unlock automatically, precisely so a
         decision the Migration Department already made does not queue for a
         second approval. */
      await reviewStep(userId, target.step.id, "completed", "Residence permit approved.");
      await logEvent({
        user_id: userId, step_id: target.step.id, stage_id: target.stageId,
        kind: "trp_approved", actor: "admin", message: "Recorded an approved residence permit.",
      });
    } else if (choice === "rejected" && target) {
      // "Do not mark the Journey step as completed. Keep the current step active."
      await logEvent({
        user_id: userId, step_id: target.step.id, stage_id: target.stageId,
        kind: "trp_rejected", actor: "admin", message: "Recorded a rejected residence permit.",
      });
    }

    if (choice !== "none") {
      await emitJourneyEvent(choice === "approved" ? "trp_approved" : "trp_rejected", {
        userId, stepId: target?.step.id ?? null, stageId: target?.stageId ?? null,
        once: `trp:${userId}`,
      });
    }

    setStatus(choice);
    setNote(
      choice === "approved" ? "Recorded. The student has been notified and the next stage is open."
        : choice === "rejected" ? "Recorded. A support conversation has been opened with the student."
        : "Decision cleared.",
    );
    // This decides a step outside JourneyApprovals' own flow, so it needs the
    // same explicit badge refresh — otherwise an approval recorded here never
    // clears the sidebar dot.
    void refreshReviewAlerts();
    setBusy(false);
  };

  if (loading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  const Icon = ICON[status];
  const dirty = choice !== status;

  return (
    <div className="afq-mini-card">
      <div className="afq-mini-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Chip color={TONE[status]} size="sm" variant="soft"><Icon size={13} /></Chip>
          <div style={{ minWidth: 0 }}>
            <div className="afq-mini-title">Residence permit decision</div>
            <div className="afq-mini-sub">Completes the final step, opens the next stage when approved.</div>
          </div>
        </div>
      </div>

      <Select onSelectionChange={(k) => setChoice(String(k) as TrpStatus)} selectedKey={choice}>
        <Label className="sr-only">Application status</Label>
        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover>
          <ListBox>
            {OPTIONS.map((o) => (
              <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Button isDisabled={busy || !dirty} onPress={record} size="sm" variant="primary">
          {busy ? "Recording…" : "Record decision"}
        </Button>
        {note && <span className="afq-mini-sub">{note}</span>}
      </div>

      {choice === "rejected" && dirty && (
        <p className="afq-dialog-desc">
          The journey step stays open on purpose. The student is asked for their rejection letter so an
          advisor can review the case with them.
        </p>
      )}
    </div>
  );
}

export default TrpStatusCard;
