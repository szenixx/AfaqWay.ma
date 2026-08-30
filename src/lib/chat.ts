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
  try {
    const { data, error } = await supabase.rpc("react_to_message", { p_message_id: messageId, p_emoji: emoji });
    if (error || !data?.ok) return null;
    return (data.reactions ?? {}) as Reactions;
  } catch {
    // Called fire-and-forget from a tap on an emoji; a network blip must
    // never surface as an unhandled rejection on the chat's own socket.
    return null;
  }
}

/** Marks every message from the OTHER side of `userId`'s conversation as seen.
 *  Call this whenever the thread is the thing on screen — a student calls it
 *  with their own id, an admin calls it with the student's id.
 *
 *  Every caller fires this without awaiting it (mount, or every incoming
 *  message), so a transient network failure — common enough on mobile —
 *  must not become an unhandled promise rejection. Marking "seen" a moment
 *  late is cosmetic; an unhandled rejection on the same client the chat's
 *  own realtime subscription runs on is the kind of thing that has already
 *  destabilised that subscription once before (see advisor.ts). */
export async function markMessagesSeen(userId: string): Promise<void> {
  try {
    await supabase.rpc("mark_messages_seen", { p_user_id: userId });
  } catch {
    /* seen-state is a display hint, never worth surfacing as an error */
  }
}

/** A short, fixed palette so the picker is a strip, not a full emoji keyboard —
 *  the reactions a support conversation actually needs. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🙏", "👀", "✅"] as const;
