"use client";

import { supabase } from "@/lib/supabase/client";

/* WhatsApp, as one seam.
 *
 * Nothing in the platform sends a WhatsApp message today, and nothing in the
 * platform should have to change on the day one does. Every message the journey
 * wants to send on WhatsApp is already written, addressed and queued in
 * public.journey_outbox with channel = 'whatsapp' and state = 'ready'.
 *
 * Switching the API on is therefore one job: read `pendingWhatsApp()`, hand each
 * row to the provider, and call `markWhatsAppSent()` / `markWhatsAppFailed()`.
 * No caller moves, no message text moves, no schedule moves.
 *
 * Until then `whatsappLink()` gives an administrator the same words in a wa.me
 * window, so the queue is not the only way a student can be reached.
 */

export type WhatsAppRow = {
  id: string;
  user_id: string;
  event: string;
  title: string;
  body: string;
  link: string;
  state: "pending" | "ready" | "sent" | "cancelled" | "failed";
  due_at: string;
  sent_at: string | null;
  error: string;
  created_at: string;
};

/** The number a student can be reached on, in the wa.me digits-only form. */
export function whatsappNumber(profile: { whatsapp_country_code?: string | null; whatsapp_number?: string | null } | null): string {
  if (!profile) return "";
  const code = (profile.whatsapp_country_code ?? "").replace(/[^\d]/g, "");
  const rest = (profile.whatsapp_number ?? "").replace(/[^\d]/g, "");
  return code && rest ? `${code}${rest}` : rest;
}

/** A wa.me link carrying the exact wording, for the manual route. */
export function whatsappLink(phone: string, body: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

/* ── The queue ────────────────────────────────────────────────────────────── */

/**
 * Messages that have come due and are waiting for a transport.
 *
 * 'ready' is set by journey_outbox_sweep when a due row's channel has no sender
 * wired: the message is not lost, it is parked. This is the function the future
 * integration drains.
 */
export async function pendingWhatsApp(limit = 100): Promise<WhatsAppRow[]> {
  const { data, error } = await supabase
    .from("journey_outbox")
    .select("id, user_id, event, title, body, link, state, due_at, sent_at, error, created_at")
    .eq("channel", "whatsapp")
    .in("state", ["ready", "failed"])
    .order("due_at")
    .limit(limit);
  return error ? [] : ((data ?? []) as WhatsAppRow[]);
}

/** Everything queued for one student, newest first. Used by the admin view. */
export async function whatsAppHistory(userId: string, limit = 50): Promise<WhatsAppRow[]> {
  const { data, error } = await supabase
    .from("journey_outbox")
    .select("id, user_id, event, title, body, link, state, due_at, sent_at, error, created_at")
    .eq("channel", "whatsapp").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(limit);
  return error ? [] : ((data ?? []) as WhatsAppRow[]);
}

/** Called by the future sender once the provider has accepted a message. */
export async function markWhatsAppSent(id: string): Promise<void> {
  await supabase.from("journey_outbox")
    .update({ state: "sent", sent_at: new Date().toISOString(), error: "" })
    .eq("id", id);
}

/** Called by the future sender when the provider refuses one. */
export async function markWhatsAppFailed(id: string, reason: string): Promise<void> {
  await supabase.from("journey_outbox").update({ state: "failed", error: reason }).eq("id", id);
}
