import "server-only";
import { resendConfigured, resendSend, resendVerify, type ResendPayload } from "./client";
import type { SendEmailResult } from "../types";

/* Resend is the only supported provider. This module owns retry policy and
 * the never-throws contract the rest of the app relies on — a missing key
 * reports "skipped", a real failure reports "failed", and neither one ever
 * throws into the workflow that triggered the send. */

export function emailConfigured(): boolean {
  return resendConfigured();
}

export function providerName(): string {
  return resendConfigured() ? "resend" : "none";
}

const RETRY_DELAYS_MS = [500, 1500]; // one immediate-ish retry, one backed-off retry

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sends with up to 2 retries on transient failures (network errors, 429,
 *  5xx) — never on 4xx validation errors, which fail identically every
 *  time and would just waste the retry budget. */
export async function sendViaResend(payload: ResendPayload): Promise<SendEmailResult> {
  if (!emailConfigured()) {
    return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  }

  let lastError = "unknown error";
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const result = await resendSend(payload);
    if (result.ok) return { status: "sent", id: result.id };
    lastError = result.error;
    if (!result.retryable || attempt === RETRY_DELAYS_MS.length) break;
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
  return { status: "failed", error: lastError };
}

export async function verifyProvider(): Promise<SendEmailResult> {
  if (!emailConfigured()) return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  const result = await resendVerify();
  return result.ok ? { status: "sent", id: "verified" } : { status: "failed", error: result.error };
}
