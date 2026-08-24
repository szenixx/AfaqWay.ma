"use client";

import { supabase } from "@/lib/supabase/client";

/* Browser-side entry points for the Tester Controls panel.

   Every call carries the caller's own Supabase access token, exactly like
   lib/storage/client.ts does for uploads — the route on the other end
   verifies it, re-checks caller.isTester independently of anything this
   file does, and only then acts. Nothing here is trusted by the server; it
   is trusted to build the request correctly. */

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are signed out. Please sign in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function post<T = { ok: boolean }>(path: string, body: Record<string, unknown>): Promise<T & { error?: string }> {
  const res = await fetch(path, { method: "POST", headers: await authHeader(), body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({})) as T & { error?: string };
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
}

export const verifyTesterCode = (code: string) =>
  post<{ ok: boolean }>("/api/tester/verify-code", { code });

export const restartOnboarding = () =>
  post("/api/tester/onboarding", { action: "restart" });

export const skipJourneyStage = () =>
  post<{ ok: boolean; stageId?: string; note?: string }>("/api/tester/journey", { action: "skip-stage" });

export const jumpJourneyStage = (stageId: string) =>
  post<{ ok: boolean; stageId?: string }>("/api/tester/journey", { action: "jump-stage", stageId });

export const resetJourneyStage = (stageId: string) =>
  post("/api/tester/journey", { action: "reset-stage", stageId });

export type NotifyScenario =
  | "platform_update" | "journey_approved" | "journey_rejected" | "journey_changes"
  | "advisor_reminder" | "unread";

export const sendTestNotification = (scenario: NotifyScenario) =>
  post("/api/tester/notify", { scenario });

export const markAllTestNotificationsRead = () =>
  post("/api/tester/notify", { action: "mark_all_read" });
