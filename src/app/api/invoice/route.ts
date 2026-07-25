import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { buildInvoiceData, renderInvoicePdf } from "@/services/invoice.service";
import { StorageError } from "@/types/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/invoice — the caller's own subscription invoice as a PDF.
   Both queries run through the caller's token (RLS), so the document can only
   ever contain that user's profile and payment. */
export async function GET(req: Request) {
  try {
    const { caller, supabase } = await authenticate(req);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, city, destination_country, user_number, plan")
      .eq("id", caller.id)
      .maybeSingle();
    if (!profile) throw new StorageError("not_found", "Your profile could not be loaded.", 404);

    const { data: payment } = await supabase
      .from("payments")
      .select("id, plan, amount, currency, method, status, created_at, reviewed_at, reference")
      .eq("user_id", caller.id)
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment) throw new StorageError("not_found", "No approved payment found for your account yet.", 404);

    const data = buildInvoiceData(profile, payment);
    const pdf = await renderInvoicePdf(data);

    return new NextResponse(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AfaqWay-invoice-${data.invoiceId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
