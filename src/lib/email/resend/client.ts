import "server-only";

/* The only place that talks to Resend's HTTP API. Fetch-only, no SDK — same
 * reasoning as the rest of this codebase's external integrations (R2, the
 * old ZeptoMail transport): one dependency-free call site that works on any
 * runtime, easy to mock in tests, nothing to keep a socket open for. */

export type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type ResendCallResult = { ok: true; id: string } | { ok: false; error: string; retryable: boolean };

const env = (name: string) => (process.env[name] ?? "").trim();
const apiKey = () => env("RESEND_API_KEY");

export function resendConfigured(): boolean {
  return Boolean(apiKey());
}

/** One HTTP attempt — no retry here, that's the caller's job (resend/provider.ts). */
export async function resendSend(payload: ResendPayload): Promise<ResendCallResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        ...(payload.tags ? { tags: payload.tags } : {}),
      }),
    });

    if (!res.ok) {
      // The service's own message is the useful part; the key is never in it.
      const detail = await res.text().catch(() => "");
      // 429 (rate limit) and 5xx are worth retrying; 4xx validation errors
      // (bad address, unverified sender) will fail identically every time.
      const retryable = res.status === 429 || res.status >= 500;
      return { ok: false, error: `resend responded ${res.status}: ${detail.slice(0, 200)}`, retryable };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (!data.id) return { ok: false, error: "resend accepted the request but returned no id", retryable: false };
    return { ok: true, id: data.id };
  } catch (err) {
    // Network failure — always worth one retry.
    return { ok: false, error: err instanceof Error ? err.message : "network error", retryable: true };
  }
}

/** A cheap, side-effect-free authenticated GET, to confirm the key itself
 *  actually works rather than just being present.
 *
 *  Resend API keys can be scoped to "Sending access" only — the right,
 *  least-privilege choice for a production key that only ever needs to call
 *  POST /emails — and a key scoped that way is correctly refused on GET
 *  /domains with a 401 `restricted_api_key`. That response proves the key
 *  IS valid (an actually-invalid key gets a different error), so it's
 *  treated as a pass here rather than "unreachable" — this check exists to
 *  catch a genuinely dead or wrong key, not to demand a permission the
 *  production key deliberately doesn't have. Once this misread the second
 *  case as the first, since this endpoint was the only thing this function
 *  ever tried, and every restricted key looked exactly like a broken one. */
export async function resendVerify(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey()}` },
    });
    if (res.ok) return { ok: true };

    const detail = await res.json().catch(() => null) as { name?: string; message?: string } | null;
    if (res.status === 401 && detail?.name === "restricted_api_key") return { ok: true };

    return { ok: false, error: `resend responded ${res.status}${detail?.message ? `: ${detail.message}` : ""}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "resend verify failed" };
  }
}
