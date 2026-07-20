// whatsapp-webhook — Meta WhatsApp Cloud API webhook.
//
//   GET  -> Meta verification handshake (hub.mode / hub.verify_token / hub.challenge)
//   POST -> inbound messages + message-status updates (sent/delivered/read/failed)
//
// Secrets are read from the edge env first, then the locked public.app_secrets
// table (read with the service role) — same pattern as storage-sign.
//
// IMPORTANT: this function is deployed with verify_jwt = false. Meta does not
// send a Supabase JWT, so JWT verification would 401 every webhook call.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const svc = createClient(SUPABASE_URL, SERVICE);

// ── secrets: env first, then app_secrets (cached per cold start) ──────────────
const SECRET_NAMES = [
  "WHATSAPP_VERIFY_TOKEN",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
] as const;
let cache: Record<string, string> | null = null;
async function secrets(): Promise<Record<string, string>> {
  if (cache) return cache;
  const out: Record<string, string> = {};
  for (const n of SECRET_NAMES) out[n] = Deno.env.get(n) ?? "";
  const missing = SECRET_NAMES.filter((n) => !out[n]);
  if (missing.length) {
    try {
      const { data } = await svc.from("app_secrets").select("name, value").in("name", missing as unknown as string[]);
      for (const r of (data ?? []) as { name: string; value: string }[]) if (!out[r.name]) out[r.name] = r.value ?? "";
    } catch (e) {
      console.error("secrets: app_secrets read failed:", e instanceof Error ? e.message : String(e));
    }
  }
  cache = out;
  return out;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Constant-time string compare (avoids token/signature timing leaks).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Verify Meta's X-Hub-Signature-256 header against the raw body using the app secret.
async function validSignature(raw: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !header.startsWith("sha256=")) return false;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return safeEqual(`sha256=${hex}`, header);
  } catch (e) {
    console.error("signature check error:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

// Persist an event; best-effort — a failure here must never break the 200 response.
async function persist(row: { direction: string; wa_message_id?: string | null; wa_from?: string | null; msg_type?: string | null; status?: string | null; payload: unknown }) {
  try { await svc.from("whatsapp_events").insert(row); }
  catch (e) { console.error("persist failed:", e instanceof Error ? e.message : String(e)); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);

  // ── GET: Meta webhook verification handshake ────────────────────────────────
  if (req.method === "GET") {
    try {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const { WHATSAPP_VERIFY_TOKEN } = await secrets();
      if (!WHATSAPP_VERIFY_TOKEN) {
        console.error("verify: WHATSAPP_VERIFY_TOKEN is not configured");
        return new Response("server not configured", { status: 500, headers: CORS });
      }
      if (mode === "subscribe" && token && safeEqual(token, WHATSAPP_VERIFY_TOKEN)) {
        console.log("verify: challenge accepted");
        return new Response(challenge ?? "", { status: 200, headers: { ...CORS, "Content-Type": "text/plain" } });
      }
      console.warn("verify: rejected (mode or token mismatch)");
      return new Response("forbidden", { status: 403, headers: CORS });
    } catch (e) {
      console.error("verify: unexpected error:", e instanceof Error ? e.message : String(e));
      return new Response("error", { status: 500, headers: CORS });
    }
  }

  // ── POST: inbound events. Always ACK 200 fast so Meta doesn't retry-storm. ──
  if (req.method === "POST") {
    try {
      const raw = await req.text();

      // Optional signature verification (only when META_APP_SECRET is set).
      const { META_APP_SECRET } = await secrets();
      if (META_APP_SECRET) {
        const ok = await validSignature(raw, req.headers.get("x-hub-signature-256"), META_APP_SECRET);
        if (!ok) {
          console.warn("post: invalid X-Hub-Signature-256 — payload not trusted, acking without processing");
          return new Response("ok", { status: 200, headers: CORS });
        }
      } else {
        console.warn("post: META_APP_SECRET not set — skipping signature verification");
      }

      let body: Record<string, unknown> = {};
      try { body = JSON.parse(raw || "{}"); } catch { console.error("post: body is not valid JSON"); }

      const entries = Array.isArray((body as { entry?: unknown }).entry) ? (body as { entry: unknown[] }).entry : [];
      for (const entry of entries) {
        const changes = Array.isArray((entry as { changes?: unknown }).changes) ? (entry as { changes: unknown[] }).changes : [];
        for (const change of changes) {
          const value = ((change as { value?: unknown }).value ?? {}) as Record<string, unknown>;

          // Inbound messages
          const messages = Array.isArray(value.messages) ? (value.messages as Record<string, unknown>[]) : [];
          for (const m of messages) {
            const id = String(m.id ?? "");
            const from = String(m.from ?? "");
            const type = String(m.type ?? "unknown");
            const text = type === "text" ? String((m.text as { body?: string })?.body ?? "") : "";
            console.log(`wa:message id=${id} from=${from} type=${type}${text ? ` text=${JSON.stringify(text.slice(0, 200))}` : ""}`);
            await persist({ direction: "inbound", wa_message_id: id || null, wa_from: from || null, msg_type: type, status: null, payload: m });
          }

          // Message status updates
          const statuses = Array.isArray(value.statuses) ? (value.statuses as Record<string, unknown>[]) : [];
          for (const s of statuses) {
            const id = String(s.id ?? "");
            const status = String(s.status ?? "unknown"); // sent | delivered | read | failed
            const recipient = String(s.recipient_id ?? "");
            const errs = Array.isArray(s.errors) ? s.errors : undefined;
            console.log(`wa:status id=${id} status=${status} recipient=${recipient}${errs ? ` errors=${JSON.stringify(errs)}` : ""}`);
            await persist({ direction: "status", wa_message_id: id || null, wa_from: recipient || null, msg_type: null, status, payload: s });
          }

          if (!messages.length && !statuses.length) {
            console.log("wa:event (no messages/statuses)", JSON.stringify(value).slice(0, 500));
          }
        }
      }

      return new Response("ok", { status: 200, headers: CORS });
    } catch (e) {
      // Never fail a webhook POST — log and still ACK so Meta keeps the subscription healthy.
      console.error("post: unexpected error:", e instanceof Error ? e.message : String(e));
      return new Response("ok", { status: 200, headers: CORS });
    }
  }

  return new Response("method not allowed", { status: 405, headers: CORS });
});
