import "server-only";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* The 4-digit gate in front of the Tester Controls panel.

   This code is NOT the security boundary — the tester-account check is. Every
   /api/tester/* route re-checks caller.isTester independently of this endpoint,
   so a normal user who somehow guessed the code still cannot act, and the
   tester still cannot act from a session that isn't theirs. This is a second,
   human-facing gate: even the one account allowed to see the button has to
   type something before the panel opens.

   Server-only on purpose — it is never shipped to a browser bundle ("server-only"
   makes that a build error), never logged, and overridable by an env var so it
   can be rotated without a deploy. */
const TESTER_CODE = (process.env.TESTER_ACCESS_CODE ?? "5400").trim();

export async function POST(req: Request) {
  try {
    const { caller } = await authenticate(req);
    if (!caller.isTester) {
      // Same response whether the account is wrong or the code is wrong —
      // a normal user probing this endpoint learns nothing either way.
      return NextResponse.json({ ok: false, error: "Incorrect code." }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { code?: unknown } | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!/^\d{4}$/.test(code) || code !== TESTER_CODE) {
      return NextResponse.json({ ok: false, error: "Incorrect code." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 401 });
  }
}
