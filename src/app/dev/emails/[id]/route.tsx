import { notFound } from "next/navigation";
import { render } from "@react-email/render";
import { findPreviewEntry, SUPABASE_EXPORT } from "@/lib/email/preview/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /dev/emails/[id] — renders one template to real, standalone email
 * HTML (or plain text with ?format=text). Never sends anything. Gated to
 * NODE_ENV === "development" so it's structurally unreachable once the app
 * is actually deployed, regardless of routing/auth — the same guarantee a
 * production build gets automatically, not something that depends on a
 * flag being remembered to flip. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { id } = await params;
  const entry = findPreviewEntry(id);
  if (!entry) notFound();

  const params2 = new URL(req.url).searchParams;
  const format = params2.get("format");
  const wantsSupabaseExport = params2.get("supabase") === "1";
  const supabaseRender = wantsSupabaseExport ? SUPABASE_EXPORT[id] : undefined;
  if (wantsSupabaseExport && !supabaseRender) notFound();
  const el = supabaseRender ? supabaseRender() : entry.render();

  if (format === "text") {
    const text = await render(el, { plainText: true });
    return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const html = await render(el);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
