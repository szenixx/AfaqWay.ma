// storage-sign — bridges Supabase Auth ↔ Cloudflare R2.
// The client never sees R2 credentials. It calls this function with its Supabase
// JWT; the function verifies the user, then returns a short-lived presigned URL
// so the browser uploads/downloads bytes DIRECTLY to/from R2.
//
// Secrets required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_BUCKET = Deno.env.get("R2_BUCKET")!;
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const URL_TTL_SECONDS = 300;

const r2 = new AwsClient({
  accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
  service: "s3",
  region: "auto",
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  let payload: { action?: string; filename?: string; contentType?: string; key?: string; download?: string };
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const prefix = `users/${user.id}/`;

  if (payload.action === "upload") {
    if (!payload.filename) return json({ error: "filename_required" }, 400);
    const key = `${prefix}${crypto.randomUUID()}-${safeName(payload.filename)}`;
    const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`);
    url.searchParams.set("X-Amz-Expires", String(URL_TTL_SECONDS));
    const signed = await r2.sign(url, {
      method: "PUT",
      headers: payload.contentType ? { "content-type": payload.contentType } : undefined,
      aws: { signQuery: true },
    });
    return json({ method: "PUT", url: signed.url, key, expiresIn: URL_TTL_SECONDS });
  }

  if (payload.action === "download") {
    if (!payload.key) return json({ error: "key_required" }, 400);
    // Owner may fetch their own prefix; admins may fetch ANY key (to review chat files + receipts).
    let allowed = payload.key.startsWith(prefix);
    if (!allowed && user.email) {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: admin } = await svc.from("admins").select("role").eq("email", user.email.toLowerCase()).eq("banned", false).maybeSingle();
      allowed = !!admin;
    }
    if (!allowed) return json({ error: "forbidden" }, 403);
    const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${payload.key}`);
    url.searchParams.set("X-Amz-Expires", String(URL_TTL_SECONDS));
    if (payload.download) url.searchParams.set("response-content-disposition", `attachment; filename="${safeName(payload.download)}"`);
    const signed = await r2.sign(url, { method: "GET", aws: { signQuery: true } });
    return json({ method: "GET", url: signed.url, key: payload.key, expiresIn: URL_TTL_SECONDS });
  }

  return json({ error: "unknown_action" }, 400);
});
