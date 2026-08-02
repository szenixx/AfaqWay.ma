"use client";

import { useState } from "react";
import { CalendarClock, CircleCheck } from "lucide-react";
import { AnimatedModal, Input, TextArea, DialogCard, DialogHead, DialogFoot, fieldIcon } from "@/components/ds";
import { JrButton } from "./parts";
import type { Appointment } from "@/lib/journeyEvents";

/* "Confirm Your VFS Appointment".
 *
 * The Excel is unusually specific here: clicking Mark as Completed must NOT
 * complete the step. It opens this modal, which asks for the appointment date,
 * the time and optional notes, and only then completes the step — because those
 * three answers are what the Schedule event and the four reminders are built
 * from. Completing without them would leave a student with no reminders and no
 * calendar entry, which is the one thing this step exists to produce.
 *
 * The timezone is read from the browser rather than asked for: the student is
 * booking in their own local time and a second question they could get wrong
 * would only make the reminders less accurate.
 */

const today = () => new Date().toISOString().slice(0, 10);

export function VfsAppointmentDialog({ open, existing, busy, onCancel, onSave }: {
  open: boolean;
  /** The appointment already saved, when the student is editing it. */
  existing?: Appointment | null;
  busy?: boolean;
  onCancel: () => void;
  onSave: (appointment: Appointment) => Promise<void> | void;
}) {
  const [date, setDate] = useState(existing?.date ?? "");
  const [time, setTime] = useState(existing?.time ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const ready = Boolean(date && time);

  const save = () =>
    onSave({
      date, time, notes: notes.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });

  return (
    <AnimatedModal open={open} onClose={onCancel} className="dlg" ariaLabel="Confirm your VFS appointment">
      <DialogHead eyebrow="Book Your VFS Appointment" title="Confirm Your VFS Appointment">
        Please enter the official date and time of your VFS appointment exactly as shown in your
        appointment confirmation. This information will be used to automatically schedule reminders.
      </DialogHead>

      <div className="dlg-body">
        <DialogCard title="Appointment details">
          <div className="jr-field2">
            <Input
              type="date" value={date} min={today()} required
              icon={fieldIcon("date")} label="Appointment date"
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              type="time" value={time} required
              icon={<CalendarClock size={17} />} label="Appointment time"
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </DialogCard>

        <DialogCard title="Notes" hint="Optional, only for you. Anything you want to remember on the day.">
          <TextArea
            rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="VFS Global Istanbul, second floor."
          />
        </DialogCard>

        <p className="dlg-note">
          We will add this to your Schedule and remind you 7 days, 3 days, 24 hours and 2 hours
          before, with the documents you need to bring.
        </p>
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>Cancel</JrButton>
        <JrButton
          tone="primary" size="md" icon={<CircleCheck size={15} />}
          disabled={busy || !ready}
          title={ready ? undefined : "Enter the date and the time first."}
          onClick={save}
        >
          {busy ? "Saving…" : existing ? "Update my appointment" : "Save my appointment"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default VfsAppointmentDialog;
