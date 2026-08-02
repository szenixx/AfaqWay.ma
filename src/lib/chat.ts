import { supabase } from "@/lib/supabase/client";

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

/** Reactions are stored as `{ "👍": ["user"], "❤️": ["admin"] }` — emoji to
 *  which side reacted with it. At most one reaction per emoji per side. */
export type Reactions = Record<string, ("user" | "admin")[]>;

/** Toggles `emoji` on `messageId` for whichever side the signed-in caller is.
 *  Goes through `react_to_message` (SECURITY DEFINER), not a raw update: the
 *  RPC is what keeps the toggle atomic and every other column untouched. */
export async function toggleReaction(messageId: string, emoji: string): Promise<Reactions | null> {
  const { data, error } = await supabase.rpc("react_to_message", { p_message_id: messageId, p_emoji: emoji });
  if (error || !data?.ok) return null;
  return (data.reactions ?? {}) as Reactions;
}

/** Marks every message from the OTHER side of `userId`'s conversation as seen.
 *  Call this whenever the thread is the thing on screen — a student calls it
 *  with their own id, an admin calls it with the student's id. */
export async function markMessagesSeen(userId: string): Promise<void> {
  await supabase.rpc("mark_messages_seen", { p_user_id: userId });
}

/** A short, fixed palette so the picker is a strip, not a full emoji keyboard —
 *  the reactions a support conversation actually needs. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🙏", "👀", "✅"] as const;
