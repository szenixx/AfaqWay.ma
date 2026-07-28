import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";
import { sendBulkEmail, sendEmail, emailConfigured } from "@/services/email.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/email — the single sending endpoint for the platform.
 *
 * Administrators only. The provider key lives on the server and never reaches
 * the browser, so a client can ask for an email but can never send one itself,
 * and cannot discover the credential by inspecting the bundle.
 *
 * Body:
 *   { channel: "announcement" | "advisor",
 *     subject: string,
 *     message: string,
 *     to: string | { email, name? }[] }
 *
 * Replies with { ok, sent, failed, skipped, notConfigured?, error? }. A send
 * failure is reported, not thrown: the caller decides what to tell the user. */

type Body = {
  channel?: unknown;
  subject?: unknown;
  message?: unknown;
  to?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    // Only staff may send platform email; a student never can.
    if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) throw new StorageError("invalid_file", "Expected a JSON body.", 400);

    const channel = str(body.channel) === "advisor" ? "advisor" : "announcement";
    const subject = str(body.subject);
    const message = str(body.message);
    if (!subject) throw new StorageError("invalid_file", "A subject is required.", 400);
    if (!message) throw new StorageError("invalid_file", "A message is required.", 400);

    // One recipient or many; the service batches when there are many.
    if (Array.isArray(body.to)) {
      const recipients = body.to
        .map((r) => (typeof r === "string" ? { email: r } : r as { email?: unknown; name?: unknown }))
        .map((r) => ({ email: str(r.email), name: str(r.name) || null }))
        .filter((r) => r.email);
      if (!recipients.length) throw new StorageError("invalid_file", "No valid recipients.", 400);

      const outcome = await sendBulkEmail(recipients, { channel, subject, message });
      return NextResponse.json({ ok: outcome.failed === 0, ...outcome });
    }

    const to = str(body.to);
    if (!to) throw new StorageError("invalid_file", "A recipient is required.", 400);

    const outcome = await sendEmail({ channel, to, subject, message, recipientName: null });
    return NextResponse.json({ ok: outcome.failed === 0, ...outcome });
  } catch (err) {
    return storageErrorResponse(err);
  }
}

/** GET /api/email — whether email is switched on. Never reveals the key. */
export async function GET(req: Request) {
  try {
    const caller = await requireCaller(req);
    if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);
    return NextResponse.json({ configured: emailConfigured() });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
