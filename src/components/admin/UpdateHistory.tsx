"use client";

import { useEffect, useRef, useState } from "react";
import { History, Trash2, X } from "lucide-react";
import { AnimatedModal, BrandLogo, DialogFoot, DialogHead } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { deleteUpdate, clearUpdates, type PlatformUpdate } from "@/lib/notifications";

/* Previously sent announcements, in a compact popover beside Add Update.

   Deleting an announcement removes the record, not the notifications students
   already received: those are theirs, and quietly retracting something people
   have read would be worse than leaving the history tidy. Clearing everything
   asks first, because it cannot be undone. */

export function UpdateHistory({ updates, onChanged, canManage }: {
  updates: PlatformUpdate[];
  onChanged: () => void;
  /** Only a super admin may delete; everyone else browses. */
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [reading, setReading] = useState<PlatformUpdate | null>(null);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, like every other menu on the platform.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const removeOne = async (id: string) => {
    setBusy(true);
    await deleteUpdate(id);
    await onChanged();
    setBusy(false);
  };

  const clearAll = async () => {
    setBusy(true);
    await clearUpdates();
    await onChanged();
    setBusy(false);
    setConfirmClear(false);
    setOpen(false);
  };

  const stamp = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="uh" ref={root}>
      <button
        type="button" className="jr-btn jr-btn-quiet jr-btn-md" onClick={() => setOpen((v) => !v)}
        aria-expanded={open} aria-haspopup="true"
      >
        <History size={15} />Update History
        {updates.length > 0 && <span className="uh-count">{updates.length}</span>}
      </button>

      {open && (
        <div className="uh-pop" role="menu">
          <div className="uh-pop-head">
            <b>Previous updates</b>
            {canManage && updates.length > 0 && (
              <button type="button" className="uh-clear" onClick={() => setConfirmClear(true)}>Clear all</button>
            )}
          </div>

          {updates.length === 0 ? (
            <p className="stp-hint stp-hint-grey" style={{ margin: 0, padding: "14px 4px" }}>
              <History size={14} />No updates have been sent yet.
            </p>
          ) : (
            <ul className="uh-list">
              {updates.map((u) => (
                <li key={u.id}>
                  <button type="button" className="uh-item" onClick={() => { setReading(u); setOpen(false); }}>
                    <span className="uh-item-title">{u.title}</span>
                    <time>{stamp(u.created_at)}</time>
                  </button>
                  {canManage && (
                    <button
                      type="button" className="chat-act" title={`Delete "${u.title}"`} disabled={busy}
                      onClick={() => removeOne(u.id)} style={{ color: "var(--red)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Reading one update back, in the same voice the student received it. */}
      {reading && (
        <AnimatedModal open onClose={() => setReading(null)} className="dlg" ariaLabel={reading.title}>
          <DialogHead eyebrow={stamp(reading.created_at)} title={reading.title} />
          <div className="dlg-body">
            <div className="upd-identity">
              <BrandLogo size={30} />
              <span><b>AfaqWay</b><em>{reading.author_email ?? "AfaqWay Platform"}</em></span>
            </div>
            {reading.body && <p className="upd-item-body" style={{ marginTop: 14 }}>{reading.body}</p>}
            {reading.attachments?.length > 0 && (
              <p className="upd-item-files">{reading.attachments.length} attachment(s)</p>
            )}
          </div>
          <DialogFoot>
            <JrButton tone="primary" size="md" onClick={() => setReading(null)}>Close</JrButton>
          </DialogFoot>
        </AnimatedModal>
      )}

      {confirmClear && (
        <AnimatedModal open onClose={() => setConfirmClear(false)} className="dlg" ariaLabel="Clear update history">
          <DialogHead title="Clear the whole update history?">
            This removes every announcement record. Students keep the notifications they already
            received, and nothing is sent to them. This cannot be undone.
          </DialogHead>
          <DialogFoot>
            <JrButton tone="quiet" size="md" disabled={busy} onClick={() => setConfirmClear(false)}>Cancel</JrButton>
            <JrButton tone="danger" size="md" icon={<X size={15} />} disabled={busy} onClick={clearAll}>
              {busy ? "Clearing…" : `Clear ${updates.length} update(s)`}
            </JrButton>
          </DialogFoot>
        </AnimatedModal>
      )}
    </div>
  );
}

export default UpdateHistory;
