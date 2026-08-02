"use client";

import { supabase } from "@/lib/supabase/client";
import { saveEvent, deleteEvent } from "@/lib/scheduleDb";
import type { StepMeta } from "@/lib/journeyDb";

/* The journey's event bus.
 *
 * Everything the journey wants to say — a pinned warning when Stage 4 unlocks,
 * four reminders before a VFS appointment, a congratulations in the chat, a
 * WhatsApp message the day the residence permit is approved — is raised here as
 * an EVENT, never as a message.
 *
 * The caller names what happened. The wording lives in public.journey_templates
 * and the delivery in public.journey_outbox, so:
 *
 *   · a channel that has no transport yet (WhatsApp, email) still records that
 *     the platform meant to send something, and switching it on later means
 *     draining a queue rather than finding every caller;
 *   · a student's browser can schedule a reminder without being able to choose
 *     its words — journey_emit is SECURITY DEFINER and reads the template;
 *   · one event reaching four channels stays one call.
 *
 * Nothing here talks to WhatsApp. That is the point.
 */

/** Every event the journey raises. Each needs a row in journey_templates. */
export type JourneyEvent =
  | "stage_unlocked"
  | "step_completed"
  | "vfs_prepare"
  | "vfs_prepare_followup"
  | "vfs_reminder"
  | "trp_approved"
  | "trp_rejected";

export type EmitOptions = {
  /** Values for the {{placeholders}} in the template. */
  ctx?: Record<string, string>;
  stepId?: string | null;
  stageId?: string | null;
  /** When it should be delivered. Omit for "now". */
  dueAt?: Date | null;
  /** Send this event at most once for this student. */
  once?: string;
  /** Groups scheduled messages so they can be withdrawn together. */
  cancelKey?: string;
  /** Administrators only: raise it for someone else. */
  userId?: string | null;
};

/**
 * Raises one event on every channel its template enables.
 * Returns the number of outbox rows created; 0 means no template matched.
 */
export async function emitJourneyEvent(event: JourneyEvent, options: EmitOptions = {}): Promise<number> {
  const { data, error } = await supabase.rpc("journey_emit", {
    p_event: event,
    p_ctx: options.ctx ?? {},
    p_user: options.userId ?? null,
    p_step_id: options.stepId ?? null,
    p_stage_id: options.stageId ?? null,
    p_due_at: (options.dueAt ?? new Date()).toISOString(),
    p_dedupe_key: options.once ?? null,
    p_cancel_key: options.cancelKey ?? null,
  });
  // A failed message must never take down the action that caused it.
  if (error) { console.warn(`journey event "${event}" not queued`, error.message); return 0; }
  return Number(data ?? 0);
}

/** Withdraws every still-pending message under one cancel key. */
export async function cancelJourneyEvents(cancelKey: string, userId?: string | null): Promise<number> {
  const { data, error } = await supabase.rpc("journey_cancel", {
    p_cancel_key: cancelKey, p_user: userId ?? null,
  });
  if (error) { console.warn("journey events not cancelled", error.message); return 0; }
  return Number(data ?? 0);
}

/* ── The VFS appointment ──────────────────────────────────────────────────── */

/** "7 days before → 3 days before → 24 hours before → 2 hours before." */
export const VFS_REMINDERS = [
  { hoursBefore: 24 * 7, when: "7 days" },
  { hoursBefore: 24 * 3, when: "3 days" },
  { hoursBefore: 24, when: "24 hours" },
  { hoursBefore: 2, when: "2 hours" },
] as const;

export type Appointment = { date: string; time: string; timezone: string; notes: string };

const cancelKeyFor = (stepId: string) => `vfs:${stepId}`;

const readable = (a: Appointment) =>
  new Date(`${a.date}T${a.time || "00:00"}`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

/**
 * Records a booked VFS appointment: the Schedule event, then the four reminders.
 *
 * "If the student edits the appointment date or time later, automatically
 * update the Schedule event, all pending platform notifications and all pending
 * WhatsApp reminders." Editing therefore withdraws the old reminders first and
 * moves the existing calendar event rather than adding a second one.
 *
 * Returns the schedule event id so the step can remember which event is its own.
 */
export async function saveVfsAppointment(input: {
  userId: string;
  stepId: string;
  stageId: string | null;
  appointment: Appointment;
  /** The event this step created last time, if it is being edited. */
  previousEventId?: string;
}): Promise<string | null> {
  const { userId, stepId, stageId, appointment } = input;

  // Any reminder still waiting is about the old date, so it goes first.
  await cancelJourneyEvents(cancelKeyFor(stepId), userId);

  /* "Automatically create a new event in the student's Schedule module … Title:
     VFS Appointment · Category: Immigration · Date & Time: the student's
     selected appointment."

     Left student-owned: schedule_events_guard rewrites created_by to 'student'
     for anything a student's browser inserts anyway, and claiming otherwise
     here would only make the code disagree with the row it produced. The
     reminders are driven by journey_progress.meta, not by this event, so
     deleting it from the calendar cannot silence them. */
  const eventId = await saveEvent({
    id: input.previousEventId,
    userId,
    kind: "appointment",
    title: "VFS Appointment",
    description: appointment.notes
      ? `${appointment.notes}\n\nBring all required original documents. Arrive 15–30 minutes early.`
      : "Bring all required original documents. Arrive 15–30 minutes early.",
    date: appointment.date,
    time: appointment.time,
    category: "Immigration",
  });

  const at = new Date(`${appointment.date}T${appointment.time || "09:00"}`);
  const ctx = { date: readable(appointment), time: appointment.time || "the booked time" };

  for (const reminder of VFS_REMINDERS) {
    const due = new Date(at.getTime() - reminder.hoursBefore * 3600_000);
    // A reminder whose moment has already passed is not worth sending.
    if (due.getTime() <= Date.now()) continue;
    await emitJourneyEvent("vfs_reminder", {
      ctx: { ...ctx, when: reminder.when },
      stepId, stageId, dueAt: due,
      cancelKey: cancelKeyFor(stepId),
      // One reminder per distance per appointment, however often it is saved.
      once: `vfs:${stepId}:${appointment.date}:${appointment.time}:${reminder.when}`,
    });
  }

  return eventId;
}

/** Withdraws an appointment: the calendar event and every pending reminder. */
export async function clearVfsAppointment(userId: string, stepId: string, eventId?: string): Promise<void> {
  await cancelJourneyEvents(cancelKeyFor(stepId), userId);
  if (eventId) await deleteEvent(eventId);
}

/* ── Stage unlock announcements ───────────────────────────────────────────── */

/**
 * Raises a step's one-shot announcement when its stage opens.
 *
 * "The platform notification and WhatsApp message should be sent only once,
 * immediately when Stage 4 is unlocked." Once is enforced in the database by a
 * dedupe key, not by remembering here, so a second tab or a refresh cannot
 * double-send.
 */
export async function announceStage(input: {
  userId: string;
  stepId: string;
  stageId: string;
  announce: { event: string; followUpEvent?: string; followUpHours?: number };
}): Promise<void> {
  const { userId, stepId, stageId, announce } = input;
  const once = `announce:${stepId}`;

  /* Deliberately NO cancel key on the announcement itself. It is due now, and
     giving it the same key as the follow-up meant a student who opened the step
     within one sweep of unlocking cancelled the very warning they were meant to
     read. Only the follow-up is withdrawable. */
  await emitJourneyEvent(announce.event as JourneyEvent, { userId, stepId, stageId, once });

  /* "If the student has not opened the step within 48 hours, automatically send
     one reminder through both the platform and WhatsApp." It is scheduled now
     and withdrawn the moment they open the step. */
  if (announce.followUpEvent && announce.followUpHours) {
    await emitJourneyEvent(announce.followUpEvent as JourneyEvent, {
      userId, stepId, stageId,
      dueAt: new Date(Date.now() + announce.followUpHours * 3600_000),
      once: `${once}:followup`,
      cancelKey: followUpKey(stepId),
    });
  }
}

const followUpKey = (stepId: string) => `announce-followup:${stepId}`;

/**
 * The student opened the step.
 *
 * Two things stop: the 48-hour nudge is withdrawn, and the pinned notification
 * comes off the top of the centre — "pin the notification at the top of the
 * Notifications page UNTIL the student opens this Journey step."
 */
export async function noteStepOpened(userId: string, stepId: string, meta: StepMeta | undefined): Promise<void> {
  if (meta?.openedAt) return;                     // already handled, once is enough
  await cancelJourneyEvents(followUpKey(stepId), userId);
  await supabase.from("notifications")
    .update({ pinned: false })
    .eq("user_id", userId).eq("pinned", true);
}
