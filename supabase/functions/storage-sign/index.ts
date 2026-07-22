// storage-sign — bridges Supabase Auth ↔ Cloudflare R2.
// The client never sees R2 credentials. It calls this function with its Supabase
// JWT; the function verifies the user, then returns a short-lived presigned URL
// so the browser uploads/downloads bytes DIRECTLY to/from R2.
//
// Signing is a hand-rolled AWS SigV4 query presign (Web Crypto) — verified to
// work against R2. (aws4fetch produced an invalid signature for R2 presigns.)
//
// R2 config comes from edge-function env secrets if set, otherwise from the
// locked public.app_secrets table (read with the service role).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const URL_TTL_SECONDS = 300;

type R2Cfg = { accountId: string; accessKey: string; secretKey: string; bucket: string };
let cached: R2Cfg | null = null;
async function getCfg(): Promise<R2Cfg> {
  if (cached) return cached;
  // The locked public.app_secrets table is the source of truth (verified working);
  // edge-function env vars are only a fallback for any missing field.
  const svc = createClient(SUPABASE_URL, SERVICE);
  const { data } = await svc.from("app_secrets").select("name, value").in("name", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]);
  const m: Record<string, string> = {};
  for (const r of (data ?? []) as { name: string; value: string }[]) m[r.name] = r.value;
  const env = (k: string) => Deno.env.get(k) ?? "";
  cached = {
    accountId: (m.R2_ACCOUNT_ID || env("R2_ACCOUNT_ID")).trim(),
    accessKey: (m.R2_ACCESS_KEY_ID || env("R2_ACCESS_KEY_ID")).trim(),
    secretKey: (m.R2_SECRET_ACCESS_KEY || env("R2_SECRET_ACCESS_KEY")).trim(),
    bucket: (m.R2_BUCKET || env("R2_BUCKET")).trim(),
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

// ── AWS SigV4 query presign (Web Crypto) ──────────────────────────────────────
const enc = new TextEncoder();
function hex(buf: ArrayBuffer) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
async function sha256hex(msg: string) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(msg))); }
async function signingKey(secret: string, ds: string) {
  let k: ArrayBuffer | Uint8Array = enc.encode("AWS4" + secret);
  k = await hmac(k, ds); k = await hmac(k, "auto"); k = await hmac(k, "s3"); return await hmac(k, "aws4_request");
}
function encodePath(key: string) { return "/" + key.split("/").map(encodeURIComponent).join("/"); }

async function presign(method: string, endpoint: string, host: string, bucket: string, key: string, cfg: R2Cfg, ttl: number, extra: Record<string, string> = {}): Promise<string> {
  const now = new Date();
  const amz = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // YYYYMMDDTHHMMSSZ
  const ds = amz.slice(0, 8);
  const scope = `${ds}/auto/s3/aws4_request`;
  const uri = "/" + bucket + encodePath(key);
  const q: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKey}/${scope}`,
    "X-Amz-Date": amz,
    "X-Amz-Expires": String(ttl),
    "X-Amz-SignedHeaders": "host",
    ...extra,
  };
  const qs = Object.keys(q).sort().map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`).join("&");
  const canonical = `${method}\n${uri}\n${qs}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const sts = `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${await sha256hex(canonical)}`;
  const sig = hex(await hmac(await signingKey(cfg.secretKey, ds), sts));
  return `${endpoint}${uri}?${qs}&X-Amz-Signature=${sig}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabase = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  let payload: { action?: string; filename?: string; contentType?: string; key?: string; download?: string; folder?: string; ttl?: number };
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const cfg = await getCfg();
  if (!cfg.accountId || !cfg.accessKey || !cfg.secretKey || !cfg.bucket) return json({ error: "r2_not_configured" }, 500);
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}`;
  const prefix = `users/${user.id}/`;

  if (payload.action === "upload") {
    if (!payload.filename) return json({ error: "filename_required" }, 400);
    // Organize uploads into per-type folders (avatars/, receipts/, chat/, documents/…).
    const folder = payload.folder ? safeName(payload.folder).replace(/_+/g, "-") + "/" : "";
    const key = `${prefix}${folder}${crypto.randomUUID()}-${safeName(payload.filename)}`;
    const url = await presign("PUT", endpoint, host, cfg.bucket, key, cfg, URL_TTL_SECONDS);
    return json({ method: "PUT", url, key, expiresIn: URL_TTL_SECONDS });
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
    const ttl = Math.min(Math.max(Number(payload.ttl) || URL_TTL_SECONDS, 60), 86400); // 1min–24h (avatars use long TTL)
    const extra = payload.download ? { "response-content-disposition": `attachment; filename="${safeName(payload.download)}"` } : {};
    const url = await presign("GET", endpoint, host, cfg.bucket, payload.key, cfg, ttl, extra);
    return json({ method: "GET", url, key: payload.key, expiresIn: ttl });
  }

  return json({ error: "unknown_action" }, 400);
});
