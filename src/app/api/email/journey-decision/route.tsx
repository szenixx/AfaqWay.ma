import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";
import { send } from "@/lib/email/send";
import JourneyDecisionEmail, { meta } from "@/lib/email/templates/advisor/JourneyDecisionEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/email/journey-decision — sent from JourneyApprovals.tsx
 * alongside notifyReview() (the existing in-app chat + WhatsApp delivery),
 * as a third channel for the same event so a decision isn't missed if the
 * student isn't in the app. Structured fields, same reason as
 * payment-receipt: not a fit for the generic free-text /api/email route. */

type Body = {
  to?: unknown;
  studentName?: unknown;
  outcome?: unknown;
  stageTitle?: unknown;
  stepTitle?: unknown;
  note?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OUTCOMES = new Set(["approved", "rejected", "changes_requested"]);

export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) throw new StorageError("invalid_file", "Expected a JSON body.", 400);

    const to = str(body.to);
    if (!EMAIL_RE.test(to)) throw new StorageError("invalid_file", "A valid recipient is required.", 400);

    const outcome = str(body.outcome);
    if (!OUTCOMES.has(outcome)) throw new StorageError("invalid_file", "outcome must be approved, rejected or changes_requested.", 400);

    const stageTitle = str(body.stageTitle);
    const stepTitle = str(body.stepTitle);
    if (!stageTitle || !stepTitle) throw new StorageError("invalid_file", "stageTitle and stepTitle are required.", 400);

    const studentName = str(body.studentName) || "there";
    const note = str(body.note) || undefined;
    const titleFor: Record<string, string> = { approved: "Step approved", rejected: "Step rejected", changes_requested: "Changes requested" };

    const result = await send({
      to,
      sender: "advisor",
      subject: `${titleFor[outcome]}: ${stepTitle}`,
      react: (
        <JourneyDecisionEmail
          studentName={studentName}
          outcome={outcome as "approved" | "rejected" | "changes_requested"}
          stageTitle={stageTitle}
          stepTitle={stepTitle}
          note={note}
        />
      ),
      template: meta,
    });

    if (result.status === "failed") console.error("[email] journey decision failed", result.error);
    return NextResponse.json({ ok: result.status === "sent", status: result.status });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
