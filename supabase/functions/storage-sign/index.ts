// storage-sign — bridges Supabase Auth ↔ Cloudflare R2.
// The client never sees R2 credentials. It calls this function with its Supabase
// JWT; the function verifies the user, then returns a short-lived presigned URL
// so the browser uploads/downloads bytes DIRECTLY to/from R2.
//
// R2 config comes from edge-function env secrets if set, otherwise from the
// locked public.app_secrets table (read with the service role).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const URL_TTL_SECONDS = 300;

type R2Cfg = { accountId: string; accessKey: string; secretKey: string; bucket: string };
let cached: R2Cfg | null = null;
async function getCfg(): Promise<R2Cfg> {
  if (cached) return cached;
  const env = {
    accountId: Deno.env.get("R2_ACCOUNT_ID") ?? "",
    accessKey: Deno.env.get("R2_ACCESS_KEY_ID") ?? "",
    secretKey: Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "",
    bucket: Deno.env.get("R2_BUCKET") ?? "",
  };
  if (env.accountId && env.accessKey && env.secretKey && env.bucket) { cached = env; return cached; }
  const svc = createClient(SUPABASE_URL, SERVICE);
  const { data } = await svc.from("app_secrets").select("name, value").in("name", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]);
  const m: Record<string, string> = {};
  for (const r of (data ?? []) as { name: string; value: string }[]) m[r.name] = r.value;
  cached = {
    accountId: env.accountId || m.R2_ACCOUNT_ID || "",
    accessKey: env.accessKey || m.R2_ACCESS_KEY_ID || "",
    secretKey: env.secretKey || m.R2_SECRET_ACCESS_KEY || "",
    bucket: env.bucket || m.R2_BUCKET || "",
  };
  return cached;
}

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

  const supabase = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  let payload: { action?: string; filename?: string; contentType?: string; key?: string; download?: string };
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const cfg = await getCfg();
  if (!cfg.accountId || !cfg.accessKey || !cfg.secretKey || !cfg.bucket) return json({ error: "r2_not_configured" }, 500);
  const endpoint = `https://${cfg.accountId}.r2.cloudflarestorage.com`;
  const r2 = new AwsClient({ accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey, service: "s3", region: "auto" });
  const prefix = `users/${user.id}/`;

  if (payload.action === "upload") {
    if (!payload.filename) return json({ error: "filename_required" }, 400);
    const key = `${prefix}${crypto.randomUUID()}-${safeName(payload.filename)}`;
    const url = new URL(`${endpoint}/${cfg.bucket}/${key}`);
    url.searchParams.set("X-Amz-Expires", String(URL_TTL_SECONDS));
    const signed = await r2.sign(url, { method: "PUT", headers: payload.contentType ? { "content-type": payload.contentType } : undefined, aws: { signQuery: true } });
    return json({ method: "PUT", url: signed.url, key, expiresIn: URL_TTL_SECONDS });
  }

  if (payload.action === "download") {
    if (!payload.key) return json({ error: "key_required" }, 400);
    let allowed = payload.key.startsWith(prefix);
    if (!allowed && user.email) {
      const svc = createClient(SUPABASE_URL, SERVICE);
      const { data: admin } = await svc.from("admins").select("role").eq("email", user.email.toLowerCase()).eq("banned", false).maybeSingle();
      allowed = !!admin;
    }
    if (!allowed) return json({ error: "forbidden" }, 403);
    const url = new URL(`${endpoint}/${cfg.bucket}/${payload.key}`);
    url.searchParams.set("X-Amz-Expires", String(URL_TTL_SECONDS));
    if (payload.download) url.searchParams.set("response-content-disposition", `attachment; filename="${safeName(payload.download)}"`);
    const signed = await r2.sign(url, { method: "GET", aws: { signQuery: true } });
    return json({ method: "GET", url: signed.url, key: payload.key, expiresIn: URL_TTL_SECONDS });
  }

  return json({ error: "unknown_action" }, 400);
});
