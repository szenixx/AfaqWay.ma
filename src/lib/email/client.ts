"use client";

import { supabase } from "@/lib/supabase/client";
import type { EmailChannel } from "@/config/email";

/* Asking the platform to send an email, from the browser.
 *
 * The browser never holds the provider key: it posts to /api/email with the
 * caller's own Supabase token, and the server decides whether that person may
 * send anything at all.
 *
 * Every function here resolves rather than throws. Email accompanies an action
 * that has already succeeded, so a mail failure is something to report, never
 * something that should unwind the work. */

export type EmailResult = {
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number;
  /** True when the platform has no provider configured yet. */
  notConfigured?: boolean;
  error?: string;
};

const FAILED = (error: string): EmailResult => ({ ok: false, sent: 0, failed: 1, skipped: 0, error });

async function post(body: unknown): Promise<EmailResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return FAILED("not signed in");

    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const payload = (await res.json().catch(() => ({}))) as Partial<EmailResult> & { error?: string };
    if (!res.ok) return FAILED(payload.error ?? `request failed (${res.status})`);

    return {
      ok: Boolean(payload.ok), sent: payload.sent ?? 0, failed: payload.failed ?? 0,
      skipped: payload.skipped ?? 0, notConfigured: payload.notConfigured, error: payload.error,
    };
  } catch (err) {
    return FAILED(err instanceof Error ? err.message : "network error");
  }
}

/** Platform announcement: journey decisions, documents, payments, notices. */
export function emailAnnouncement(input: {
  to: string | { email: string; name?: string | null }[];
  subject: string;
  message: string;
}): Promise<EmailResult> {
  return post({ channel: "announcement" as EmailChannel, ...input });
}

/** An advisor writing to one student from the chat. */
export function emailAdvisorMessage(input: {
  to: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  return post({ channel: "advisor" as EmailChannel, ...input });
}

/** A short line describing an outcome, for the UI to show verbatim. */
export function describeEmailResult(result: EmailResult): string {
  if (result.notConfigured) return "Email is not configured yet, so nothing was emailed.";
  if (result.ok && result.sent > 0) return `Emailed ${result.sent}.`;
  if (result.failed > 0) return `Emailed ${result.sent}, failed ${result.failed}.`;
  return "Nothing was emailed.";
}
