import "server-only";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { serviceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Stage = { id: string; sort_order: number; rules: Record<string, unknown> | null };
type Step = { id: string; stage_id: string };
type Progress = { step_id: string; state: string };
type Approval = { stage_id: string; state: string };

/* How a stage completes — mirrors stageUnlock() in src/lib/journey.ts exactly.
   Kept as a one-line copy rather than an import: that file is "use client",
   and duplicating one ternary here is safer than relying on a client module
   importing cleanly into a route handler. If stageUnlock ever changes, this
   must change with it. */
const unlockOf = (stage: Stage): "auto" | "approval" =>
  (stage.rules as { unlock?: string } | null)?.unlock === "auto" ? "auto" : "approval";

/* A stage is "finished" exactly the way assembleRoadmap() decides it — every
   step settled, and (auto-unlock OR an approved stage_approvals row). This
   route marks stages finished by that same definition so the ordinary
   roadmap, reading the ordinary tables, agrees with what the tester did.

   Deliberately NOT replicated here: assembleRoadmap()'s planBlocked() check,
   which can additionally lock a stage that exists in this plan's row set but
   is marked rules.requiresPlan for the other plan (Stage 5 today). This route
   only filters by journey_stages.plan, so on that one edge case "current" as
   computed here can disagree with what the roadmap shows. Acceptable for a
   QA tool; not acceptable to silently special-case without saying so. */
function isFinished(stage: Stage, steps: Step[], progress: Map<string, string>, approvals: Map<string, string>): boolean {
  const own = steps.filter((s) => s.stage_id === stage.id);
  if (!own.length) return false;
  if (!own.every((s) => { const st = progress.get(s.id); return st === "completed" || st === "skipped"; })) return false;
  return unlockOf(stage) === "auto" || approvals.get(stage.id) === "approved";
}

/* Marks every step in `stages` completed and, unless the stage auto-unlocks,
   its approval approved — bypassing journey_progress_guard /
   journey_stage_approvals_guard on purpose. Only reachable for the tester
   account (checked by the caller before this runs), and only through the
   service-role client: the guards explicitly trust `role = 'service_role'`
   for exactly this kind of legitimate server-side write (see
   journey_privileged() in 09_review_workflow.sql). */
async function completeStages(db: ReturnType<typeof serviceClient>, userId: string, stages: Stage[], steps: Step[]) {
  const now = new Date().toISOString();
  for (const stage of stages) {
    const own = steps.filter((s) => s.stage_id === stage.id);
    for (const step of own) {
      await db!.from("journey_progress").upsert(
        { user_id: userId, step_id: step.id, state: "completed", completed_at: now, submitted_at: now, reviewed_at: now, updated_at: now },
        { onConflict: "user_id,step_id" },
      );
    }
    if (unlockOf(stage) !== "auto") {
      await db!.from("journey_stage_approvals").upsert(
        { user_id: userId, stage_id: stage.id, state: "approved", reviewed_at: now },
        { onConflict: "user_id,stage_id" },
      );
    }
  }
}

export async function POST(req: Request) {
  try {
    const { caller, supabase } = await authenticate(req);
    if (!caller.isTester) return NextResponse.json({ error: "Not available." }, { status: 403 });

    const body = await req.json().catch(() => null) as { action?: unknown; stageId?: unknown } | null;
    const action = body?.action;
    if (action !== "skip-stage" && action !== "jump-stage" && action !== "reset-stage") {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("plan, destination_country").eq("id", caller.id).maybeSingle();
    const plan = (profile as { plan?: string | null } | null)?.plan;
    if (!plan) return NextResponse.json({ error: "This account has no plan yet — finish onboarding to Stage 1 first." }, { status: 400 });
    const country = (profile as { destination_country?: string | null } | null)?.destination_country || "LT";

    if (action === "reset-stage") {
      const stageId = typeof body?.stageId === "string" ? body.stageId : "";
      if (!stageId) return NextResponse.json({ error: "stageId is required." }, { status: 400 });

      // Caller's own RLS-bound client: reverting to 'pending'/'waiting' is
      // exactly what journey_progress_guard already permits a student to do
      // to their own row, so no service role is needed here.
      const { data: steps } = await supabase.from("journey_steps").select("id").eq("stage_id", stageId);
      const now = new Date().toISOString();
      for (const step of (steps ?? []) as { id: string }[]) {
        await supabase.from("journey_progress").upsert(
          { user_id: caller.id, step_id: step.id, state: "pending", updated_at: now },
          { onConflict: "user_id,step_id" },
        );
      }
      await supabase.from("journey_stage_approvals").upsert(
        { user_id: caller.id, stage_id: stageId, state: "waiting" },
        { onConflict: "user_id,stage_id" },
      );
      return NextResponse.json({ ok: true });
    }

    const db = serviceClient();
    if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured — skip/jump needs it. See supabase/migrations and src/lib/supabase/service.ts." }, { status: 503 });

    const { data: stageRows } = await db.from("journey_stages").select("id, sort_order, rules")
      .eq("country", country).eq("plan", plan).eq("status", "published").order("sort_order");
    const stages = (stageRows ?? []) as Stage[];
    if (!stages.length) return NextResponse.json({ error: "No journey configured for this account's country and plan yet." }, { status: 400 });

    const stageIds = stages.map((s) => s.id);
    const { data: stepRows } = await db.from("journey_steps").select("id, stage_id").in("stage_id", stageIds).eq("status", "published");
    const steps = (stepRows ?? []) as Step[];

    const { data: progRows } = await db.from("journey_progress").select("step_id, state").eq("user_id", caller.id);
    const { data: apprRows } = await db.from("journey_stage_approvals").select("stage_id, state").eq("user_id", caller.id);
    const progress = new Map(((progRows ?? []) as Progress[]).map((p) => [p.step_id, p.state]));
    const approvals = new Map(((apprRows ?? []) as Approval[]).map((a) => [a.stage_id, a.state]));

    let target: Stage | undefined;
    let toComplete: Stage[];
    if (action === "skip-stage") {
      target = stages.find((s) => !isFinished(s, steps, progress, approvals));
      if (!target) return NextResponse.json({ ok: true, note: "Every stage is already finished." });
      toComplete = [target]; // finish the current stage — the next one becomes current
    } else {
      const stageId = typeof body?.stageId === "string" ? body.stageId : "";
      target = stages.find((s) => s.id === stageId);
      if (!target) return NextResponse.json({ error: "Unknown stageId for this account's roadmap." }, { status: 400 });
      toComplete = stages.filter((s) => s.sort_order < target!.sort_order); // finish everything before it — target itself opens
    }

    await completeStages(db, caller.id, toComplete, steps);
    return NextResponse.json({ ok: true, stageId: target.id });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 401 });
  }
}
