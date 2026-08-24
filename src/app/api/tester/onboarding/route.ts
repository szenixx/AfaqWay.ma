import "server-only";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Tester-only: restart onboarding from the top.

   Onboarding's own fields are not guard-protected (see profiles_guard in
   supabase/migrations/journey/15_profile_guard.sql — plan, plan_status,
   banned etc. are pinned; onboarding_phase/step, country_flow_answers and
   the personal columns are not), so this runs on the caller's own
   RLS-bound client rather than the service role. It only ever touches the
   caller's own row (`.eq("id", caller.id)`), and only after confirming
   caller.isTester — a normal user reaching this code some other way could
   only ever reset their OWN onboarding, which the real wizard already lets
   them do field by field; this just does it in one call.

   Deliberately narrow: plan, plan_status and payment history are untouched
   (and are guard-protected regardless) — "restart onboarding" resets the
   wizard, not a paid plan. */
export async function POST(req: Request) {
  try {
    const { caller, supabase } = await authenticate(req);
    if (!caller.isTester) return NextResponse.json({ error: "Not available." }, { status: 403 });

    const body = await req.json().catch(() => null) as { action?: unknown } | null;
    if (body?.action !== "restart") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

    const { error } = await supabase.from("profiles").update({
      full_name: null, gender: null, date_of_birth: null, city: null,
      whatsapp_country_code: "+212", whatsapp_number: null,
      destination_country: null, has_passport: null,
      country_flow_answers: {},
      onboarding_phase: "universal", onboarding_step: 1,
      onboarding_completed_at: null,
    }).eq("id", caller.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 401 });
  }
}
