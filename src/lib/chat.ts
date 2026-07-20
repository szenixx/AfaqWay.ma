// Interactive question messages are stored in the message body as "ASK::{json}".
// A student clicking an option copies its text into their composer to reply.
export function parseAsk(body: string): { q: string; opts: string[] } | null {
  if (!body || !body.startsWith("ASK::")) return null;
  try {
    const o = JSON.parse(body.slice(5));
    if (o && typeof o.q === "string" && Array.isArray(o.opts)) return { q: o.q, opts: o.opts.map(String) };
  } catch { /* ignore */ }
  return null;
}
