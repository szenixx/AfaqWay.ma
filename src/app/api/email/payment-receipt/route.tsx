import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";
import { send } from "@/lib/email/send";
import PaymentReceiptEmail, { meta } from "@/lib/email/templates/billing/PaymentReceiptEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/email/payment-receipt — sent from PaymentReviews.tsx right
 * after an admin approves a payment. A separate route from the generic
 * /api/email (which only takes free-text subject/message): a receipt needs
 * structured fields (plan, amount, method, reference), not a message body. */

type Body = {
  to?: unknown;
  studentName?: unknown;
  planName?: unknown;
  amount?: unknown;
  method?: unknown;
  reference?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) throw new StorageError("invalid_file", "Expected a JSON body.", 400);

    const to = str(body.to);
    if (!EMAIL_RE.test(to)) throw new StorageError("invalid_file", "A valid recipient is required.", 400);

    const studentName = str(body.studentName) || "there";
    const planName = str(body.planName);
    const amount = str(body.amount);
    const method = str(body.method);
    const reference = str(body.reference) || undefined;
    if (!planName || !amount) throw new StorageError("invalid_file", "planName and amount are required.", 400);

    const result = await send({
      to,
      sender: "billing",
      subject: `Your ${planName} payment is confirmed`,
      react: (
        <PaymentReceiptEmail
          studentName={studentName}
          planName={planName}
          amount={amount}
          method={method || "—"}
          reference={reference}
          reviewedDate={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        />
      ),
      template: meta,
    });

    if (result.status === "failed") console.error("[email] payment receipt failed", result.error);
    return NextResponse.json({ ok: result.status === "sent", status: result.status });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
